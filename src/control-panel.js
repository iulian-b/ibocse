// Settings, in the Start menu: the Control Panel and Printers, and what's in them.
// What they change is kept in desktop_settings, and put in effect by src/settings.js.

// Large icons, as in a folder, and a status bar that describes the one selected: [{ title, iconID, description, open }]
function make_folder_window(title, iconID, items) {
	const $w = make_dialog_window(title, iconID, { resizable: true });
	const $status = $("<div class='status-bar inset-shallow'>");
	const $grid = $("<div class='settings-icons' role='listbox' tabindex='0'>");
	let selected_index = -1;
	const select = (index) => {
		selected_index = index;
		$grid.children().each((i, element) => {
			element.classList.toggle("selected", i === index);
			element.setAttribute("aria-selected", i === index);
		});
		$status.text(index === -1 ? `${items.length} object(s)` : items[index].description);
	};
	for (const [index, item] of items.entries()) {
		$("<div class='settings-icon' role='option'>")
			.append($("<img width='32' height='32' draggable='false'>").attr("src", getIconPath(item.iconID, 32)), $("<span>").text(item.title))
			.on("pointerdown", (event) => {
				event.stopPropagation();
				select(index);
			})
			.on("dblclick", () => item.open())
			.appendTo($grid);
	}
	$grid.on("pointerdown", () => select(-1));
	$grid.on("keydown", (event) => {
		const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
		if (step) {
			select(Math.min(items.length - 1, Math.max(0, selected_index === -1 ? 0 : selected_index + step)));
			event.preventDefault();
		} else if (event.key === "Enter" && selected_index !== -1) {
			items[selected_index].open();
		}
	});
	select(-1);
	$w.$content.addClass("settings-folder").append($grid, $status);
	$w.setDimensions({ innerWidth: 440, innerHeight: 260 });
	return $w;
}

function ControlPanel() {
	return open_dialog_window("control-panel", () => make_folder_window("Control Panel", "settings", [
		{ title: "Add/Remove Programs", iconID: "programs", description: "Sets up programs and creates shortcuts.", open: AddRemovePrograms },
		{ title: "Display", iconID: "computer3", description: "Changes display settings.", open: DisplayProperties },
		{ title: "Fonts", iconID: "fonts-folder", description: "Displays and manages fonts on your computer.", open: () => Explorer("/Windows/Fonts/") },
		{ title: "Network", iconID: "network", description: "Configures network hardware and software.", open: () => deny_access("Network") },
		{ title: "Passwords", iconID: "credentials", description: "Changes passwords and sets security options.", open: () => deny_access("Passwords") },
		{ title: "Printers", iconID: "printers-folder", description: "Adds, removes, and changes settings for printers.", open: Printers },
		{ title: "Sounds", iconID: "speaker-volume-control", description: "Assigns sounds to system events.", open: () => deny_access("Sounds") },
		{ title: "System", iconID: "my-computer", description: "Provides system information and changes advanced settings.", open: SystemProperties },
	]));
}

function Printers() {
	return open_dialog_window("printers", () => make_folder_window("Printers", "printers-folder", [
		{ title: "Add Printer", iconID: "printer", description: "Installs a new printer.", open: AddPrinterWizard },
	]));
}

// Display: the wallpaper, the color scheme, and the CRT monitor effect

// (as in css/control-panel.css)
const monitor_screen_width = 152;

