// What the operating system shows of the desktop's icons and the C: drive's files, as its files.json says (src/operating-systems.js):
// { "desktop": { "<icon's title>": true or false, ... }, "drive": { "/<path on the drive>": true or false, ... } }
// The drive is the same for every operating system, and so are the desktop's icons; each just doesn't show some of them:
// a file or folder isn't shown if it's false, or a folder it's in is. Anything not listed is shown
// (Windows' own files, scripts/locked-files.json, and the files visitors save).
// The drive keeps them out of sight (hide_files in src/filesystem-setup.js), so Explorer, Find, Run and the rest don't see them,
// and the desktop leaves out the icons (src/programs.js).

let os_files = { desktop: {}, drive: {} };

// (once loaded, which the drive waits for, and the desktop's icons; if it can't be, everything is shown)
const os_files_ready = fetch(booted_os.files)
	.then((response) => {
		if (!response.ok) {
			throw new Error(`${response.status} ${response.statusText}`);
		}
		return response.json();
	})
	.then((files) => {
		os_files = { desktop: {}, drive: {}, ...files };
	}, (error) => {
		console.error(`Failed to load ${booted_os.files}, so everything is shown:`, error);
	});

function is_shown_on_desktop(title) {
	return os_files.desktop[title] !== false;
}

// (a path on the drive: "/My Documents/CV (EN).pdf")
function is_shown_on_drive(path) {
	for (let at = path; at; at = at.slice(0, at.lastIndexOf("/"))) {
		if (os_files.drive[at] === false) {
			return false;
		}
	}
	return true;
}

// Whether there's anything not shown in a folder (which can't be removed or moved then, to keep it)
function has_files_not_shown_in(folder_path) {
	const prefix = folder_path.replace(/\/?$/, "/");
	return Object.entries(os_files.drive).some(([path, shown]) => shown === false && path.startsWith(prefix));
}
