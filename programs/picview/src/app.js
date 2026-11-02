window.defaultMessageBoxTitle = "PicView";

let currentZoom = 1;
let minZoom = 1;
let maxZoom = 3;
let stepSize = 0.1;
let container = document.getElementById("app");

function zoomImage(direction)
{
    let newZoom = currentZoom + direction * stepSize;

    // Limit the zoom level to the minimum and maximum
    // values
    if (newZoom < minZoom || newZoom > maxZoom) {
        return;
    }

    currentZoom = newZoom;

    // Update the CSS transform of the image to scale it
    let image
        = document.getElementById("pic");
    image.style.transform = "scale(" + currentZoom + ")";
}

container.addEventListener("wheel", function(event) {
    // Zoom in or out based on the scroll direction
    let direction = event.deltaY > 0 ? -1 : 1;
    zoomImage(direction);
});



$("body").on("mousedown selectstart contextmenu", function (e) {
	if (
		e.target instanceof HTMLSelectElement ||
		e.target instanceof HTMLTextAreaElement ||
		(e.target instanceof HTMLLabelElement && e.type !== "contextmenu") ||
		(e.target instanceof HTMLInputElement && e.target.type !== "color")
	) {
		return;
	}
	e.preventDefault();
});


var query = Object.fromEntries(new URLSearchParams(location.search));
var file_path = query.path;
var file_name = file_path && file_name_from_path(file_path);
var default_file_name_for_title = "Untitled";

// Sizes the window to the picture: big pictures are shrunk to fit the screen, small ones get a minimum size.
function fit_window_to_pic(pic) {
	var $window = frameElement && frameElement.$window;
	if (!$window) {
		return;
	}
	if (!$window.is(":visible")) {
		// The window is shown once this page has loaded (the picture can finish first), and can't be measured until then
		frameElement.addEventListener("load", function () {
			fit_window_to_pic(pic);
		}, { once: true });
		return;
	}
	var max_width = Math.min(1000, parent.innerWidth - 40);
	var max_height = Math.min(750, parent.innerHeight - 100); // leaves room for the title bar and the taskbar
	var scale = Math.min(1, max_width / pic.naturalWidth, max_height / pic.naturalHeight);
	$window.setDimensions({
		innerWidth: Math.max(Math.min(400, max_width), Math.round(pic.naturalWidth * scale)),
		innerHeight: Math.max(Math.min(240, max_height), Math.round(pic.naturalHeight * scale)),
	});
	$window.center();
}

function load_pic() {
	if (!file_path) {
		return;
	}
	file_path_to_viewable_url(file_path, ["png", "jpg", "jpeg", "gif", "bmp", "webp"], function (error, url) {
		if (error) {
			showMessageBox({ iconID: "error", message: "Cannot open " + file_path + ": " + error.message + "." });
			return;
		}
		var pic = document.createElement("img");
		pic.id = "pic";
		pic.addEventListener("load", function () {
			fit_window_to_pic(pic);
		});
		pic.src = url;
		container.append(pic);
	});
}

function update_title() {
	document.title = (file_name || default_file_name_for_title) + " - PicView";

	if (frameElement && frameElement.$window)
		frameElement.$window.title(document.title);
}

update_title();
load_pic();
