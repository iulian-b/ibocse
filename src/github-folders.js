// Folders on the drive with one of my projects from GitHub in them (in C:\Desktop\Projects): what's in the project's
// repository, as it is on GitHub now. None of it is kept in this site: the folder is on the drive, with a shortcut to the
// repository's page in it (GitHub.url), and the rest is listed by GitHub's API the first time the folder is looked in,
// then downloaded from GitHub as it's opened. None of it can be changed (access is denied), and the folders can't be moved.
// (The desktop's drive has them, src/filesystem-setup.js, and the programs' windows through it; its Content-Security-Policy
// lets it connect to GitHub for them, index.html.) A folder added here needs to be on the drive, in C/, too.
const github_folders = {
	"/Desktop/Projects/caverna": "iulian-b/caverna",
	"/Desktop/Projects/fox-conky": "iulian-b/fox-conky",
	"/Desktop/Projects/ibocse": "iulian-b/ibocse",
	"/Desktop/Projects/old-homepage-v2": "iulian-b/homepage-v2",
	"/Desktop/Projects/puzzlecraft-android15": "iulian-b/puzzlecraft-android15",
	"/Desktop/Projects/sqlcipher_win64": "iulian-b/caverna-pysqlcipher",
	"/Desktop/Projects/stegosaurus": "iulian-b/stegosaurus",
};

// The GitHub folder that a path is, or is in: its repository, and the path's in it ("/" for the folder itself)
function github_folder_of(path) {
	for (const [folder, repository] of Object.entries(github_folders)) {
		if (path === folder || path.startsWith(folder + "/")) {
			return { folder, repository, path: path.slice(folder.length) || "/" };
		}
	}
	return null;
}

// Whether a folder is, or has in it, a GitHub folder (which moving it would leave behind)
function has_github_folders_in(folder_path) {
	const prefix = folder_path.replace(/\/?$/, "/");
	return Object.keys(github_folders).some((folder) => folder === folder_path || folder.startsWith(prefix));
}

// Where a file or folder in a GitHub folder is on GitHub (for MDView's links, programs/mdview), or undefined
function github_page_of(path) {
	const at = github_folder_of(path);
	if (at) {
		const page = "https://github.com/" + at.repository;
		return at.path === "/" ? page : page + "/blob/HEAD" + at.path.split("/").map(encodeURIComponent).join("/");
	}
}

// Each repository's listing, from GitHub's API: { entries: Map(path in it => { is_folder, size, ino }),
// names: Map(folder's path in it => names), mtimeMs }. Listed once (a failure is tried again a little later).
const github_listings = new Map(); // repository => Promise of its listing
const github_listings_listed = new Map(); // repository => its listing, once listed (for the synchronous methods)
let github_next_ino = 0x67680000;

function list_github_repository(repository) {
	let listing = github_listings.get(repository);
	if (!listing) {
		listing = fetch(`https://api.github.com/repos/${repository}/git/trees/HEAD?recursive=1`).then(async (response) => {
			if (!response.ok) {
				throw new Error(`${response.status} ${response.statusText}`);
			}
			const { tree } = await response.json();
			const entries = new Map([["/", { is_folder: true, size: 4096, ino: github_next_ino++ }]]);
			const names = new Map([["/", []]]);
			const names_in = (folder) => names.get(folder) ?? names.set(folder, []).get(folder);
			for (const { path, type, size } of tree) {
				const is_folder = type !== "blob"; // (a submodule, "commit", is an empty folder)
				const entry_path = "/" + path;
				entries.set(entry_path, { is_folder, size: is_folder ? 4096 : size, ino: github_next_ino++ });
				if (is_folder) {
					names_in(entry_path);
				}
				names_in(entry_path.slice(0, entry_path.lastIndexOf("/")) || "/").push(path.slice(path.lastIndexOf("/") + 1));
			}
			// (all of it as of when the repository was last pushed to)
			const mtimeMs = Date.parse(response.headers.get("Last-Modified")) || Date.now();
			return { entries, names, mtimeMs };
		});
		listing.then((listed) => {
			github_listings_listed.set(repository, listed);
		}, (error) => {
			console.warn(`Couldn't list ${repository} on GitHub, so its folder only has what's on the drive:`, error);
			setTimeout(() => github_listings.delete(repository), 30 * 1000);
		});
		github_listings.set(repository, listing);
	}
	return listing;
}

