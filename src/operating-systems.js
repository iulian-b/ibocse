// The computer's two operating systems, which the boot menu (BIOS/BOOTMENU.html) chooses between:
// the hard disk's, which boots by default (after the POST screen, $POST.html), and another, booted from the network:
// the site as it used to look, in green.
// Each has its own name, color scheme and pictures (each in its own folder in images/os/), its own boot
// (src/$boot-windows-98.js, src/$boot-sinclair-os.js), and its own settings (src/settings.js),
// as does everything else it keeps in localStorage (os_storage_key). They share the C: drive,
// but each shows only what its files.json says of it, and of the desktop's icons (src/os-files.js).
const operating_systems = {
	hdd: {
		name: "Windows 98", // in the titles of About and VMware (which runs it), and Display Properties' name for its wallpaper
		short_name: "Windows", // the title of its message boxes, and in Run ("... and Windows will open it for you")
		system_name: "Microsoft Windows 98", // in System Properties (src/control-panel.js)
		version: "4.10.1998",
		build_text: ["Windows 98 Build 4.10.1998", "For testing purposes only."], // in the corner of the desktop
		color_scheme: "Windows Standard", // (src/color-schemes.js)
		wallpaper: "images/os/hdd/wallpaper.jpeg",
		glitch: "images/os/hdd/glitch.png", // the wallpaper as Digitalis crashes it (src/crash-handler.js)
		start_menu_side: "images/os/hdd/start-menu-side.png",
		start_menu_side_color: "#000080", // (the rest of the bar, above the picture)
		banner: "images/os/hdd/banner.png", // in About, in the Start menu
		boot_logo: "images/os/hdd/bootlogo.png", // while it boots (Sinclair OS draws its own, in characters: src/$boot-sinclair-os.js)
		start_button: "images/os/hdd/start.png",
		files: "images/os/hdd/files.json", // which of the desktop's icons and the drive's files it shows (src/os-files.js)
		// Its logo as icons: About's, in the Start menu and on its window, and VMware's (which runs it)
		logo_icons: { 16: "/images/icons/windows-16x16-1bpp.png", 32: "/images/icons/windows-32x32-8bpp.png" },
		tab_icon: "/images/icons/windows-32x32-8bpp.png", // the browser tab's icon
		storage_prefix: "",
	},
	network: {
		name: "Sinclair OS-9",
		short_name: "Sinclair",
		system_name: "Sinclair OS-9",
		version: "9.0.8f (x64)",
		build_text: ["Sinclair OS-9 build 9.0.8f (x64)", "Not for commercial use."],
		color_scheme: "Sinclair Green",
		wallpaper: "images/os/network/wallpaper.jpg",
		glitch: "images/os/network/glitch.jpg",
		start_menu_side: "images/os/network/start-menu-side.png",
		start_menu_side_color: null, // (the color scheme's: classic.css)
		banner: "images/os/network/banner.png",
		start_button: "images/os/network/start.png",
		files: "images/os/network/files.json",
		logo_icons: { 16: "/images/icons/sinclair-updates-16x16.png", 32: "/images/icons/sinclair-updates-32x32.png" },
		tab_icon: null, // (the site's own, which is Sinclair's: favicon.ico)
		storage_prefix: "network-",
	},
};

// The one running: the network's if the boot menu booted it, until the next normal boot or Shut Down
const booted_device = (() => {
	try {
		const device = localStorage.getItem("boot-device");
		return Object.hasOwn(operating_systems, device) ? device : "hdd";
	} catch (error) {
		return "hdd"; // no local storage
	}
})();
const booted_os = operating_systems[booted_device];
// (for the stylesheets: classic.css)
document.documentElement.dataset.os = booted_device;

// The hard disk's are under the keys as they've always been
function os_storage_key(key, os = booted_os) {
	return os.storage_prefix + key;
}

// (on the desktop; programs that show the name, Run and VMware, load this too)
$("#buildtext").append(...booted_os.build_text.map((line) => $("<p>").text(line)));
$(".start-button img").attr("src", booted_os.start_button);
$("#start_btn_update img").attr("src", booted_os.logo_icons[32]);
if (booted_os.tab_icon) {
	$('link[rel~="icon"]').attr({ href: booted_os.tab_icon, type: "image/png" }).removeAttr("sizes");
}
// (a picture in the page, so it's downloaded now: as the bar's background, it was only once the menu first opened,
// so it showed up late)
$(".start-menu-titlebar img").attr("src", booted_os.start_menu_side);
if (booted_os.start_menu_side_color) {
	$(".start-menu-titlebar").css("background-color", booted_os.start_menu_side_color);
}
