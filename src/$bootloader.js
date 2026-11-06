const bootLoader = document.getElementById("bootloader");
const desktop = document.getElementById("desktop");
const desktopIcons = document.getElementById("desktop-icons");
const buildText = document.getElementById("buildtext");
const taskBar = document.getElementById("taskbar");
const preloader = document.getElementById("preloader");

preloader.style.display = "flex";

// Each operating system boots its own way (src/operating-systems.js): Windows 98 (src/$boot-windows-98.js),
// and Sinclair OS-9 (src/$boot-sinclair-os.js). Either plays in the boot screen, then the desktop starts.
const bootSequence = { hdd: windows_98_boot, network: sinclair_os_boot }[booted_device];

function toggleDeskop(switcher) {
    if (!switcher) {
        desktopIcons.style.display = "none";
        desktop.style.display = "none";
        taskBar.style.display = "none";
        buildText.style.color = "black";
    } else {
        desktop.style.display = "flex";
        bootLoader.remove();
        sleep(1000).then(() => { desktopIcons.style.display = "flex";});
        sleep(2000).then(() => {
            taskBar.style.display = "flex";
            // (the desktop takes keys again: src/$boot-screen.js)
            document.documentElement.classList.remove("booting");
        });
        buildText.style.color = "white";

        sleep(2300).then(() => { localStorage.setItem("boot", "true");});
        sleep(2300).then(() => os_files_ready).then(open_startup_programs); // (src/$desktop.js)
        // sleep(2300).then(() => { systemExecuteFile("/My Documents/CV (EN).pdf"); });
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.addEventListener('DOMContentLoaded', function() {
    // Play only first time (src/$boot-screen.js)
    if (document.documentElement.classList.contains("booting")) {
        // Toggle desktop OFF
        toggleDeskop(false);
		bootLoader.classList.add("crt");

		// Boot Audio
		// AUTOPLAY DOES NOT WORK IN 2024.
		// FIND AN ALTERNATIVE
		// document.getElementById("audio-container").insertAdjacentHTML('beforeend',`<div id="player"><audio autoplay hidden><source src="../audio/BOOT.wav" type="audio/wav"></audio></div>`);

		// Boot animation
        bootSequence.play(bootLoader);

        preloader.style.display = "none";

        // Toggle desktop ON
        sleep(bootSequence.duration).then(() => {
            toggleDeskop(true);
        });

        console.log("[SYS] User log in");
        console.log("[SYS] Welcome, ibocse.")

        // Toggle BOOT = TRUE so it doesnt replay next time
    } else {
        if (bootLoader != null) bootLoader.remove();
    }
});
