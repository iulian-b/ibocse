// The CMOS Setup Utility (SETUP.html), as Award's looked: a menu of pages of settings, used with the keyboard,
// or with the mouse or a finger: click to select, and click what's selected to open it.
// What's set is saved in localStorage ("bios-settings"), which Shut Down keeps, as the CMOS battery would,
// and the POST screen ($POST.html) shows the CPU and memory speeds set here.

const settings_key = "bios-settings";
const copyright = "CMOS Setup Utility - Copyright (C) 1984-2020 Award Software";
const enabled_disabled = ["Enabled", "Disabled"];

// (shared with $POST.html)
const cpu_ghz = (ratio) => ((ratio === "Auto" ? 43 : parseInt(ratio)) / 10).toFixed(2);
const dram_mhz = (multiplier) => Math.round((multiplier === "Auto" ? 26 : parseFloat(multiplier)) * 100);

// Readings that change a little all the time, like a sensor's
const reading = (base, spread, decimals = 0) => (base + (Math.random() - 0.5) * spread).toFixed(decimals);

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const two_digits = (number) => String(number).padStart(2, "0");

// The pages of the main menu. Their items are settings ({ id, label, options, default, failsafe?, help }),
// or information ({ label, value() }). Pages with readings that change are "live".
const pages = [
	{
		title: "Standard CMOS Features",
		description: "Time, Date, Hard Disk Type...",
		live: true,
		items: [
			{ label: "Date (mm:dd:yy)", value: () => { const now = new Date(); return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`; } },
			{ label: "Time (hh:mm:ss)", value: () => { const now = new Date(); return `${two_digits(now.getHours())} : ${two_digits(now.getMinutes())} : ${two_digits(now.getSeconds())}`; } },
			{ label: "IDE Channel 0 Master", value: () => "[Lexar LNM620X256G]" },
			{ label: "IDE Channel 0 Slave", value: () => "[WDC WD8005FFBX]" },
			{ label: "IDE Channel 1 Master", value: () => "[WDC WD161KFGX]" },
			{ label: "IDE Channel 1 Slave", value: () => "[None]" },
			{ id: "drive_a", label: "Drive A", options: ["None", "360K, 5.25 in.", "1.2M, 5.25 in.", "720K, 3.5 in.", "1.44M, 3.5 in.", "2.88M, 3.5 in."], default: "1.44M, 3.5 in.", help: "Select the type of floppy disk drive installed in your system" },
			{ id: "floppy_3_mode", label: "Floppy 3 Mode Support", options: ["Disabled", "Drive A", "Drive B", "Both"], default: "Disabled", help: "Floppy 3 Mode, for the 1.2MB disks used in Japan" },
			{ id: "halt_on", label: "Halt On", options: ["All Errors", "No Errors", "All, But Keyboard"], default: "All, But Keyboard", help: "Select the situation in which you want the BIOS to stop the POST process and notify you" },
			{ label: "Base Memory", value: () => "640K" },
			{ label: "Extended Memory", value: () => "67107840K" },
			{ label: "Total Memory", value: () => "67108864K" },
		],
	},
	{
		title: "Advanced BIOS Features",
		description: "Boot Sequence, Quick Boot, CPU Features...",
		items: [
			{ id: "hard_disk_priority", label: "Hard Disk Boot Priority", options: ["Lexar LNM620X256G", "WDC WD8005FFBX", "WDC WD161KFGX"], default: "Lexar LNM620X256G", help: "Select the hard disk to boot from first" },
			{ id: "first_boot_device", label: "First Boot Device", options: ["Hard Disk", "CDROM", "USB-FDD", "USB-CDROM", "LAN", "Disabled"], default: "Hard Disk", failsafe: "USB-FDD", help: "Select your boot device priority" },
			{ id: "second_boot_device", label: "Second Boot Device", options: ["Hard Disk", "CDROM", "USB-FDD", "USB-CDROM", "LAN", "Disabled"], default: "CDROM", failsafe: "CDROM", help: "Select your boot device priority" },
			{ id: "third_boot_device", label: "Third Boot Device", options: ["Hard Disk", "CDROM", "USB-FDD", "USB-CDROM", "LAN", "Disabled"], default: "USB-FDD", failsafe: "Hard Disk", help: "Select your boot device priority" },
			{ id: "password_check", label: "Password Check", options: ["Setup", "System"], default: "Setup", help: "Setup: the password is asked for to enter Setup. System: also every time the system boots" },
			{ id: "quick_boot", label: "Quick Boot", options: enabled_disabled, default: "Enabled", failsafe: "Disabled", help: "Skips some tests while booting, to boot faster" },
			{ id: "num_lock", label: "Boot Up NumLock Status", options: ["On", "Off"], default: "On", help: "Select power on state for NumLock" },
			{ id: "full_screen_logo", label: "Full Screen LOGO Show", options: enabled_disabled, default: "Disabled", help: "Shows a full screen logo instead of the POST messages" },
			{ id: "multi_threading", label: "CPU Multi-Threading", options: enabled_disabled, default: "Enabled", help: "Runs two threads on each processor core" },
			{ id: "virtualization", label: "Virtualization Technology", options: enabled_disabled, default: "Enabled", failsafe: "Disabled", help: "Lets one machine run several virtual machines, like VMware's" },
			{ id: "limit_cpuid", label: "Limit CPUID Max. to 3", options: enabled_disabled, default: "Disabled", help: "Set to Enabled for legacy operating systems, like NT4" },
			{ id: "init_display_first", label: "Init Display First", options: ["PEG", "PCI", "Onboard"], default: "PEG", help: "Select the display adapter to start first" },
		],
	},
	{
		title: "Integrated Peripherals",
		description: "Onboard I/O, USB Controllers...",
		items: [
			{ id: "sata_mode", label: "SATA Mode", options: ["IDE", "AHCI", "RAID"], default: "AHCI", failsafe: "IDE", help: "Select how the SATA controller works" },
			{ id: "usb_controller", label: "USB Controller", options: enabled_disabled, default: "Enabled", help: "Enable or disable the USB controllers" },
			{ id: "usb_keyboard", label: "USB Keyboard Support", options: enabled_disabled, default: "Enabled", help: "Lets a USB keyboard be used in MS-DOS" },
			{ id: "usb_storage", label: "USB Storage Function", options: enabled_disabled, default: "Enabled", help: "Lets USB storage devices be used in MS-DOS, and booted from" },
			{ id: "onboard_audio", label: "Onboard HD Audio", options: ["Auto", "Disabled"], default: "Auto", help: "Enable or disable the onboard audio" },
			{ id: "onboard_lan", label: "Onboard LAN Function", options: enabled_disabled, default: "Enabled", help: "Enable or disable the onboard network adapter" },
			{ id: "lan_boot_rom", label: "Onboard LAN Boot ROM", options: enabled_disabled, default: "Enabled", failsafe: "Disabled", help: "Lets the system boot from the network (IBA GE Slot 0600)" },
			{ id: "serial_port", label: "Onboard Serial Port 1", options: ["Disabled", "3F8/IRQ4", "2F8/IRQ3", "3E8/IRQ4", "2E8/IRQ3", "Auto"], default: "3F8/IRQ4", help: "Select an address and interrupt for the first serial port" },
			{ id: "parallel_port", label: "Onboard Parallel Port", options: ["Disabled", "378/IRQ7", "278/IRQ5", "3BC/IRQ7"], default: "378/IRQ7", help: "Select an address and interrupt for the parallel port" },
			{ id: "parallel_mode", label: "Parallel Port Mode", options: ["SPP", "EPP", "ECP", "ECP+EPP"], default: "ECP", failsafe: "SPP", help: "Select an operating mode for the parallel port" },
		],
	},
	{
		title: "Power Management Setup",
		description: "ACPI Suspend Type, Wake Up Events...",
		items: [
			{ id: "acpi_suspend", label: "ACPI Suspend Type", options: ["S1(POS)", "S3(STR)"], default: "S3(STR)", failsafe: "S1(POS)", help: "Select the ACPI state used for System Suspend" },
			{ id: "soft_off", label: "Soft-Off by Power button", options: ["Instant-off", "Delay 4 Sec."], default: "Instant-off", help: "Delay 4 Sec.: the power button suspends the system, unless held for 4 seconds" },
			{ id: "pme_wake_up", label: "PME Event Wake Up", options: enabled_disabled, default: "Enabled", help: "Lets PCI devices, like network adapters, wake up the system" },
			{ id: "power_on_by_keyboard", label: "Power On by Keyboard", options: ["Disabled", "Password", "Any Key", "Keyboard 98"], default: "Disabled", help: "Lets the keyboard turn the system on" },
			{ id: "power_on_by_mouse", label: "Power On by Mouse", options: ["Disabled", "Double Click"], default: "Disabled", help: "Lets the mouse turn the system on" },
			{ id: "resume_by_alarm", label: "Resume by Alarm", options: enabled_disabled, default: "Disabled", help: "Turns the system on at a set time" },
			{ id: "hpet", label: "HPET Support", options: enabled_disabled, default: "Enabled", help: "High Precision Event Timer, for Windows Vista and later" },
			{ id: "ac_back", label: "AC Back Function", options: ["Soft-Off", "Full-On", "Memory"], default: "Soft-Off", help: "What the system does when power comes back after a power failure" },
		],
	},
	{
		title: "PnP/PCI Configurations",
		description: "IRQ Resources, PCI Express...",
		items: [
			{ id: "resources_controlled_by", label: "Resources Controlled By", options: ["Auto(ESCD)", "Manual"], default: "Auto(ESCD)", help: "Auto(ESCD): the BIOS assigns the interrupts of Plug and Play devices" },
			{ id: "pci1_irq", label: "PCI1 IRQ Assignment", options: ["Auto", "3", "4", "5", "7", "9", "10", "11", "12", "14", "15"], default: "Auto", help: "Select an interrupt for the first PCI slot" },
			{ id: "pci2_irq", label: "PCI2 IRQ Assignment", options: ["Auto", "3", "4", "5", "7", "9", "10", "11", "12", "14", "15"], default: "Auto", help: "Select an interrupt for the second PCI slot" },
			{ id: "vga_palette_snoop", label: "PCI/VGA Palette Snoop", options: enabled_disabled, default: "Disabled", help: "For video capture cards that need the VGA card's palette" },
			{ id: "max_payload_size", label: "Maximum Payload Size", options: ["128", "256", "512", "1024", "2048", "4096"], default: "4096", failsafe: "128", help: "Select the largest PCI Express packet, in bytes" },
		],
	},
	{
		title: "PC Health Status",
		description: "Temperatures, Fan Speeds, Voltages...",
		live: true,
		items: [
			{ id: "reset_case_open", label: "Reset Case Open Status", options: enabled_disabled, default: "Disabled", help: "Clears the record of the case having been opened" },
			{ label: "Case Opened", value: () => "Yes" }, // (someone keeps prying the CR2032 out)
			{ label: "Vcore", value: () => `${reading(1.264, 0.02, 3)}V` },
			{ label: "DRAM Voltage", value: () => `${reading(1.2, 0.012, 3)}V` },
			{ label: "+3.3V", value: () => `${reading(3.312, 0.03, 3)}V` },
			{ label: "+12V", value: () => `${reading(12.096, 0.1, 3)}V` },
			{ label: "Current System Temperature", value: () => `${reading(34, 2)}°C` },
			{ label: "Current CPU Temperature", value: () => `${reading(41, 3)}°C` },
			{ label: "Current CPU FAN Speed", value: () => `${reading(1620, 60)} RPM` },
			{ label: "Current SYSTEM FAN Speed", value: () => `${reading(940, 40)} RPM` },
			{ id: "cpu_warning_temperature", label: "CPU Warning Temperature", options: ["Disabled", "60°C/140°F", "70°C/158°F", "80°C/176°F", "90°C/194°F"], default: "Disabled", failsafe: "80°C/176°F", help: "Warns when the CPU gets this hot" },
			{ id: "cpu_fan_fail_warning", label: "CPU FAN Fail Warning", options: enabled_disabled, default: "Disabled", failsafe: "Enabled", help: "Warns when the CPU fan stops" },
			{ id: "cpu_smart_fan", label: "CPU Smart FAN Control", options: enabled_disabled, default: "Enabled", help: "Turns the CPU fan faster as the CPU gets hotter" },
		],
	},
	{
		title: "Frequency/Voltage Control",
		description: "Change CPU's Clock & Voltage",
		items: [
			{ label: "Processor", value: () => "C^3(R) SSPU Lynx Gen.II" },
			{ id: "cpu_ratio", label: "CPU Clock Ratio", options: ["Auto", "40X", "41X", "42X", "43X", "44X", "45X", "46X"], default: "Auto", help: "Multiplies the 100MHz host clock into the CPU's frequency" },
			{ label: "CPU Frequency", value: () => `${cpu_ghz(values.cpu_ratio)}GHz (100x${cpu_ghz(values.cpu_ratio) * 10})` },
			{ id: "memory_multiplier", label: "System Memory Multiplier", options: ["Auto", "21.33", "24.00", "26.00", "28.00", "30.00", "32.00"], default: "Auto", help: "Multiplies the host clock into the memory's frequency" },
			{ label: "Memory Frequency (MHz)", value: () => `${dram_mhz(values.memory_multiplier)}` },
			{ id: "dram_timing", label: "DRAM Timing Selectable", options: ["Auto", "Quick", "Expert"], default: "Auto", help: "Auto: the timings are read from the memory's SPD" },
			{ label: "CAS Latency Time", value: () => "36" },
			{ label: "tRCD / tRP / tRAS", value: () => "40 / 40 / 96" },
			{ id: "cpu_vcore", label: "CPU Vcore", options: ["Auto", "Normal", "+0.025V", "+0.050V", "+0.100V"], default: "Auto", help: "Raises the CPU's voltage, for overclocking" },
			{ id: "dram_voltage", label: "DRAM Voltage", options: ["Auto", "1.200V", "1.350V", "1.500V"], default: "Auto", help: "Raises the memory's voltage, for overclocking" },
		],
	},
];

const settings = pages.flatMap((page) => page.items.filter((item) => item.id));

function defaults(kind = "optimized") {
	return Object.fromEntries(settings.map((item) => [item.id, kind === "fail-safe" ? item.failsafe ?? item.default : item.default]));
}

function load_saved() {
	try {
		return JSON.parse(localStorage.getItem(settings_key)) || {};
	} catch (error) {
		return {}; // no local storage
	}
}

// What's saved in CMOS, and what's set now (saved with F10)
let saved = { ...defaults(), ...load_saved() };
let values = { ...saved };

const actions = [
	{ label: "Load Fail-Safe Defaults", description: "Load Fail-Safe Defaults", run: () => ask("Load Fail-Safe Defaults (Y/N)? ", "N", () => Object.assign(values, defaults("fail-safe"))) },
	{ label: "Load Optimized Defaults", description: "Load Optimized Defaults", run: () => ask("Load Optimized Defaults (Y/N)? ", "N", () => Object.assign(values, defaults())) },
	{ label: "Set Supervisor Password", description: "Change/Set/Disable Password", run: () => ask_password() },
	{ label: "Set User Password", description: "Change/Set/Disable Password", run: () => ask_password() },
	{ label: "Save & Exit Setup", description: "Save Data to CMOS", run: () => ask_save_and_exit() },
	{ label: "Exit Without Saving", description: "Abandon all Data", run: () => ask_quit() },
];

// Where things are: the main menu (page null), with a column of pages and one of actions, or a page and its selected setting
let page_index = null;
let main_menu = { column: 0, row: 0 };
let item_index = 0;
let dialog = null;

function restart() {
	sessionStorage.removeItem("bios-unlocked");
	location.replace("../$POST.html");
}
function ask(question, answer, on_yes) {
	dialog = { type: "question", question, answer, on_yes };
}
function ask_save_and_exit() {
	ask("SAVE to CMOS and EXIT (Y/N)? ", "Y", () => {
		try {
			localStorage.setItem(settings_key, JSON.stringify(values));
		} catch (error) {
			// no local storage
		}
		restart();
	});
}
function ask_quit() {
	ask("Quit Without Saving (Y/N)? ", "N", restart);
}
function ask_password() {
	dialog = { type: "password", prompt: "Enter Password: ", typed: "" };
}
function tell(lines) {
	dialog = { type: "message", lines };
}

const selectable = (item) => Boolean(item.id);
function first_selectable(page) {
	return page.items.findIndex(selectable);
}
function open_page(index) {
	page_index = index;
	item_index = first_selectable(pages[index]);
}
function move_item(step) {
	const items = pages[page_index].items;
	for (let index = item_index + step; index >= 0 && index < items.length; index += step) {
		if (selectable(items[index])) {
			item_index = index;
			return;
		}
	}
}
function change_value(item, step) {
	const index = item.options.indexOf(values[item.id]);
	values[item.id] = item.options[(index + step + item.options.length) % item.options.length];
}

// Keys, as they're named in the legends: "Up", "Enter", "Esc", "F10", "PgUp", "+", "Y", ...
const key_names = { ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right", Escape: "Esc", PageUp: "PgUp", PageDown: "PgDn" };

function handle_key(key) {
	key = key_names[key] ?? key;
	if (dialog) {
		return handle_dialog_key(key);
	}
	if (key === "F10") {
		ask_save_and_exit();
	} else if (key === "F1") {
		tell(["General Help", "", "↑↓→← : Move", "Enter : Select", "+/-/PU/PD : Value", "F5 : Previous Values", "F6 : Fail-Safe Defaults", "F7 : Optimized Defaults", "F10 : Save & Exit Setup", "Esc : Exit Current Menu"]);
	} else if (page_index === null) {
		const column_length = main_menu.column === 0 ? pages.length : actions.length;
		if (key === "Up" || key === "Down") {
			main_menu.row = (main_menu.row + (key === "Up" ? -1 : 1) + column_length) % column_length;
		} else if (key === "Left" || key === "Right") {
			main_menu.column = 1 - main_menu.column;
			main_menu.row = Math.min(main_menu.row, (main_menu.column === 0 ? pages.length : actions.length) - 1);
		} else if (key === "Enter") {
			if (main_menu.column === 0) {
				open_page(main_menu.row);
			} else {
				actions[main_menu.row].run();
			}
		} else if (key === "Esc") {
			ask_quit();
		} else {
			return false;
		}
	} else {
		const item = pages[page_index].items[item_index];
		if (key === "Up" || key === "Down") {
			move_item(key === "Up" ? -1 : 1);
		} else if (key === "Enter") {
			dialog = { type: "options", item, index: item.options.indexOf(values[item.id]) };
		} else if (key === "PgUp" || key === "+" || key === "PgDn" || key === "-") {
			change_value(item, key === "PgUp" || key === "+" ? 1 : -1);
		} else if (key === "Esc") {
			page_index = null;
		} else if (key === "F5") {
			ask("Load Previous Values (Y/N)? ", "N", () => Object.assign(values, saved));
		} else if (key === "F6") {
			actions[0].run();
		} else if (key === "F7") {
			actions[1].run();
		} else {
			return false;
		}
	}
	render();
	return true;
}

function handle_dialog_key(key) {
	if (dialog.type === "question") {
		if (/^[yn]$/i.test(key)) {
			dialog.answer = key.toUpperCase();
		} else if (key === "Enter") {
			const { answer, on_yes } = dialog;
			dialog = null;
			if (answer === "Y") {
				on_yes();
			}
		} else if (key === "Esc") {
			dialog = null;
		} else {
			return false;
		}
	} else if (dialog.type === "options") {
		const { item } = dialog;
		if (key === "Up" || key === "Down") {
			dialog.index = Math.min(item.options.length - 1, Math.max(0, dialog.index + (key === "Up" ? -1 : 1)));
		} else if (key === "Enter") {
			values[item.id] = item.options[dialog.index];
			dialog = null;
		} else if (key === "Esc") {
			dialog = null;
		} else {
			return false;
		}
	} else if (dialog.type === "password") {
		if (key === "Enter") {
			if (dialog.prompt === "Enter Password: " && dialog.typed) {
				dialog = { type: "password", prompt: "Confirm Password: ", typed: "", first: dialog.typed };
			} else if (dialog.first !== undefined && dialog.typed !== dialog.first) {
				tell(["PASSWORDS DO NOT MATCH !!!", "", "Press any key to continue..."]);
			} else {
				// (it stays 1998)
				tell(["PASSWORD CHANGE NOT PERMITTED !!!", "", "Press any key to continue..."]);
			}
		} else if (key === "Esc") {
			dialog = null;
		} else if (key === "Backspace") {
			dialog.typed = dialog.typed.slice(0, -1);
		} else if (key.length === 1 && dialog.typed.length < 8) {
			dialog.typed += key;
		} else {
			return false;
		}
	} else {
		dialog = null; // (any key)
	}
	render();
	return true;
}

document.addEventListener("keydown", (event) => {
	if (event.ctrlKey || event.altKey || event.metaKey) {
		return;
	}
	if (handle_key(event.key)) {
		event.preventDefault(); // (F1, F5, F6, F7 and F10 do things in browsers)
	}
});

// Rendering

function element(tag, class_name, ...children) {
	const node = document.createElement(tag);
	if (class_name) {
		node.className = class_name;
	}
	node.append(...children.flat().filter((child) => child !== null && child !== undefined));
	return node;
}
// A key in a legend, which can be clicked
function key_hint(key, text) {
	const node = element("span", "bios-key", text);
	node.addEventListener("click", (event) => {
		event.stopPropagation();
		handle_key(key);
	});
	return node;
}
// Click to select, and click what's selected to open it
function clickable(node, is_selected, select, open) {
	node.addEventListener("click", () => {
		if (dialog) {
			return;
		}
		if (is_selected) {
			open();
		} else {
			select();
		}
		render();
	});
	return node;
}

function render_main() {
	const columns = [pages, actions].map((entries, column) => element("div", "bios-menu-column", entries.map((entry, row) => {
		const is_selected = main_menu.column === column && main_menu.row === row;
		return clickable(
			element("div", "bios-menu-item" + (is_selected ? " selected" : ""), element("span", "bios-marker", column === 0 ? "►" : ""), element("span", null, entry.title ?? entry.label)),
			is_selected,
			() => { main_menu = { column, row }; },
			() => handle_key("Enter"),
		);
	})));
	const selected = main_menu.column === 0 ? pages[main_menu.row] : actions[main_menu.row];
	return [
		element("div", "bios-title", copyright),
		element("div", "bios-frame",
			element("div", "bios-menu", columns),
			element("div", "bios-keys bios-main-keys",
				element("div", null, key_hint("Esc", "Esc : Quit"), key_hint("Enter", "↑ ↓ → ← : Select Item")),
				element("div", null, key_hint("F10", "F10 : Save & Exit Setup")),
			),
			element("div", "bios-description", selected.description),
		),
	];
}

function render_page() {
	const page = pages[page_index];
	const item = page.items[item_index];
	return [
		element("div", "bios-title", copyright),
		element("div", "bios-subtitle", page.title),
		element("div", "bios-frame bios-page",
			element("div", "bios-items", page.items.map((entry, index) => {
				const is_selected = index === item_index;
				const row = element("div", "bios-item" + (selectable(entry) ? "" : " information") + (is_selected ? " selected" : ""),
					element("span", "bios-label", entry.label),
					element("span", "bios-value", selectable(entry) ? `[${values[entry.id]}]` : entry.value()),
				);
				return selectable(entry) ? clickable(row, is_selected, () => { item_index = index; }, () => handle_key("Enter")) : row;
			})),
			element("div", "bios-help",
				element("div", "bios-help-title", "Item Help"),
				element("div", "bios-help-level", "Menu Level  ►"),
				element("p", null, item.help),
			),
		),
		element("div", "bios-keys",
			element("div", null, key_hint("Down", "↑↓→←:Move"), key_hint("Enter", "Enter:Select"), key_hint("PgUp", "+/-/PU/PD:Value"), key_hint("F10", "F10:Save"), key_hint("Esc", "ESC:Exit"), key_hint("F1", "F1:General Help")),
			element("div", null, key_hint("F5", "F5: Previous Values"), key_hint("F6", "F6: Fail-Safe Defaults"), key_hint("F7", "F7: Optimized Defaults")),
		),
	];
}

function render_dialog() {
	let box;
	if (dialog.type === "question") {
		// (the Y and the N can be clicked: Y or N, then Enter)
		const answer = (letter) => {
			const node = element("span", "bios-answer", letter);
			node.addEventListener("click", () => {
				handle_key(letter);
				handle_key("Enter");
			});
			return node;
		};
		box = element("div", "bios-dialog bios-question",
			element("span", null, dialog.question.replace("(Y/N)? ", "(")), answer("Y"), "/", answer("N"), ")? ",
			element("span", "bios-input", dialog.answer), element("span", "bios-cursor", "_"),
		);
	} else if (dialog.type === "options") {
		box = element("div", "bios-dialog bios-options",
			element("div", "bios-dialog-title", dialog.item.label),
			dialog.item.options.map((option, index) => {
				const node = element("div", "bios-option" + (index === dialog.index ? " selected" : ""), option);
				node.addEventListener("click", () => {
					dialog.index = index;
					handle_key("Enter");
				});
				return node;
			}),
			element("div", "bios-dialog-keys", "↑↓:Move ENTER:Accept ESC:Abort"),
		);
	} else if (dialog.type === "password") {
		box = element("div", "bios-dialog bios-question",
			dialog.prompt, element("span", "bios-input", "*".repeat(dialog.typed.length)), element("span", "bios-cursor", "_"),
		);
	} else {
		box = element("div", "bios-dialog bios-message", dialog.lines.map((line) => element("div", null, line || " ")));
	}
	box.addEventListener("click", (event) => event.stopPropagation());
	// (clicking outside of it is Esc, or any key for a message)
	const overlay = element("div", "bios-overlay", box);
	overlay.addEventListener("click", () => handle_key("Esc"));
	return overlay;
}

const screen_element = document.getElementById("bios");
function render() {
	screen_element.replaceChildren(...(page_index === null ? render_main() : render_page()), ...(dialog ? [render_dialog()] : []));
}
render();

// The clock and the sensors
setInterval(() => {
	if (page_index !== null && pages[page_index].live) {
		render();
	}
}, 1000);
