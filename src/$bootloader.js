const bootLoader = document.getElementById("bootloader");
const desktop = document.getElementById("desktop");
const desktopIcons = document.getElementById("desktop-icons");
const buildText = document.getElementById("buildtext");
const taskBar = document.getElementById("taskbar");
const preloader = document.getElementById("preloader");

preloader.style.display = "flex";

const bootText = [
    // 0-5
    `<div class="fade">:: running early hook [udev]<br>Starting version 9.0.8-sinclaire<br>:: running hook [udev]<br>:: Triggering uevents...<br></div>`,
    `<div class="fade">:: performing fsck on '/dev/sda3'<br>/dev/sda3: recovering journal<br></div>`,
    `<div class="fade">/dev/sda3: clean, 45425/1607520 files, 606564/6425339 blocks<br></div>`,
    `<div class="fade">:: mounting '/dev/sda3' on real root<br>::running cleanup hook [udev]<br></div>`,
    `<div class="fade"><br><img src="images/bootlogo.png"><br>Welcome to <span style="color: #4fa1ed">Sinclaire OS</span>!<br></div>`,
    `<div class="fade">Tunnel Client:<br>` + escapeHTML(navigator.userAgent) + `<br></div><br>`,

    // 6-9 (systemd)
    `<div class="fade">
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Created slice </span> Slice /system/getty.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Created slice </span> Slice /system/modprobe.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Created slice </span> User and Session Slice.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Started </span> Dispatch Password Requests to Console Directory Watch.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Started </span> Forward Password Requests to Wall Directory Watch.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Set up automount </span> Arbitrary Executable File Formats File System Automount Point.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Reached target </span> Local Encrypted Volumes.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Reached target </span> Local Integrity Protected Volumes.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Reached target </span> Path Units.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Reached target </span> Remote File Systems.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Reached target </span> Slice Units.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Reached target </span> Local Verity Protected Volumes.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Listening on </span> Device-mapper event daemon FIFOs.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Listening on </span> Process Core Dump Socket.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Listening on </span> Journal Audit Socket.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Listening on </span> Journal Socket (/dev/log).<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Listening on </span> Journal Socket.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Listening on </span> udev Control Socket.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Listening on </span> udev Kernel Socket.<br>
	</div>`,
    `<div class="fade">
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Mounting</span> Huge Page File System...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Mounting</span> POSIX Message Queue File System...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Mounting</span> Kernel Debug File System...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Mounting</span> Kernel Trace File System...<br>
	</div>`,
    `<div class="fade">
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting</span> Create List of Static Device Nodes...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting</span> Load Kernel Module configfs...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting</span> Load Kernel Module drm...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting</span> Load Kernel Module fuse...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting</span> Journal Service...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting</span> Remount Root and Kernel File Systems...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting</span> Apply Kernel Variables...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting</span> Coldplug All udev Devices...<br>
	</div>`,
    `<div class="fade">
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Mounted </span>Huge Pages File System.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Mounted </span>POSIX Message Queue File System.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Mounted </span>Kernel Debug File System<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Mounted </span>Kernel Trace File System<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Finished </span>Create List of Static Device Nodes<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Finished </span>Load Kernel Module configfs<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Finished </span>Load Kernel Module drm<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Finished </span>Load Kernel Module fuse<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Finished </span>Remount Root and Kernel File Systems<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Finished </span>Apply Kernel Variables<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Mounting</span> FUSE Control File System...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Mounting</span> Kernel Configuration File System...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting</span> Load/Save Random Seed...<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting</span> Create Static Device Nodes in /dev...<br>
	</div>`,

    // 10-13
    `<div class="fade">
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Mounted </span>FUSE Control File System.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Mounted </span>Kernel Configuration File System.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Finished </span>Create Static Device Nodes in /dev.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Reached target </span>Preparation for Local File Systems.<br>
	</div>`,
    `<div class="fade">
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting EPN Handshake Service...</span><br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Finished </span>EPN Handshake Service.<br>
		<span style="color: rgb(150, 150, 150)">[</span><span style="color: rgb(255, 0, 0)">FAIL</span><span style="color: rgb(150, 150, 150)">] Denied </span> EPN Handshake Service<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(255, 0, 0)">Client Authentication refused by host!</span><br>
		<span style="color: rgb(150, 150, 150)">[    3.090185] piix4_smbus 0000:00:07.3 SMBus base address uninitialized - upgrade BIOS or use force_addr = 0xaddr</span><br>
	</div>`,
    `<div class="fade">
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Found </span>tunnel client ` + escapeHTML(navigator.userAgent) + `<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Activating swap /dev/disk/by-uuid/8ed17f08-db8c-4374-bc43-b3ee4dabc875...</span><br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Mounting /boot...</span><br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Activated </span>swap /dev/disk/by-uuid/8ed17f08-db8c-4374-bc43-b3ee4dabc875.<br>
	</div>`,
    `<div class="fade">
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Reached target </span>Swaps<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Mounting Digital Directory /C:/...</span><br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Mounted </span>Digital Directory /C:/.<br>
	</div>`,

    // 14-16
    `<div class="fade">
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting Create Volatile Files and Directories...</span><br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Finished </span>Create Volatile Files and Directories.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Hostname Service.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Basic System.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Network Manager.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Socket Units.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>User Login Management.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Graphical Interface.<br>
	</div>`,
    `<div class="fade">
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Mounting User Programs...</span><br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>3D-FlowerBox.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Calculator.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>CMD.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Explorer.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>JSPaint.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>JS-Solitaire.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>MineSweeper.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>NetLogin.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Notepad.<br>
	</div>`,
    `<div class="fade">
		<span style="color: rgb(150, 150, 150)">[</span><span style="color: rgb(255, 0, 0)">FAIL</span><span style="color: rgb(150, 150, 150)">] Mounting </span>Digitalis<br>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(255, 0, 0)">Package corrupt or incomplete!</span><br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>PDFView.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>PicView.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Pinball.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Pipes.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Run.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Sound Recorder.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>VMware.<br>
		<span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Winamp.<br>
	</div>`,
    // 17-18
    `<div class="fade">
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Diablo.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Wolfenstein.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>TombRaider.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Quake3.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Minecraft.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>SKiFree.<br>
    </div>`,
	`<div class="fade"><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting Desktop Environment...</span><br></div>`
];


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
        sleep(2000).then(() => { taskBar.style.display = "flex"; });
        buildText.style.color = "white";

        sleep(2300).then(() => { localStorage.setItem("boot", "true");});
        sleep(2300).then(() => { PDFViewer("/My Documents/CV (EN).pdf");});
        // sleep(2300).then(() => { systemExecuteFile("/My Documents/CV (EN).pdf"); });
    }
}

