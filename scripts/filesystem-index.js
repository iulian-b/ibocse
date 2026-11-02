// Builds filesystem-index.json: the list of files on the desktop's C: drive, which is the C/ folder.
// ZenFS's Fetch backend (src/filesystem-setup.js) reads it to know what's on the drive, then downloads files as they're opened.
// The dev server (vite.config.mjs) serves it fresh on every request; the build (scripts/build.js) writes it into dist/.
// Usage: node scripts/filesystem-index.js [site root] [out.json]   (prints to stdout without out.json)

const fs = require("fs");
const path = require("path");

// The folder (in the site's root) that is the C: drive
const drive_folder = "C";

const ignored_names = /^(\.|desktop\.ini$|thumbs\.db$)/i;
// Files are downloaded from <site>/C/<path>, so their names can't contain what URLs give a special meaning
const unservable_names = /[#?%\\]/;

const S_IFDIR = 0o040000;
const S_IFREG = 0o100000;

// Windows' own files (C:\Windows, C:\Program Files, ...) are on the drive for show: they're listed in locked-files.json
// with a size, so they look the part, but there's nothing behind them to download. They have no permissions,
// which the desktop takes to mean that opening them is denied (is_locked_file in src/filesystem-setup.js).
// In the list, a folder is an object and a file is its size in bytes. Folders in it are Windows' own:
// they and everything in them, real files too (like C:\Windows\Notepad.exe), show the list's date,
// or that of the nearest folder in it that sets "@modified".
const default_locked_files = require("./locked-files.json");

// The index format of @zenfs/core's Fetch backend: { version: 1, entries: { "/path": inode } }
function make_filesystem_index(site_root, locked_files = default_locked_files) {
	const entries = {};
	let next_ino = 0;
	// The date the list gives a real file or folder, if it's in one of the list's folders
	const listed_mtime = (drive_path) => {
		let folder = locked_files.files;
		let modified = null;
		for (const name of drive_path.split("/").filter(Boolean)) {
			const child = folder[name];
			if (typeof child !== "object") {
				break;
			}
			folder = child;
			modified = child["@modified"] ?? modified ?? locked_files.modified;
		}
		return modified && Date.parse(modified);
	};
	const add = (drive_path, stats) => {
		entries[drive_path] = {
			ino: next_ino++,
			mode: stats.isDirectory() ? S_IFDIR | 0o755 : S_IFREG | 0o644,
			size: stats.isDirectory() ? 4096 : stats.size,
			mtimeMs: listed_mtime(drive_path) || Math.round(stats.mtimeMs),
			nlink: 1,
		};
	};
	const add_listed = (folder, drive_path, modified) => {
		for (const [name, value] of Object.entries(folder)) {
			if (name === "@modified") {
				continue;
			}
			const child_drive_path = (drive_path === "/" ? "" : drive_path) + "/" + name;
			const child_modified = value["@modified"] ?? modified;
			if (!entries[child_drive_path]) { // (a real file or folder of the same name is used instead)
				entries[child_drive_path] = {
					ino: next_ino++,
					mode: typeof value === "object" ? S_IFDIR | 0o755 : S_IFREG,
					size: typeof value === "object" ? 4096 : value,
					mtimeMs: Date.parse(child_modified),
					nlink: 1,
				};
			}
			if (typeof value === "object") {
				add_listed(value, child_drive_path, child_modified);
			}
		}
	};
	const add_folder = (dir, drive_path) => {
		const names = fs.readdirSync(dir).sort((a, b) => a.localeCompare(b));
		for (const name of names) {
			if (ignored_names.test(name)) {
				continue;
			}
			const child_drive_path = (drive_path === "/" ? "" : drive_path) + "/" + name;
			if (unservable_names.test(name)) {
				console.warn(`Skipping ${drive_folder}${child_drive_path}: file names on the drive can't contain # ? % or \\`);
				continue;
			}
			const stats = fs.statSync(path.join(dir, name));
			add(child_drive_path, stats);
			if (stats.isDirectory()) {
				add_folder(path.join(dir, name), child_drive_path);
			}
		}
	};
	const drive_dir = path.join(site_root, drive_folder);
	add("/", fs.statSync(drive_dir));
	add_folder(drive_dir, "/");
	add_listed(locked_files.files, "/", locked_files.modified);
	return { version: 1, entries };
}

module.exports = { drive_folder, make_filesystem_index };

if (require.main === module) {
	const [site_root = ".", out_file] = process.argv.slice(2);
	const json = JSON.stringify(make_filesystem_index(site_root));
	if (out_file) {
		fs.writeFileSync(out_file, json + "\n");
	} else {
		console.log(json);
	}
}