function github_stats(listing, entry) {
	const { mtimeMs } = listing;
	return {
		ino: entry.ino,
		mode: entry.is_folder ? 0o040000 | 0o555 : 0o100000 | 0o444, // (read-only)
		size: entry.size,
		atimeMs: mtimeMs,
		mtimeMs,
		ctimeMs: mtimeMs,
		birthtimeMs: mtimeMs,
		nlink: 1,
		uid: 0,
		gid: 0,
	};
}

// The files downloaded lately, by URL (a program can read one in parts, or again), up to about 64 MB of them
const github_downloads = new Map(); // URL => Promise of its data, the latest last
const github_downloads_limit = 64 * 1024 * 1024;

function download_from_github(repository, path) {
	const url = `https://raw.githubusercontent.com/${repository}/HEAD${path.split("/").map(encodeURIComponent).join("/")}`;
	let download = github_downloads.get(url);
	github_downloads.delete(url);
	download ??= fetch(url).then(async (response) => {
		if (!response.ok) {
			throw new Error(`${response.status} ${response.statusText}`);
		}
		const data = new Uint8Array(await response.arrayBuffer());
		download.size = data.byteLength;
		let kept = 0;
		for (const [old_url, old_download] of [...github_downloads].reverse()) {
			if (kept > github_downloads_limit) {
				github_downloads.delete(old_url);
			}
			kept += old_download.size ?? 0;
		}
		return data;
	});
	download.catch(() => github_downloads.delete(url));
	github_downloads.set(url, download);
	return download;
}

