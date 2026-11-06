// Sinclair OS-9's boot (the network's operating system: src/operating-systems.js), as src/$bootloader.js plays it:
// like Linux's, its parts appearing one after another (css/boot.css), down to "Starting Desktop Environment...".

// Its logo (as About has it: images/os/network/banner.png) in the console's own characters, a color for each letter of
// this picture: 26 characters by 13 lines, which in the console's font (each character twice as tall as it's wide) is square
const sinclair_os_logo_picture = [
    "BBBBBBBBBBBBBBBBBBBBBBBBBB",
    "BBBBBBBBBBBBBBBBBBBBBBBBBB",
    "BBBBBBBBBBBBBBBBBBBBBBBBBB",
    "",
    "",
    "YYYYYY       KKK  KKK  KKK",
    "YYYYYY       KKK  KKK  KKK",
    "YYYYYY       KKK  KKK  KKK",
    "",
    "",
    "RRRRRRRRRRRRRRRRRRRRRRRRRR",
    "RRRRRRRRRRRRRRRRRRRRRRRRRR",
    "RRRRRRRRRRRRRRRRRRRRRRRRRR",
];
// (the logo's colors, brighter, as thin lines of characters on black need; its black bars in the console's gray)
const sinclair_os_logo_colors = { B: "#2456d6", Y: "#fcd116", K: "rgb(150, 150, 150)", R: "#e0283a" };
const sinclair_os_logo = sinclair_os_logo_picture
    .map((line) => line.replace(/B+|Y+|K+|R+/g, (run) => `<span style="color: ${sinclair_os_logo_colors[run[0]]}">${"#".repeat(run.length)}</span>`))
    .join("\n");

const sinclair_os_boot_text = [
    // 0-5
    `<div class="fade">:: running early hook [udev]<br>Starting version 9.0.8f-sinclaire<br>:: running hook [udev]<br>:: Triggering uevents...<br></div>`,
    `<div class="fade">:: performing fsck on '/dev/sda3'<br>/dev/sda3: recovering journal<br></div>`,
    `<div class="fade">/dev/sda3: clean, 45425/1607520 files, 606564/6425339 blocks<br></div>`,
    `<div class="fade">:: mounting '/dev/sda3' on real root<br>::running cleanup hook [udev]<br></div>`,
    `<div class="fade"><br><pre class="sinclair-os-logo" aria-hidden="true">${sinclair_os_logo}</pre><br>Welcome to <span style="color: #4fa1ed">Sinclaire OS</span>!<br></div>`,
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
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Commander Keen.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Doom.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Cave Story.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Arx Fatalis.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Battle City.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Counter Strike 1.6.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Daggerfall.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Duke Nukem 3D.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Heroes of Might and Magic II.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Need for Speed: Most Wanted.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Need for Speed: Underground 2.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Prince of Persia.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Sonic the Hedgehog.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Super Mario 64.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Wipeout.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Grand Theft Auto: Vice City.<br>
        <span style="color: rgb(150, 150, 150)">[</span>  <span style="color: rgb(0, 255, 0)">OK</span> <span style="color: rgb(150, 150, 150)">] Loaded </span>Cyberpunk 2077.<br>
    </div>`,
	`<div class="fade"><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(150, 150, 150)">Starting Desktop Environment...</span><br></div>`
];
// When each part of it appears, in seconds, in order (and any added after these, a moment apart)
const sinclair_os_boot_text_delays = [0.1, 0.2, 0.4, 0.5, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.6, 1.8, 1.9, 2, 2.1, 2.3, 2.5, 3, 3.2];

const sinclair_os_boot = {
    // How long it takes, in milliseconds, before the desktop starts
    duration: 3900,
    // (screen: the boot screen, black and empty)
    play(screen) {
        screen.scrollIntoView();
        for (const text of sinclair_os_boot_text) {
            screen.insertAdjacentHTML('beforeend', text);
        }
        screen.querySelectorAll(":scope > .fade").forEach((part, index) => {
            const last = sinclair_os_boot_text_delays.length - 1;
            part.style.animationDelay = `${index <= last ? sinclair_os_boot_text_delays[index] : sinclair_os_boot_text_delays[last] + (index - last) * 0.1}s`;
        });
        setTimeout(() => screen.lastElementChild.scrollIntoView(), 1300);

        const loadASCII = "\n███████╗██╗███╗   ██╗ ██████╗██╗      █████╗ ██╗██████╗      ██████╗ ███████╗       █████╗ \n██╔════╝██║████╗  ██║██╔════╝██║     ██╔══██╗██║██╔══██╗    ██╔═══██╗██╔════╝      ██╔══██╗\n███████╗██║██╔██╗ ██║██║     ██║     ███████║██║██████╔╝    ██║   ██║███████╗█████╗╚██████║\n╚════██║██║██║╚██╗██║██║     ██║     ██╔══██║██║██╔══██╗    ██║   ██║╚════██║╚════╝ ╚═══██║\n███████║██║██║ ╚████║╚██████╗███████╗██║  ██║██║██║  ██║    ╚██████╔╝███████║       █████╔╝\n╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝       ╚════╝ \n                                                                                          \n";
        console.log(loadASCII)
    },
};
