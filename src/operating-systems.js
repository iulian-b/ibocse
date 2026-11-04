// The computer's two operating systems, which the boot menu (BIOS/BOOTMENU.html) chooses between:
// the hard disk's, which boots by default (after the POST screen, $POST.html), and another, booted from the network:
// the site as it used to look, in green.
// Each has its own name, color scheme and pictures (each in its own folder in images/os/), and its own settings (src/settings.js),
// as does everything else it keeps in localStorage (os_storage_key). They share the C: drive.
const operating_systems = {
	hdd: {
		name: "Microsoft Windows 98", // in System Properties (src/control-panel.js)
		version: "4.10.1998",
		build_text: ["Windows 98 Build 4.10.1998", "For testing purposes only."], // in the corner of the desktop
		color_scheme: "Windows Standard", // (src/color-schemes.js)
		wallpaper: "images/os/hdd/wallpaper.jpeg",
		glitch: "images/os/hdd/glitch.png", // the wallpaper as Digitalis crashes it (src/crash-handler.js)
		start_menu_side: "images/os/hdd/start-menu-side.png",
		banner: "images/os/hdd/banner.png", // in About, in the Start menu
		boot_logo: "images/os/hdd/bootlogo.png", // while it boots (src/$bootloader.js)
		start_button: "images/os/hdd/start.png",
		storage_prefix: "",
	},
	network: {
		name: "Sinclair OS-9",
		version: "9.0.8f (x64)",
		build_text: ["Sinclair OS-9 build 9.0.8f (x64)", "Not for commercial use."],
		color_scheme: "Sinclair Green",
		wallpaper: "images/os/network/wallpaper.jpg",
		glitch: "images/os/network/glitch.jpg",
		start_menu_side: "images/os/network/start-menu-side.png",
		banner: "images/os/network/banner.png",
		boot_logo: "images/os/network/bootlogo.png",
		start_button: "images/os/network/start.png",
		storage_prefix: "network-",
	},
};

// The one running: the network's if the boot menu booted it, until the next normal boot or Shut Down
const booted_os = (() => {
	try {
		const device = localStorage.getItem("boot-device");
		return Object.hasOwn(operating_systems, device) ? operating_systems[device] : operating_systems.hdd;
	} catch (error) {
		return operating_systems.hdd; // no local storage
	}
})();

// The hard disk's are under the keys as they've always been
function os_storage_key(key, os = booted_os) {
	return os.storage_prefix + key;
}

$("#buildtext").append(...booted_os.build_text.map((line) => $("<p>").text(line)));
$(".start-button img").attr("src", booted_os.start_button);
$(".start-menu-titlebar").css("background-image", `url("${booted_os.start_menu_side}")`);
