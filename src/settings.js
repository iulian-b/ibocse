// What's set in the Control Panel (src/control-panel.js): kept in localStorage, which Shut Down keeps it in (see ClearStorage),
// and put in effect here as the desktop loads.

const settings_storage_key = "settings";

const default_settings = {
	wallpaper: "default", // "default" (the theme's own), the path of a picture on the drive, or null for none
	wallpaper_display: "stretch", // "tile", "center" or "stretch"
	color_scheme: "Windows Standard", // one of color_schemes (src/color-schemes.js)
	crt_monitor: false,
	cv_at_startup: true,
	removed_programs: [], // file names of the programs in C:\Games that Add/Remove Programs removed
};

const default_wallpaper_url = "images/themes/classic/wallpaper.jpeg";

// What Add/Remove Programs can remove: the games in C:\Games (not Windows' own Minesweeper and Pinball),
// and the title of their desktop shortcut, if they have one
const removable_programs = [
	{ name: "Arx Fatalis", exe: "arxfatalis.exe", shortcut: "Arx Fatalis" },
	{ name: "Battle City", exe: "battlecity.exe" },
	{ name: "Cave Story", exe: "cavestory.exe", shortcut: "Cave Story" },
	{ name: "Commander Keen", exe: "keen.exe", shortcut: "Commander Keen" },
	{ name: "Counter Strike 1.6", exe: "counterstrike.exe", shortcut: "Counter Strike 1.6" },
	{ name: "Cyberpunk 2077", exe: "cyberpunk.exe", shortcut: "Cyberpunk 2077" },
	{ name: "Diablo", exe: "diablo.exe", shortcut: "Diablo" },
	{ name: "Doom", exe: "doom.exe", shortcut: "Doom" },
	{ name: "Duke Nukem 3D", exe: "duke3d.exe", shortcut: "Duke Nukem 3D" },
	{ name: "Grand Theft Auto: Vice City", exe: "gtavc.exe", shortcut: "Grand Theft Auto: Vice City" },
	{ name: "Heroes of Might and Magic II", exe: "heroes2.exe", shortcut: "Heroes of Might and Magic II" },
	{ name: "Minecraft", exe: "minecraft.exe", shortcut: "Minecraft" },
	{ name: "Need for Speed: Most Wanted", exe: "nfsmw.exe", shortcut: "Need for Speed: Most Wanted" },
	{ name: "Need for Speed: Underground 2", exe: "nfsu2.exe", shortcut: "Need for Speed: Underground 2" },
	{ name: "Prince of Persia", exe: "prince.exe" },
	{ name: "Quake III Arena", exe: "quake3.exe", shortcut: "Quake III" },
	{ name: "SkiFree", exe: "skifree.exe" },
	{ name: "Sonic the Hedgehog", exe: "sonic.exe" },
	{ name: "Super Mario 64", exe: "mario64.exe" },
	{ name: "The Elder Scrolls II: Daggerfall", exe: "daggerfall.exe", shortcut: "The Elder Scrolls II: Daggerfall" },
	{ name: "Tomb Raider", exe: "tombraider.exe", shortcut: "Tomb Raider" },
	{ name: "Wipeout", exe: "wipeout.exe", shortcut: "Wipeout" },
	{ name: "Wolfenstein 3D", exe: "wolf3d.exe", shortcut: "Wolfenstein" },
];

function load_settings() {
	try {
		return { ...default_settings, ...JSON.parse(localStorage.getItem(settings_storage_key)) };
	} catch (error) {
		return { ...default_settings }; // no local storage
	}
}

function save_settings() {
	try {
		localStorage.setItem(settings_storage_key, JSON.stringify(desktop_settings));
	} catch (error) {
		// no local storage
	}
}

var desktop_settings = load_settings();

function is_shortcut_of_removed_program(title) {
	return removable_programs.some((program) => program.shortcut === title && desktop_settings.removed_programs.includes(program.exe));
}

var wallpaper_picture_extensions = ["png", "jpg", "jpeg", "gif", "bmp", "webp"];

// How the wallpaper is shown: as Windows 95 tiled it from the top left, or centered it at its own size, or stretched over the desktop
function wallpaper_css(url, display) {
	return {
		backgroundImage: url ? `url("${url}")` : "none",
		backgroundRepeat: display === "tile" ? "repeat" : "no-repeat",
		backgroundPosition: display === "tile" ? "left top" : "center",
		backgroundSize: display === "stretch" ? "100% 100%" : "auto",
	};
}

// Calls back with the URL of a wallpaper (null for none)
function get_wallpaper_url(wallpaper, callback) {
	if (wallpaper === "default") {
		callback(default_wallpaper_url);
	} else if (wallpaper) {
		file_path_to_viewable_url(wallpaper, wallpaper_picture_extensions, (error, url) => callback(error ? null : url));
	} else {
		callback(null);
	}
}

function apply_wallpaper() {
	const { wallpaper, wallpaper_display } = desktop_settings;
	get_wallpaper_url(wallpaper, (url) => {
		$(".desktop").css(wallpaper === "default" ?
			// (as index.html has it)
			{ backgroundImage: `url("${url}")`, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "cover" } :
			wallpaper_css(url, wallpaper_display));
	});
}

// (also for .theme files opened from the drive, in src/$desktop.js)
function remove_theme_css_properties(property_names, element = document.documentElement) {
	for (const name of property_names) {
		element.style.removeProperty(name);
	}
	for (const iframe of element.querySelectorAll("iframe")) {
		try {
			if (iframe.contentDocument) {
				remove_theme_css_properties(property_names, iframe.contentDocument.documentElement);
			}
		} catch (error) {
			// another site's page
		}
	}
}

function apply_color_scheme() {
	if (window.themeCSSProperties) {
		remove_theme_css_properties(Object.keys(window.themeCSSProperties));
	}
	const css_properties = color_scheme_css_properties(desktop_settings.color_scheme);
	applyCSSProperties(css_properties, { element: document.documentElement, recurseIntoIframes: true });
	// (for the windows opened from now on, src/iframe-windows.js)
	window.themeCSSProperties = css_properties;
}

// Scan lines and flicker over the whole screen (css/crt.css)
function apply_crt_monitor() {
	let crt_screen = document.getElementById("crt-screen");
	if (!crt_screen) {
		crt_screen = document.createElement("div");
		crt_screen.id = "crt-screen";
		crt_screen.className = "crt-screen";
		document.body.append(crt_screen);
	}
	crt_screen.hidden = !desktop_settings.crt_monitor;
}

if (desktop_settings.color_scheme !== default_settings.color_scheme && color_schemes[desktop_settings.color_scheme]) {
	apply_color_scheme();
}
apply_crt_monitor();
try {
	// (a picture set as the wallpaper from Paint is used instead, see src/$desktop.js, until one is chosen in Display Properties)
	if (!localStorage.getItem("wallpaper-data-url") && desktop_settings.wallpaper !== default_settings.wallpaper) {
		apply_wallpaper();
	}
} catch (error) {
	// no local storage
}
