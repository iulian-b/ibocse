var $start_menu = $(".start-menu");
var $start_selection = $(".start-btn");
$start_menu.hide();
var $start_content = document.getElementsByClassName("start-menu-content");
const shutdownAudio = new Audio('../audio/SHUTDOWN.wav');
shutdownAudio.preload = "none"; // big, and only needed at the very end
shutdownAudio.volume = 0.2;

function ClearStorage() {
	// Files on the C: drive stay (they're in IndexedDB), and so does its record of deleted files, the Control Panel's settings
	// (each operating system's), and the BIOS's (BIOS/SETUP.js), as with a CMOS battery.
	// (Which operating system the boot menu booted goes, so the next boot is the hard disk's.)
	const settings_storage_keys = Object.values(operating_systems).map((os) => os_storage_key("settings", os));
	const kept = [journal_storage_key, ...settings_storage_keys, "bios-settings"].map((key) => [key, localStorage.getItem(key)]);
	localStorage.clear();
	for (const [key, value] of kept) {
		if (value !== null) {
			localStorage.setItem(key, value);
		}
	}
	let Cookies = document.cookie.split(';');
	for (let i = 0; i < Cookies.length; i++) {
		document.cookie = Cookies[i] + "=; expires=" + new Date(0).toUTCString();
	}
}

var open_start_menu = function () {
	$start_button.addClass("selected");
	$start_menu.attr("hidden", null);
	$start_menu.slideDown(100); // DOWN AS IN UP (stupid jQuery)
	$start_menu.css({zIndex: ++$Window.Z_INDEX + 5001});
};
var close_start_menu = function () {
	$start_button.removeClass("selected");
	$start_menu.attr("hidden", "hidden");
	$start_menu.hide();
	close_start_submenu();
};

// Submenus (Settings, Find), beside their item (outside of the Start menu, which would cut them off).
// The items with one have aria-controls set to it.
var $start_submenu_buttons = $(".start-btn.has-submenu");
var start_submenu_timer;
var open_start_submenu = function (button) {
	close_start_submenu();
	const $button = $(button);
	const $submenu = $(`#${$button.attr("aria-controls")}`);
	$submenu.prop("hidden", false);
	const item_rect = button.getBoundingClientRect();
	$submenu.css({
		left: $start_menu[0].getBoundingClientRect().right - 3,
		top: Math.max(0, Math.min(item_rect.top - 3, innerHeight - $submenu.outerHeight())),
		zIndex: Number($start_menu.css("zIndex")) + 1,
	});
	$button.addClass("submenu-open").attr("aria-expanded", true);
};
var close_start_submenu = function () {
	clearTimeout(start_submenu_timer);
	$(".start-submenu").prop("hidden", true);
	$start_submenu_buttons.removeClass("submenu-open").attr("aria-expanded", false);
};
// It opens when pointed at for a moment, like Windows' menus, and closes when another item is
$start_submenu_buttons.on("pointerenter", (event) => {
	clearTimeout(start_submenu_timer);
	start_submenu_timer = setTimeout(() => open_start_submenu(event.currentTarget), 300);
});
$start_submenu_buttons.on("pointerleave", (event) => {
	if (!$(event.currentTarget).hasClass("submenu-open")) {
		clearTimeout(start_submenu_timer);
	}
});
$start_submenu_buttons.on("click", (event) => {
	open_start_submenu(event.currentTarget);
});
$(".start-btn").not($start_submenu_buttons).on("pointerenter", close_start_submenu);
var toggle_start_menu = function () {
	if ($start_menu.is(":hidden")) {
		open_start_menu();
	} else {
		close_start_menu();
	}
};

const update_dialog = () => {
	const $w = $Window({
		title: booted_os.name, resizable: false, maximizeButton: false, minimizeButton: false,
		icons: {
			32: "/images/icons/sinclair-updates-32x32.png",
			16: "/images/icons/sinclair-updates-16x16.png",
		},
	});
	$w.$content.append($("<p>").append($("<img>").attr("src", booted_os.banner)));


	// $w.$Button("Ok", () => $w.close()).css({ width: 100 });

	return $w;
};