function DisplayProperties() {
	return open_dialog_window("display", () => {
		const $w = make_dialog_window("Display Properties", "computer3");
		// What's chosen, until OK or Apply
		const chosen = {
			wallpaper: desktop_settings.wallpaper,
			wallpaper_display: desktop_settings.wallpaper_display,
			color_scheme: has_color_scheme(desktop_settings.color_scheme) ? desktop_settings.color_scheme : default_settings.color_scheme,
			crt_monitor: desktop_settings.crt_monitor,
		};
		let $apply;
		const choose = (changes) => {
			Object.assign(chosen, changes);
			$apply.prop("disabled", Object.keys(chosen).every((key) => chosen[key] === desktop_settings[key]));
			update_previews();
		};

		// Background
		const $monitor = $("<div class='monitor'><div class='monitor-screen'></div></div>");
		const $wallpapers = $ListBox({ on_select: (wallpaper) => wallpaper !== undefined && wallpaper !== chosen.wallpaper && choose({ wallpaper }) });
		const $display_options = $("<div class='display-options'>").append(["tile", "center", "stretch"].map((display) =>
			$("<label class='radio-field'>").append(
				$("<input type='radio' name='wallpaper-display'>").val(display).prop("checked", display === chosen.wallpaper_display)
					.on("change", () => choose({ wallpaper_display: display })),
				$("<span>").text(display[0].toUpperCase() + display.slice(1)),
			)
		));
		const $background = $("<div class='background-panel'>").append(
			$monitor,
			$("<fieldset>").append(
				$("<legend>").text("Wallpaper"),
				$("<div class='wallpaper-chooser'>").append($wallpapers, $("<div>").append($("<div class='field-label'>").text("Display:"), $display_options)),
			),
		);
		// (the pictures in My Pictures, like Windows' own .bmp files in C:\Windows)
		const wallpaper_items = [{ label: "(None)", value: null }, { label: booted_os.name, value: "default" }];
		$wallpapers.set_items(wallpaper_items, chosen.wallpaper);
		withFilesystem(() => {
			ZenFS.fs.readdir("/My Pictures", (error, names = []) => {
				const pictures = names
					.filter((name) => wallpaper_picture_extensions.includes(file_extension_from_path(name).toLowerCase()))
					.map((name) => ({ label: name.replace(/\.\w+$/, ""), value: `/My Pictures/${name}` }));
				if (chosen.wallpaper?.startsWith("/") && !pictures.some((picture) => picture.value === chosen.wallpaper)) {
					pictures.push({ label: file_name_from_path(chosen.wallpaper).replace(/\.\w+$/, ""), value: chosen.wallpaper });
				}
				$wallpapers.set_items([...wallpaper_items, ...pictures], chosen.wallpaper);
			});
		});

		// Appearance
		const $preview = $(`
			<div class="appearance-preview inset-deep" aria-hidden="true">
				<div class="preview-window preview-inactive"><div class="preview-titlebar">Inactive Window</div></div>
				<div class="preview-window preview-active">
					<div class="preview-titlebar">Active Window</div>
					<div class="preview-menubar"><span>Normal</span><span class="preview-disabled">Disabled</span><span class="preview-selected">Selected</span></div>
					<div class="preview-client inset-deep">Window Text</div>
				</div>
				<div class="preview-window preview-message">
					<div class="preview-titlebar">Message Box</div>
					<div class="preview-message-text">Message Text</div>
					<button tabindex="-1">OK</button>
				</div>
			</div>
		`);
		const $schemes = $("<select>").append(Object.keys(color_schemes).filter(has_color_scheme).sort().map((name) => $("<option>").val(name).text(name)))
			.val(chosen.color_scheme)
			.on("change", () => choose({ color_scheme: $schemes.val() }));
		const $appearance = $("<div class='appearance-panel'>").append(
			$preview,
			$("<label class='field-label'>").append($("<span>").text("Scheme:"), $schemes),
		);

		// Effects
		const $effects = $("<div class='effects-panel'>").append(
			$("<fieldset>").append(
				$("<legend>").text("Visual effects"),
				$Checkbox("Show the screen as on a CRT monitor (scan lines and curved glass)", chosen.crt_monitor, (crt_monitor) => choose({ crt_monitor })),
			),
		);

		let preview_scheme;
		let preview_wallpaper_request = 0;
		function update_previews() {
			if (preview_scheme !== chosen.color_scheme) {
				preview_scheme = chosen.color_scheme;
				const css_properties = color_scheme_css_properties(chosen.color_scheme);
				applyCSSProperties(css_properties, { element: $preview[0] });
				$monitor.find(".monitor-screen").css("background-color", css_properties["--Background"]);
			}
			$display_options.find("input").prop("disabled", !chosen.wallpaper || chosen.wallpaper === "default");
			// The wallpaper, at the size it'd be on this screen
			const request = ++preview_wallpaper_request;
			const $screen = $monitor.find(".monitor-screen");
			get_wallpaper_url(chosen.wallpaper, (url) => {
				if (request !== preview_wallpaper_request) {
					return;
				}
				if (chosen.wallpaper === "default" || !url || chosen.wallpaper_display === "stretch") {
					$screen.css({ ...wallpaper_css(url, "stretch"), backgroundSize: chosen.wallpaper === "default" ? "cover" : "100% 100%" });
					return;
				}
				const picture = new Image();
				picture.onload = () => {
					if (request === preview_wallpaper_request) {
						const scale = monitor_screen_width / innerWidth;
						$screen.css({ ...wallpaper_css(url, chosen.wallpaper_display), backgroundSize: `${picture.naturalWidth * scale}px ${picture.naturalHeight * scale}px` });
					}
				};
				picture.src = url;
			});
		}

		const apply = () => {
			if (chosen.wallpaper !== desktop_settings.wallpaper || chosen.wallpaper_display !== desktop_settings.wallpaper_display) {
				Object.assign(desktop_settings, { wallpaper: chosen.wallpaper, wallpaper_display: chosen.wallpaper_display });
				try {
					// (instead of a picture set as the wallpaper from Paint)
					localStorage.removeItem(os_storage_key("wallpaper-data-url"));
					localStorage.removeItem(os_storage_key("wallpaper-repeat"));
				} catch (error) {
					// no local storage
				}
				apply_wallpaper();
			}
			if (chosen.color_scheme !== desktop_settings.color_scheme) {
				desktop_settings.color_scheme = chosen.color_scheme;
				try {
					// (instead of a .theme file opened from the drive)
					localStorage.removeItem(os_storage_key("desktop-theme"));
					localStorage.removeItem(os_storage_key("desktop-theme-path"));
				} catch (error) {
					// no local storage
				}
				apply_color_scheme();
			}
			if (chosen.crt_monitor !== desktop_settings.crt_monitor) {
				desktop_settings.crt_monitor = chosen.crt_monitor;
				apply_crt_monitor();
			}
			save_settings();
			$apply.prop("disabled", true);
		};
		const $buttons = $DialogButtons([
			{ label: "OK", is_default: true, action: () => { apply(); $w.close(); } },
			{ label: "Cancel", action: () => $w.close() },
			{ label: "Apply", action: apply },
		]);
		$apply = $buttons.children().last().prop("disabled", true);
		$w.$content.addClass("property-sheet display-properties").append(
			$Tabs([
				{ label: "Background", $panel: $background },
				{ label: "Appearance", $panel: $appearance },
				{ label: "Effects", $panel: $effects },
			]),
			$buttons,
		);
		update_previews();
		return $w;
	});
}

