// The boot sequence (src/$bootloader.js) is the computer starting up, apart from the desktop: whether it plays is known
// first thing (here, in <head>), so the desktop isn't seen, and takes no clicks or keys, until it's over
// (css/boot.css; src/$bootloader.js takes the class away). The browser's own keys (reloading, and so on) still work.
try {
	if (localStorage.getItem("boot") == null) {
		document.documentElement.classList.add("booting");
	}
} catch (error) {
	// no local storage, so no boot sequence
}
for (const type of ["keydown", "keypress", "keyup"]) {
	addEventListener(type, (event) => {
		if (document.documentElement.classList.contains("booting")) {
			event.stopImmediatePropagation();
		}
	}, true);
}