var $start_button = $(".start-button");
$start_button.on("pointerdown", function () {
	toggle_start_menu();
});

$("body").on("pointerdown", function (e) {
	if ($(e.target).closest(".start-menu, .start-submenu, .start-button").length === 0) {
		close_start_menu();
	}
});
// Note: A lot of the time it's good to use focusout (in jQuery, or else blur with useCapture?[1]) as opposed to
// That might be the case here as well, but maybe not since programs opening might grab focus and that probably shouldn't close the start menu
// Although at the operating system level it would probably prevent focus switching in the first place, so maybe we could do that
// The point being this is an operating system control and so it may warrant special handling,
// but generally I'd recommend making a control focusable and detecting loss of focus as in this answer:
// [1]: https://stackoverflow.com/a/38317768/2624876

$(window).on("keydown", function (e) {
	if (e.which === 27) { // Esc to close
		close_start_menu();
	}
	if (e.key === "Meta") { // lWin to open
		toggle_start_menu();
	}
});

// Buttons
document.getElementById('start_btn_update').addEventListener("click", function () {
	console.log("[USR] ibocse@crlab2-h032: Opened sysyem about_dialog()");
	update_dialog();
});
document.getElementById('start_btn_programs').addEventListener("click", function () {
	Explorer("/Program Files/");
});
document.getElementById('start_btn_favorites').addEventListener("click", function () {
	Explorer("/Favorites");
});
document.getElementById('start_btn_documents').addEventListener("click", function () {
	Explorer("/My Documents/");
});
document.getElementById('start_btn_control_panel').addEventListener("click", function () {
	close_start_menu();
	console.log("[USR] ibocse@crlab2-h032: control.exe()");
	ControlPanel();
});
document.getElementById('start_btn_printers').addEventListener("click", function () {
	close_start_menu();
	console.log("[USR] ibocse@crlab2-h032: control.exe printers");
	Printers();
});

document.getElementById('start_btn_find_files').addEventListener("click", function () {
	close_start_menu();
	console.log("[USR] ibocse@crlab2-h032: find.exe");
	FindFiles();
});
document.getElementById('start_btn_find_computer').addEventListener("click", function () {
	close_start_menu();
	console.log("[USR] ibocse@crlab2-h032: find.exe /computer");
	FindComputer();
});
document.getElementById('start_btn_find_internet').addEventListener("click", function () {
	close_start_menu();
	console.log("[USR] ibocse@crlab2-h032: iexplore.exe");
	InternetExplorer();
});
document.getElementById('start_btn_help').addEventListener("click", function () {
	console.log("[USR] ibocse@crlab2-h032: Opened help page");
	open("https://github.com/iulian-b/ibocse");
});
document.getElementById('start_btn_run').addEventListener("click", function () {
	console.log("[USR] ibocse@crlab2-h032: Opened run()");
	openRunDialog();
});
document.getElementById('start_btn_logoff').addEventListener("click", function () {
	// Stop all audio (Winamp's player isn't part of the page, so clearing the page wouldn't stop it)
	loopAudio.pause();
	bootAudio.pause();
	winamp_interface?.close();

	// Clear DOM
	console.log("[SYS] ibocse@crlab2-h032: System log off");
	document.documentElement.innerHTML = '<body style="background-color:black;"></body>';
});
document.getElementById('start_btn_shutdown').addEventListener("click", function () {
	// Stop all audio (Winamp's player isn't part of the page, so clearing the page wouldn't stop it)
	loopAudio.pause();
	bootAudio.pause();
	winamp_interface?.close();

	// Play shutdown sound
	playSound(shutdownAudio);

	// Clear DOM
	document.documentElement.innerHTML = '<body style="background-color:black;"></body>';
	console.log("[SYS] ibocse@crlab2-h032: System shut down");

	// Clear storage and cookies
	ClearStorage();

	// Set next boot cookie
	localStorage.setItem("POST", "0");
});