// Add/Remove Programs: removes (and puts back) the games, their shortcuts on the desktop, and their files in C:\Games
function set_program_removed(program, removed) {
	desktop_settings.removed_programs = desktop_settings.removed_programs.filter((exe) => exe !== program.exe);
	if (removed) {
		desktop_settings.removed_programs.push(program.exe);
	}
	save_settings();

	const shortcut = desktop_icons.find(({ title }) => title === program.shortcut);
	if (shortcut) {
		const index = folder_view.items.indexOf(shortcut.item);
		if (removed && index !== -1) {
			folder_view.items.splice(index, 1);
			shortcut.item.element.remove();
		} else if (!removed && index === -1) {
			// back where it was, after the shortcut before it
			let insert_at = 0;
			for (let i = desktop_icons.indexOf(shortcut) - 1; i >= 0; i--) {
				const at = folder_view.items.indexOf(desktop_icons[i].item);
				if (at !== -1) {
					insert_at = at + 1;
					break;
				}
			}
			folder_view.items.splice(insert_at, 0, shortcut.item);
			folder_view.element.append(shortcut.item.element);
		}
		folder_view.arrange_icons();
	}

	const file_path = "/Games/" + program.exe;
	withFilesystem(() => {
		if (removed) {
			ZenFS.fs.unlink(file_path, () => {
				// (it may have been deleted already)
			});
		} else {
			// The site's own file comes back when the drive forgets it was deleted
			const drive = ZenFS.mounts.get("/");
			if (drive.journal.isDeleted(file_path)) {
				drive.journal.delete("delete", file_path);
			}
		}
	});
}

