// Windows 98's boot (the hard disk's operating system: src/operating-systems.js), as src/$bootloader.js plays it:
// "Starting Windows 98..." on the black screen, then its logo, with the bar moving along the bottom of the screen
// (they look as css/boot.css has them).

const windows_98_boot = {
    // How long it takes, in milliseconds, before the desktop starts
    duration: 4500,
    // (screen: the boot screen, black and empty)
    play(screen) {
        screen.classList.add("windows-98-boot");
        const $starting = $("<div class='windows-98-starting'>").text("Starting Windows 98...").appendTo(screen);
        setTimeout(() => {
            $starting.remove();
            $("<div class='windows-98-splash'>").append(
                $("<img class='windows-98-logo' alt=''>").attr("src", booted_os.boot_logo),
                $("<div class='windows-98-name'>").append($("<small>").text("Microsoft©"), $("<br>"), "Windows 98"),
                $("<div class='windows-98-bar'>"),
            ).appendTo(screen);
        }, 1500);
        console.log("[SYS] Starting Windows 98...");
    },
};
