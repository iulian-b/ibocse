window.defaultMessageBoxTitle = "Sinclair";

var $desktop = $(".desktop");
$desktop.css("touch-action", "none"); // TODO: should this be in FolderView, or is it to prevent scrolling the page or what?
var interacted = false;

// Folder view
var folder_view = new FolderView(desktop_folder_path, {
	asDesktop: true,
	openFileOrFolder: (path) => { // Note: may not be defined yet, so wrapping with a function.
		systemExecuteFile(path);
	},
});
$(folder_view.element).appendTo($desktop);

// Wallpaper
function setDesktopWallpaper(file, repeat, saveToLocalStorage) {
	const blob_url = URL.createObjectURL(file);
	$desktop.css({
		backgroundImage: `url(${blob_url})`,
		backgroundRepeat: "no-repeat",
		backgroundPosition: "center",
		// backgroundSize: "auto",
		backgroundSize: "contain",
	});
	if (saveToLocalStorage) {
		var fr = new FileReader();
		window.fr = fr;
		fr.onload = () => {
			localStorage.setItem("wallpaper-data-url", fr.result);
			localStorage.setItem("wallpaper-repeat", repeat);
		};
		fr.onerror = () => {
			console.error("Error reading file (for setting wallpaper)", file);
		};
		fr.readAsDataURL(file);
	}
}
try {
	var wallpaper_data_url = localStorage.getItem("wallpaper-data-url");
	var wallpaper_repeat = localStorage.getItem("wallpaper-repeat");
	var theme_file_content = localStorage.getItem("desktop-theme");
	if (wallpaper_data_url) {
		fetch(wallpaper_data_url).then(r => r.blob()).then(file => {
			setDesktopWallpaper(file, wallpaper_repeat, false);
		});
	}
	if (theme_file_content) {
		loadThemeFromText(theme_file_content);
	}
} catch (error) {
	console.error(error);
}

// Prevent drag and drop from redirecting the page (the browser default behavior for files)
// TODO: only prevent if there are actually files; there's nothing that uses text inputs atm that's not in an iframe, so it doesn't matter YET (afaik)
// $G.on("dragover", function(e){
// 	e.preventDefault();
// });
// $G.on("drop", function(e){
// 	e.preventDefault();
// });

// Theme
function loadThemeFile(file) {
	var reader = new FileReader();
	reader.onload = () => {
		loadThemeFromText(reader.result);
	};
	reader.readAsText(file);
}
function applyTheme(cssProperties, documentElement = document.documentElement) {
	applyCSSProperties(cssProperties, { element: documentElement, recurseIntoIframes: true });
}
function loadThemeFromText(fileText) {
	var cssProperties = parseThemeFileString(fileText);
	applyTheme(cssProperties);
	window.themeCSSProperties = cssProperties;
}

// Events
$("html").on("dragover", function (event) {
	event.preventDefault();
	event.stopPropagation();
});
$("html").on("dragleave", function (event) {
	event.preventDefault();
	event.stopPropagation();
});
$("html").on("drop", function (event) {
	event.preventDefault();
	event.stopPropagation();
	var files = [...event.originalEvent.dataTransfer.files];
	for (var file of files) {
		if (file.name.match(/\.theme(pack)?$/i)) {
			loadThemeFile(file);
		}
	}
});

// Listeners
window.addEventListener('DOMContentLoaded', function() {
	if (localStorage.getItem("boot") === "true") {
		PDFViewer("/My Documents/CV (EN).pdf");
		// localStorage.setItem("init", "true");
	}
	// The page is ready: take away the black cover that hides the desktop while it loads.
	// (On the first visit, the boot sequence takes over from it; after a shutdown, src/$post-redirect.js has already gone to the POST screen.)
	document.getElementById("preloader").style.display = "none";
});

// Run Handler (called by the Run dialog, programs/run)
// Like on Windows, programs run with or without ".exe", in any case.
function runCommand(target) {
	target = target.trim();
	if (target === "") {
		return;
	}
	var programs = {
		"calc": Calculator,
		"cmd": CommandPrompt,
		"command": CommandPrompt,
		"explorer": Explorer,
		"solitaire": Solitaire,
		"sol": Solitaire,
		"paint": Paint,
		"mspaint": Paint,
		"notepad": Notepad,
		"winmine": Minesweeper,
		"pdfviewer": PDFViewer,
		"picview": Picview,
		"mdview": Markdown,
		"pinball": Pinball,
		"recorder": SoundRecorder,
		"sndrec32": SoundRecorder,
		"winamp": openWinamp,
		"wolf3d": Wolf3d,
		"tombraider": TombRaider,
		"quake3": Quake3,
		"diablo": Diablo,
		"minecraft": Minecraft,
		"skifree": SkiFree,
		"keen": CommanderKeen,
		"doom": Doom,
		"cavestory": CaveStory,
		"arxfatalis": ArxFatalis,
		"battlecity": BattleCity,
		"counterstrike": CounterStrike,
		"daggerfall": Daggerfall,
		"duke3d": DukeNukem3D,
		"digitalis": () => { audioPanic(); timeToPanic(); },
	};
	var program_name = target.toLowerCase().replace(/\.exe$/, "");
	if (Object.hasOwn(programs, program_name)) {
		programs[program_name]();
	} else if (target.toLowerCase().endsWith(".exe")) {
		showMessageBox({ iconID: "error", title: target, message: "Cannot find the file '" + target + "' (or one of its components). Make sure the path and filename are correct and that all required libraries are available." });
	} else if (target.startsWith("/")) {
		// a file or folder: opened with its program, like double-clicking it
		systemExecuteFile(target);
	} else {
		// system folder names ("My Documents"), drives ("C:") and web addresses
		Explorer(target);
	}
}

// Despite overflow:hidden on html and body,
// focusing elements that are partially offscreen can still scroll the page.
// For example, with opening Paint and moving it partially offscreen and opening Image > Attributes,
// the default focused button can scroll the entire desktop.
// We need to prevent (reset) scroll, and also avoid scrollIntoView().
$(window).on("scroll focusin", () => {
	window.scrollTo(0, 0);
});

// Tray
document.getElementById("network-tray-icon").addEventListener("click", () => {
	showMessageBox({iconID: 'error', title:'Error', message: 'Could not establish a connection to //LAB02/X01/X01_b . \n[Cause: 511 Network Authentication Required]'});
});

window.addEventListener("resize", ()=> {
	document.getElementById("disabled-inset-filter").setAttribute("x", "0");
});