function AddRemovePrograms() {
	return open_dialog_window("add-remove-programs", () => {
		const $w = make_dialog_window("Add/Remove Programs Properties", "programs");
		const $remove = $("<button>").text("Add/Remove...").prop("disabled", true);
		const $programs = $ListBox({
			on_select: (program) => $remove.prop("disabled", !program),
			on_activate: (program) => remove(program),
		});
		const list_programs = (selected) => {
			$programs.set_items(removable_programs
				.filter((program) => !desktop_settings.removed_programs.includes(program.exe))
				.map((program) => ({ label: program.name, value: program, iconID: exe_extension_icon[program.exe.replace(/\.exe$/, "")] })), selected);
		};
		const remove = async (program) => {
			if (await ask_yes_or_no("Confirm Program Removal", `Are you sure you want to remove '${program.name}' and all of its components?`)) {
				set_program_removed(program, true);
				list_programs();
			}
		};
		$remove.on("click", () => {
			const program = $programs.get_selected()?.value;
			if (program) {
				remove(program);
			}
		});
		const $restore = $("<button>").text("Restore Defaults").on("click", async () => {
			if (await ask_yes_or_no("Restore Defaults", "Do you want to put back all of the programs that were removed?")) {
				for (const program of removable_programs) {
					set_program_removed(program, false);
				}
				list_programs();
			}
		});
		list_programs();

		const $install = $("<button>").text("Install...").on("click", () => deny_access("Add/Remove Programs", "Cannot install programs."));
		const $panel = $("<div class='add-remove-panel'>").append(
			$("<div class='explanation'>").append(
				$("<img width='32' height='32' draggable='false'>").attr("src", getIconPath("cdmusic", 32)),
				$("<p>").text("To install a new program from a floppy disk or CD-ROM drive, click Install."),
			),
			$("<div class='buttons-right'>").append($install),
			$("<hr class='separator'>"),
			$("<div class='explanation'>").append(
				$("<img width='32' height='32' draggable='false'>").attr("src", getIconPath("programs", 32)),
				$("<p>").text("The following software can be automatically removed by Windows. To remove a program, select it from the list and click Add/Remove."),
			),
			$programs,
			$("<div class='buttons-right'>").append($restore, $remove),
		);
		$w.$content.addClass("property-sheet add-remove-programs").append(
			$Tabs([{ label: "Install/Uninstall", $panel }]),
			$DialogButtons([
				{ label: "OK", is_default: true, action: () => $w.close() },
				{ label: "Cancel", action: () => $w.close() },
			]),
		);
		return $w;
	});
}

// System: what the computer is (as far as the browser says), the startup programs, and restoring drive C:

// The display adapter, as WebGL names it
function get_display_adapter_name() {
	try {
		const gl = document.createElement("canvas").getContext("webgl");
		const info = gl?.getExtension("WEBGL_debug_renderer_info");
		const name = info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
		gl?.getExtension("WEBGL_lose_context")?.loseContext();
		return name || null;
	} catch (error) {
		return null;
	}
}

function get_sample_rate() {
	try {
		const audio_context = new AudioContext();
		const sample_rate = audio_context.sampleRate;
		audio_context.close();
		return sample_rate;
	} catch (error) {
		return null; // no Web Audio
	}
}

