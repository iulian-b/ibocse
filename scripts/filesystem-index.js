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

// The index format of @zenfs/core's Fetch backend: { version: 1, entries: { "/path": inode } }
function make_filesystem_index(site_root) {
	const entries = {};
	let next_ino = 0;
	const add = (drive_path, stats) => {
		entries[drive_path] = {
			ino: next_ino++,
			mode: stats.isDirectory() ? S_IFDIR | 0o755 : S_IFREG | 0o644,
			size: stats.isDirectory() ? 4096 : stats.size,
			mtimeMs: Math.round(stats.mtimeMs),
			nlink: 1,
		};
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