// Puts the GitHub folders' repositories on the drive (the CopyOnWrite filesystem mounted on "/", whose paths are the drive's):
// they're added to the folders, can be looked at and read, and nothing in the folders can be made, changed, moved or deleted.
// (Done before the operating systems hide some of the drive's files, so that what's hidden is never looked up on GitHub.)
function show_github_folders(drive) {
	const fail = (code, syscall, path) => Object.assign(ZenFS.withErrno(code), { syscall, path });
	// For a path in a GitHub folder (not the folder itself), its repository's listing and what's at the path in it
	const look_up = async (path) => {
		const at = github_folder_of(path);
		if (!at || at.path === "/") {
			return null;
		}
		const listing = await list_github_repository(at.repository).catch(() => null);
		return listing && { ...at, listing, entry: listing.entries.get(at.path) };
	};
	const look_up_listed = (path) => {
		const at = github_folder_of(path);
		const listing = at && at.path !== "/" && github_listings_listed.get(at.repository);
		return listing ? { ...at, listing, entry: listing.entries.get(at.path) } : null;
	};
	// The folder itself has what's on the drive (GitHub.url) and the repository's top folder
	const with_repository = (names, listing) => [...names, ...(listing?.names.get("/") ?? []).filter((name) => !names.includes(name))];
	const read_from = (found, buffer, start, end) => download_from_github(found.repository, found.path).then(
		(data) => { buffer.set(data.subarray(start, end)); },
		(error) => {
			console.warn(`Couldn't download ${found.path} of ${found.repository} from GitHub:`, error);
			throw fail("EIO", "read", found.folder + found.path);
		},
	);

	const original = {};
	for (const method of ["stat", "readdir", "read", "touch", "streamRead"]) {
		original[method] = drive[method];
		original[method + "Sync"] = drive[method + "Sync"];
	}
	drive.stat = async function (path) {
		const found = await look_up(path);
		return found?.entry ? github_stats(found.listing, found.entry) : original.stat.call(this, path);
	};
	drive.statSync = function (path) {
		const found = look_up_listed(path);
		return found?.entry ? github_stats(found.listing, found.entry) : original.statSync.call(this, path);
	};
	drive.readdir = async function (path) {
		const at = github_folder_of(path);
		if (at?.path === "/") {
			const names = await original.readdir.call(this, path);
			return with_repository(names, await list_github_repository(at.repository).catch(() => null));
		}
		const found = await look_up(path);
		if (found?.entry) {
			if (!found.entry.is_folder) {
				throw fail("ENOTDIR", "readdir", path);
			}
			return [...found.listing.names.get(found.path)];
		}
		return original.readdir.call(this, path);
	};
	drive.readdirSync = function (path) {
		const at = github_folder_of(path);
		if (at?.path === "/") {
			return with_repository(original.readdirSync.call(this, path), github_listings_listed.get(at.repository));
		}
		const found = look_up_listed(path);
		if (found?.entry) {
			if (!found.entry.is_folder) {
				throw fail("ENOTDIR", "readdir", path);
			}
			return [...found.listing.names.get(found.path)];
		}
		return original.readdirSync.call(this, path);
	};
	drive.read = async function (path, buffer, start, end) {
		const found = await look_up(path);
		return found?.entry ? read_from(found, buffer, start, end) : original.read.call(this, path, buffer, start, end);
	};
	drive.readSync = function (path, buffer, start, end) {
		if (look_up_listed(path)?.entry) {
			throw fail("EAGAIN", "read", path); // (downloading takes a while)
		}
		return original.readSync.call(this, path, buffer, start, end);
	};
	// Reading a file notes when it was (as its file handle is closed): that isn't kept, as nothing else about it is
	drive.touch = async function (path, metadata) {
		if ((await look_up(path))?.entry) {
			return;
		}
		return original.touch.call(this, path, metadata);
	};
	drive.touchSync = function (path, metadata) {
		if (look_up_listed(path)?.entry) {
			return;
		}
		return original.touchSync.call(this, path, metadata);
	};
	drive.streamRead = function (path, options) {
		const found = look_up_listed(path);
		if (!found?.entry) {
			return original.streamRead.call(this, path, options);
		}
		return new ReadableStream({
			start: async (controller) => {
				const data = await download_from_github(found.repository, found.path);
				controller.enqueue(data.slice(options.start ?? 0, options.end));
				controller.close();
			},
		});
	};

	// Nothing in a GitHub folder (nor the folder) can be made, changed or deleted, and no folder with one in it can be moved
	const deny = (syscall, path) => {
		if (github_folder_of(path)) {
			throw fail("EACCES", syscall, path);
		}
	};
	const checks = {
		write: (path) => deny("write", path),
		createFile: (path) => deny("open", path),
		mkdir: (path) => deny("mkdir", path),
		unlink: (path) => deny("unlink", path),
		rmdir: (path) => deny("rmdir", path),
		rename: (old_path, new_path) => {
			deny("rename", old_path);
			deny("rename", new_path);
			if (has_github_folders_in(old_path)) {
				throw fail("EACCES", "rename", old_path);
			}
		},
		link: (path, new_path) => { deny("link", path); deny("link", new_path); },
	};
	for (const [method, check] of Object.entries(checks)) {
		const original_async = drive[method];
		const original_sync = drive[method + "Sync"];
		// (failing as each does: a promise rejects, the other throws)
		drive[method] = async function (...args) {
			check(...args);
			return original_async.apply(this, args);
		};
		drive[method + "Sync"] = function (...args) {
			check(...args);
			return original_sync.apply(this, args);
		};
	}
	const original_stream_write = drive.streamWrite;
	drive.streamWrite = function (path, ...args) {
		deny("write", path);
		return original_stream_write.call(this, path, ...args);
	};
}