// Undoes everything done to drive C: in this browser: files saved and changed (in IndexedDB), and files deleted
async function restore_drive() {
	if (!await ask_yes_or_no("Restore C: Drive", "Restoring drive C: puts it back the way it came: files saved or changed on it are lost, and deleted files come back.\n\nAre you sure you want to restore drive C:?")) {
		return;
	}
	// (the programs removed with Add/Remove Programs come back with their files)
	desktop_settings.removed_programs = [];
	save_settings();
	const request = indexedDB.open("C: drive");
	const restart = () => {
		try {
			localStorage.removeItem(journal_storage_key);
		} catch (error) {
			// no local storage
		}
		location.reload();
	};
	request.onsuccess = () => {
		const database = request.result;
		if (!database.objectStoreNames.contains("C: drive")) {
			database.close();
			return restart();
		}
		const transaction = database.transaction("C: drive", "readwrite");
		transaction.objectStore("C: drive").clear();
		transaction.oncomplete = () => {
			database.close();
			restart();
		};
		transaction.onerror = () => alert("Failed to restore drive C:\n\n" + transaction.error);
	};
	request.onerror = () => alert("Failed to restore drive C:\n\n" + request.error);
}

function SystemProperties() {
	return open_dialog_window("system", () => {
		const $w = make_dialog_window("System Properties", "my-computer");
		let cv_at_startup = desktop_settings.cv_at_startup;

		const cores = navigator.hardwareConcurrency || 1;
		const memory = navigator.deviceMemory ? `${(navigator.deviceMemory * 1024).toLocaleString("en-US", { minimumFractionDigits: 1 })}MB RAM` : "640KB RAM";
		const $general = $("<div class='system-general'>").append(
			$("<img class='system-picture' width='96' height='96' draggable='false'>").attr("src", getIconPath("my-computer", 48)),
			$("<dl class='system-info'>").append(
				$("<dt>").text("System:"),
				$("<dd>").append(booted_os.system_name, $("<br>"), booted_os.version),
				$("<dt>").text("Registered to:"),
				$("<dd>").append("ibocse", $("<br>"), "crlab2-h032", $("<br>"), "24796-OEM-0014736-66386"),
				$("<dt>").text("Computer:"),
				$("<dd>").append(`${cores} x Pentium(r) Processor`, $("<br>"), memory),
			),
		);

		// Device Manager, from what the browser tells about the computer
		const touch = matchMedia("(pointer: coarse)").matches;
		const sample_rate = get_sample_rate();
		const connection = navigator.connection?.effectiveType;
		const devices = [
			["my-computer", "Computer", []],
			["cdmusic", "CDROM", ["GENERIC CD-ROM DRIVE"]],
			["hard-disk-drive", "Disk drives", ["GENERIC IDE DISK TYPE47"]],
			["computer3", "Display adapters", [get_display_adapter_name() ?? "Standard Display Adapter (VGA)"]],
			[null, "Keyboard", ["Standard 101/102-Key or Microsoft Natural Keyboard"]],
			[null, "Monitor", [`Plug and Play Monitor (${screen.width} x ${screen.height}, ${screen.colorDepth}-bit color)`]],
			[null, "Mouse", [touch ? `Touch screen (${navigator.maxTouchPoints || 1} points)` : "Standard Serial Mouse"]],
			["network", "Network adapters", [connection ? `Dial-Up Adapter (${connection})` : "Dial-Up Adapter"]],
			["printer", "Ports (COM & LPT)", ["Communications Port (COM1)", "Printer Port (LPT1)"]],
			["speaker", "Sound, video and game controllers", [sample_rate ? `Sound Blaster 16 or AWE-32 (${sample_rate} Hz)` : "No sound card"]],
			["chip", "System devices", ["Programmable interrupt controller", "System timer", `${navigator.userAgentData?.platform || navigator.platform || "PC"} system board`]],
		];
		const $device_list = $("<div class='device-list list-box inset-deep'>").append(devices.map(([iconID, type, names]) =>
			$("<div class='device-type'>").append(
				$("<div class='list-item'>").append(iconID ? $("<img width='16' height='16' draggable='false'>").attr("src", getIconPath(iconID, 16)) : $("<span class='no-icon'>"), $("<span>").text(type)),
				names.map((name) => $("<div class='list-item device'>").text(name)),
			)
		));
		const $device_manager = $("<div class='device-manager'>").append($("<p>").text("View devices by type:"), $device_list);

		// Performance (System Resources: less free with more windows open)
		const windows_open = $(".os-window").length;
		const $performance = $("<div class='performance-panel'>").append(
			$("<fieldset>").append(
				$("<legend>").text("Performance status"),
				$("<dl class='performance-status'>").append(
					[["Memory:", memory], ["System Resources:", `${Math.max(5, 92 - 4 * windows_open)}% free`], ["File System:", "32-bit"], ["Virtual Memory:", "32-bit"], ["Disk Compression:", "Not installed"], ["PC Cards (PCMCIA):", "No PCMCIA sockets installed"]]
						.flatMap(([label, value]) => [$("<dt>").text(label), $("<dd>").text(value)]),
				),
				$("<p>").text("Your system is configured for optimal performance."),
			),
			$("<fieldset>").append(
				$("<legend>").text("Advanced settings"),
				$("<div class='buttons-row'>").append(
					["File System...", "Graphics...", "Virtual Memory..."].map((label) => $("<button>").text(label).on("click", () => deny_access(label.replace("...", "")))),
				),
				$("<div class='buttons-row'>").append($("<button>").text("Restore C: Drive...").on("click", restore_drive)),
			),
		);

		// Startup (like System Configuration Utility's)
		const $startup = $("<div class='startup-panel'>").append(
			$("<p>").text("Choose the programs to run when Windows starts:"),
			$("<div class='list-box inset-deep startup-list'>").append(
				$("<div class='list-item'>").append(
					$Checkbox("CV (EN).pdf", cv_at_startup, (checked) => {
						cv_at_startup = checked;
					}),
					$("<span class='startup-command'>").text("C:\\My Documents\\CV (EN).pdf"),
				),
			),
		);

		$w.$content.addClass("property-sheet system-properties").append(
			$Tabs([
				{ label: "General", $panel: $general },
				{ label: "Device Manager", $panel: $device_manager },
				{ label: "Performance", $panel: $performance },
				{ label: "Startup", $panel: $startup },
			]),
			$DialogButtons([
				{
					label: "OK", is_default: true, action: () => {
						desktop_settings.cv_at_startup = cv_at_startup;
						save_settings();
						$w.close();
					},
				},
				{ label: "Cancel", action: () => $w.close() },
			]),
		);
		return $w;
	});
}