function scrollUp() {
    bootLoader.scrollIntoView();
}

function scrollDown() {
    bootLoader.lastElementChild.scrollIntoView();
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.addEventListener('DOMContentLoaded', function() {
    // Play only first time
    if (localStorage.getItem("boot") == null) {
        // Toggle desktop OFF
        toggleDeskop(false);
		bootLoader.classList.add("crt");

		// Boot Audio
		// AUTOPLAY DOES NOT WORK IN 2024.
		// FIND AN ALTERNATIVE
		// document.getElementById("audio-container").insertAdjacentHTML('beforeend',`<div id="player"><audio autoplay hidden><source src="../audio/BOOT.wav" type="audio/wav"></audio></div>`);

		// Boot animation
        scrollUp();
        for (const text of bootText) {
            bootLoader.insertAdjacentHTML('beforeend', text);
        }
        setTimeout(scrollDown, 1300);

        preloader.style.display = "none";

        // Toggle desktop ON
        sleep(3900).then(() => {
            toggleDeskop(true);
        });

        const loadASCII = "\n███████╗██╗███╗   ██╗ ██████╗██╗      █████╗ ██╗██████╗      ██████╗ ███████╗       █████╗ \n██╔════╝██║████╗  ██║██╔════╝██║     ██╔══██╗██║██╔══██╗    ██╔═══██╗██╔════╝      ██╔══██╗\n███████╗██║██╔██╗ ██║██║     ██║     ███████║██║██████╔╝    ██║   ██║███████╗█████╗╚██████║\n╚════██║██║██║╚██╗██║██║     ██║     ██╔══██║██║██╔══██╗    ██║   ██║╚════██║╚════╝ ╚═══██║\n███████║██║██║ ╚████║╚██████╗███████╗██║  ██║██║██║  ██║    ╚██████╔╝███████║       █████╔╝\n╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝       ╚════╝ \n                                                                                          \n";
        console.log(loadASCII)
        console.log("[SYS] User log in");
        console.log("[SYS] Welcome, ibocse.")

        // Toggle BOOT = TRUE so it doesnt replay next time
    } else {
        if (bootLoader != null) bootLoader.remove();
    }
});
