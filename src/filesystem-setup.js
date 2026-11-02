
var __fs_initialized;
var __fs_errored;
var __fs_waiting_callbacks = [];

const desktop_folder_path = "/Desktop/";

const web_server_root = "/";

// The C: drive is the site's C/ folder: files are downloaded from there as they're opened,
// and anything changed, added or deleted is kept in this browser (IndexedDB).
const drive_url_root = web_server_root + "C";

// The desktop runs the filesystem, and the programs in its windows (iframes) use it through a MessagePort,
// so that every window sees the same files. (ZenFS's IndexedDB store is only safe to use from one place.)
// A program opened on its own, outside of the desktop, runs its own.
function find_filesystem_host() {
	for (let ancestor = window; ancestor !== ancestor.parent;) {
		ancestor = ancestor.parent;
		try {
			if (ancestor.is_filesystem_host) {
				return ancestor;
			}
		} catch (error) {
			return null; // a page from another site
		}
	}
	return null;
}
const filesystem_host = find_filesystem_host();
window.is_filesystem_host = !filesystem_host;

// Deleting one of the site's own files can't remove it from the server, so the deletion is noted in a journal
// (kept in localStorage, as JSON: ZenFS's own text format for it breaks on paths with spaces)
const journal_storage_key = "filesystem-deleted-files";
class SavedJournal extends ZenFS.Journal {
	add(op, path) {
		super.add(op, path);
		this.save();
	}
	delete(op, path) {
		super.delete(op, path);
		this.save();
	}
	save() {
		try {
			localStorage.setItem(journal_storage_key, JSON.stringify(this.entries));
		} catch (error) {
			// no local storage
		}
	}
	load() {
		try {
			this.entries = JSON.parse(localStorage.getItem(journal_storage_key)) || [];
		} catch (error) {
			// no local storage
		}
		return this;
	}
}

function configure_filesystem() {
	if (filesystem_host) {
		const channel = new MessageChannel();
		// (ZenFS listens with addEventListener, which doesn't start the port by itself)
		channel.port1.start();
		filesystem_host.postMessage({ type: "connect-to-filesystem" }, location.origin, [channel.port2]);
		return ZenFS.configure({
			mounts: {
				// Opening a big file on a slow connection takes a while; it's all the same filesystem, so there's no hurry to give up
				"/": { backend: ZenFS.Port, port: channel.port1, timeout: 5 * 60 * 1000, disableAsyncCache: true },
			},
		});
	}

	const journal = new SavedJournal().load();
	// Deletions made in other tabs
	addEventListener("storage", (event) => {
		if (event.key === journal_storage_key || event.key === null) {
			journal.load();
		}
	});
	addEventListener("message", (event) => {
		if (event.origin === location.origin && event.data?.type === "connect-to-filesystem" && event.ports[0]) {
			filesystem_ready.then(() => {
				ZenFS.attachFS(event.ports[0], ZenFS.mounts.get("/"));
				event.ports[0].start();
			});
		}
	});
	// Files are only downloaded when they're opened (disableAsyncCache), and nothing is copied into memory up front.
	return ZenFS.configure({
		mounts: {
			"/": {
				backend: ZenFS.CopyOnWrite,
				journal,
				readable: {
					backend: ZenFS.Fetch,
					index: web_server_root + "filesystem-index.json",
					baseUrl: new URL(drive_url_root, location.href).href,
					disableAsyncCache: true,
				},
				// (not the "C:" store BrowserFS used, which has a different format)
				writable: { backend: ZenFS.IndexedDB, storeName: "C: drive", disableAsyncCache: true },
			},
		},
	});
}

// Whether a file on the drive is the site's own, unchanged copy (so it can be linked to on the server)
if (window.is_filesystem_host) {
	window.is_file_from_site = async function (file_path) {
		const drive = ZenFS.mounts.get("/");
		return !drive.isDeleted(file_path) && await drive.readable.exists(file_path) && !(await drive.writable.exists(file_path));
	};
}

const filesystem_ready = configure_filesystem();
filesystem_ready.then(function () {
	__fs_initialized = true;
	for (var i = 0; i < __fs_waiting_callbacks.length; i++) {
		__fs_waiting_callbacks[i]();
	}
	__fs_waiting_callbacks = [];
}, function (error) {
	__fs_errored = true;
	if (__fs_waiting_callbacks.length) {
		alert("The filesystem is not available. It failed to initialize.");
	}
	__fs_waiting_callbacks = [];
	// TODO: message box; offer to reset the filesystem
	throw error;
});

// Starting the filesystem usually takes well under a second, but it downloads filesystem-index.json
// (and a program's window waits for the desktop's), so a slow connection or a busy device can make it take longer. What's asked of it in the meantime
// still happens once it's ready; this only says something if it seems stuck.
setTimeout(function () {
	if (!__fs_initialized && !__fs_errored && __fs_waiting_callbacks.length) {
		alert("The filesystem is taking a long time to start.");
	}
}, 30000);

function withFilesystem(callback) {
	if (__fs_initialized) {
		callback();
	} else if (__fs_errored) {
		alert("The filesystem is not available. It failed to initialize.");
	} else {
		__fs_waiting_callbacks.push(callback);
	}
}
// TODO: never use alert(); use thematic, non-blocking dialog windows, preferably with warning and error icons
// I have a show_error_message in jspaint, but with no warning or error icons - as of writing; see https://github.com/1j01/jspaint/issues/84

function file_name_from_path(file_path) {
	return file_path.split("\\").pop().split("/").pop();
}

function file_extension_from_path(file_path) {
	return (file_path.match(/\.(\w+)$/) || [, ""])[1];
}

// The URL of a file or folder of the drive on this server ("/My Documents" => "/C/My%20Documents")
function drive_path_to_url(drive_path) {
	return drive_url_root + drive_path.split("/").map(encodeURIComponent).join("/");
}

// Turns a virtual filesystem path (e.g. from a ?path= query parameter) into a URL on this server.
// Returns null for anything that isn't a plain absolute path with one of the allowed extensions,
// so the result can't point at another origin or smuggle in a query string.
function file_path_to_url(file_path, allowed_extensions) {
	if (typeof file_path !== "string" || !file_path.startsWith("/") || file_path.startsWith("//")) {
		return null;
	}
	if (!allowed_extensions.includes(file_extension_from_path(file_path).toLowerCase())) {
		return null;
	}
	return drive_path_to_url(file_path);
}

var mime_types_by_extension = {
	bmp: "image/bmp",
	gif: "image/gif",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	pdf: "application/pdf",
	png: "image/png",
	webp: "image/webp",
};

// Like file_path_to_url, but for files that may only exist in this browser (dropped onto the desktop, saved from Paint, ...).
// Files the site serves keep their URL (so a downloaded PDF keeps its name); the rest are read into a blob: URL.
// Calls back with (error, url).
function file_path_to_viewable_url(file_path, allowed_extensions, callback) {
	var url = file_path_to_url(file_path, allowed_extensions);
	if (!url) {
		return callback(new Error("not a supported file path"));
	}
	withFilesystem(function () {
		var fs = ZenFS.fs;
		fs.exists(file_path, function (exists) {
			if (!exists) {
				return callback(new Error("file not found"));
			}
			(filesystem_host || window).is_file_from_site(file_path).then(function (from_site) {
				if (from_site) {
					return callback(null, url);
				}
				fs.readFile(file_path, function (error, buffer) {
					if (error) {
						return callback(error);
					}
					var type = mime_types_by_extension[file_extension_from_path(file_path).toLowerCase()];
					callback(null, URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: type })));
				});
			}, callback);
		});
	});
}