// Printers: the Add Printer Wizard, which can't install a printer

const printer_models = {
	"Canon": ["Canon Bubble-Jet BJ-10e", "Canon Bubble-Jet BJC-4000", "Canon LBP-4"],
	"Epson": ["Epson LQ-570", "Epson LX-300", "Epson Stylus COLOR"],
	"HP": ["HP DeskJet 500", "HP DeskJet 660C", "HP LaserJet 4L", "HP LaserJet 5P"],
	"IBM": ["IBM Proprinter II", "IBM 4019 LaserPrinter"],
	"NEC": ["NEC Pinwriter P2200"],
	"Okidata": ["Okidata ML 320"],
	"Star": ["Star NX-1000"],
};

// The "Copying Files..." box, before it all goes wrong
function copy_printer_files(file_name, then) {
	const $w = make_dialog_window("Copying Files...", "printer");
	const $bar = $("<div class='progress-bar-fill'>");
	$w.$content.addClass("copying-files").append(
		$("<p>").text(`Source: A:\\${file_name}`),
		$("<p>").text("Destination: C:\\WINDOWS\\SYSTEM"),
		$("<div class='progress-bar inset-deep'>").append($bar),
	);
	$w.center();
	keep_in_front($w);
	let percent = 0;
	const timer = setInterval(() => {
		percent += 10;
		$bar.css("width", `${percent}%`);
		if (percent >= 100) {
			clearInterval(timer);
			$w.close();
			then();
		}
	}, 150);
	$w.onClosed(() => clearInterval(timer));
}

