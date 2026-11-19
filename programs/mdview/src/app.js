window.defaultMessageBoxTitle = "MDView";

var query = Object.fromEntries(new URLSearchParams(location.search));
var file_path = query.path;
var file_name = file_path && file_name_from_path(file_path);
var default_file_name_for_title = "Untitled";

// markdown-it's defaults keep this safe for any file: HTML in the text is shown as text,
// and links to javascript: and the like are left out.
var markdown = markdownit({ linkify: true });

function update_title() {
	document.title = (file_name || default_file_name_for_title) + " - MDView";

	if (frameElement && frameElement.$window) {
		frameElement.$window.title(document.title);
	}
}

function show_markdown(text) {
	// (made in a template, where nothing loads, so its pictures aren't looked for next to this page before they're pointed elsewhere)
	var rendered = document.createElement("template");
	rendered.innerHTML = markdown.render(text);
	var $document = rendered.content;

	// Relative links and pictures point next to the file, and links open in a new tab rather than in this window.
	// Pictures on the drive are read from it (they may be only in this browser, or in a GitHub folder), and in a GitHub folder
	// (on the desktop: src/github-folders.js), links to what's in it go to its page on GitHub.
	var folder_url = new URL(drive_path_to_url(file_path.replace(/[^/]*$/, "")), location.href);
	var github_page_of = (filesystem_host || window).github_page_of;
	$document.querySelectorAll("img[src]").forEach(function (img) {
		var url = new URL(img.getAttribute("src"), folder_url);
		var drive_path = drive_path_of_url(url);
		if (!drive_path) {
			img.src = url;
			return;
		}
		img.removeAttribute("src");
		file_path_to_viewable_url(drive_path, picture_extensions, function (error, viewable_url) {
			if (!error) {
				img.src = viewable_url;
			}
		});
	});
	for (var link of $document.querySelectorAll("a[href]")) {
		if (link.getAttribute("href").startsWith("#")) {
			continue;
		}
		var url = new URL(link.getAttribute("href"), folder_url);
		var drive_path = drive_path_of_url(url);
		link.href = (drive_path && github_page_of && github_page_of(drive_path)) || url;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
	}
	document.getElementById("document").replaceChildren($document);
}

var picture_extensions = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"];

// "/C/My%20Documents/a.png" on this site => "/My Documents/a.png", or null for anything else
function drive_path_of_url(url) {
	if (url.origin !== location.origin || !url.pathname.startsWith(drive_url_root + "/")) {
		return null;
	}
	try {
		return decodeURIComponent(url.pathname.slice(drive_url_root.length));
	} catch (error) {
		return null; // (not a name a file could have)
	}
}

update_title();

if (file_path) {
	withFilesystem(function () {
		var fs = ZenFS.fs;
		fs.readFile(file_path, "utf8", function (error, content) {
			if (error) {
				showMessageBox({ iconID: "error", message: "Cannot open " + file_path + ": " + error.message });
				return;
			}
			show_markdown(content);
		});
	});
}
