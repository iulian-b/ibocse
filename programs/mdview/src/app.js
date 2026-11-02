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
	var $document = document.getElementById("document");
	$document.innerHTML = markdown.render(text);

	// Relative links and pictures point next to the file, and links open in a new tab rather than in this window
	var folder_url = new URL(drive_path_to_url(file_path.replace(/[^/]*$/, "")), location.href);
	for (var img of $document.querySelectorAll("img[src]")) {
		img.src = new URL(img.getAttribute("src"), folder_url);
	}
	for (var link of $document.querySelectorAll("a[href]")) {
		if (link.getAttribute("href").startsWith("#")) {
			continue;
		}
		link.href = new URL(link.getAttribute("href"), folder_url);
		link.target = "_blank";
		link.rel = "noopener noreferrer";
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