function AddPrinterWizard() {
	return open_dialog_window("add-printer", () => {
		const $w = make_dialog_window("Add Printer Wizard", "printer");
		let step = 0;
		let attachment = "local";
		let manufacturer = Object.keys(printer_models)[0];
		let model = printer_models[manufacturer][0];
		let network_path = "\\\\LAB02\\X01_b";

		const $models = $ListBox({ on_select: (value) => value && (model = value) });
		const $manufacturers = $ListBox({
			on_select: (value) => {
				if (value && value !== manufacturer) {
					manufacturer = value;
					model = printer_models[manufacturer][0];
					$models.set_items(printer_models[manufacturer].map((name) => ({ label: name, value: name })), model);
				}
			},
		});
		$manufacturers.set_items(Object.keys(printer_models).map((name) => ({ label: name, value: name })), manufacturer);
		$models.set_items(printer_models[manufacturer].map((name) => ({ label: name, value: name })), model);

		const steps = [
			() => [$("<p>").text("This wizard will help you to install your printer quickly and easily."), $("<p>").text("To begin installing your printer, click Next.")],
			() => [
				$("<p>").text("How is this printer attached to your computer?"),
				$("<p>").text("If it is directly attached to your computer, click Local Printer. If it is attached to another computer, click Network Printer."),
				...["local", "network"].map((value) => $("<label class='radio-field'>").append(
					$("<input type='radio' name='printer-attachment'>").prop("checked", attachment === value).on("change", () => attachment = value),
					$("<span>").text(value === "local" ? "Local printer" : "Network printer"),
				)),
			],
			() => attachment === "local" ? [
				$("<p>").text("Click the manufacturer and model of your printer. If your printer came with an installation disk, click Have Disk."),
				$("<div class='printer-lists'>").append(
					$("<div>").append($("<div class='field-label'>").text("Manufacturers:"), $manufacturers),
					$("<div>").append($("<div class='field-label'>").text("Printers:"), $models),
				),
			] : [
				$("<p>").text("Type the network path or the queue name of your printer."),
				$("<label class='field-label'>").append($("<span>").text("Network path or queue name:"), $("<input type='text'>").val(network_path).on("input", (event) => network_path = event.target.value)),
			],
		];

		const $page = $("<div class='wizard-page'>");
		const $back = $("<button>").text("< Back").on("click", () => show(step - 1));
		const $next = $("<button class='default'>").on("click", () => step < steps.length - 1 ? show(step + 1) : finish());
		function show(new_step) {
			step = new_step;
			// (detached, not emptied, so that the lists keep their event handlers)
			$page.children().detach();
			$page.append(steps[step]());
			$back.prop("disabled", step === 0);
			$next.text(step === steps.length - 1 ? "Finish" : "Next >");
		}
		function finish() {
			$w.close();
			if (attachment === "network") {
				show_message_box({ iconID: "error", title: "Add Printer Wizard", message: `Could not connect to the printer ${network_path}.\n[Cause: 511 Network Authentication Required]` });
				return;
			}
			copy_printer_files(`${manufacturer.slice(0, 2).toUpperCase()}PCL5MS.DRV`, () => {
				show_message_box({ iconID: "error", title: "Add Printer Wizard", message: `Windows could not install the printer '${model}'.\n\nPC LOAD LETTER` });
			});
		}
		$w.$content.addClass("wizard").append(
			$("<div class='wizard-body'>").append(
				$("<div class='wizard-picture inset-deep'>").append($("<img width='96' height='96' draggable='false'>").attr("src", getIconPath("printer", 48))),
				$page,
			),
			$("<hr class='separator'>"),
			$("<div class='dialog-buttons'>").append($back, $next, $("<button>").text("Cancel").on("click", () => $w.close())),
		);
		show(0);
		return $w;
	});
}
