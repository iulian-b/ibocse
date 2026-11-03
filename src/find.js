// Find, in the Start menu: Files or Folders, which searches the drive (its index: nothing is downloaded),
// Computer, which searches the network (the Network folder), and On the Internet, which is Internet Explorer.

// What's typed in "Named:", as a test of names, as in Windows: it's found anywhere in a name,
// unless it has wildcards (* and ?), which have to match the whole name. Several can be given, separated by ; or ,
function make_name_test(named, case_sensitive) {
	const tests = named.split(/[;,]/).map((pattern) => pattern.trim()).filter(Boolean).map((pattern) => {
		if (pattern === "*.*") {
			return /^/; // (everything, even names without a dot)
		}
		const source = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
		return new RegExp(/[*?]/.test(pattern) ? `^${source}$` : source, case_sensitive ? "" : "i");
	});
	return (name) => tests.length === 0 || tests.some((test) => test.test(name));
}

function fs_call(method, ...args) {
	return new Promise((resolve, reject) => {
		withFilesystem(() => {
			ZenFS.fs[method](...args, (error, result) => error ? reject(error) : resolve(result));
		});
	});
}

// Calls back with every file and folder in a folder (and in the folders in it), as they're found
async function walk_drive(folder_path, include_subfolders, on_entry, is_stopped) {
	let names;
	try {
		names = await fs_call("readdir", folder_path);
	} catch (error) {
		return; // (deleted meanwhile)
	}
	for (const name of names.sort((a, b) => a.localeCompare(b))) {
		if (is_stopped()) {
			return;
		}
		const path = (folder_path === "/" ? "" : folder_path) + "/" + name;
		let stats;
		try {
			stats = await fs_call("stat", path);
		} catch (error) {
			continue;
		}
		on_entry({ path, name, folder_path, stats });
		if (include_subfolders && stats.isDirectory()) {
			await walk_drive(path, true, on_entry, is_stopped);
		}
	}
}

// "/My Documents" => "C:\My Documents"
function drive_path_to_dos_path(drive_path) {
	return "C:" + (drive_path === "/" ? "\\" : drive_path.replace(/\//g, "\\"));
}

// As Windows 95 showed them: "7/11/95 9:50 AM"
function format_short_date(ms) {
	const date = new Date(ms);
	const hours = date.getHours() % 12 || 12;
	return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)} ${hours}:${String(date.getMinutes()).padStart(2, "0")} ${date.getHours() < 12 ? "AM" : "PM"}`;
}

// A Find window: its criteria (in tabs), Find Now, Stop and New Search, and the results, shown once there's a search.
// Columns are { label, width, text(result), sort(result)? }, the first one with the result's icon.
// search(add_result, is_stopped) finds results; open(result) opens one.
function make_find_window({ title, iconID, tabs, columns, describe_search, count_text, search, new_search, open, open_containing_folder, options_menu }) {
	const $w = make_dialog_window(title, iconID, { resizable: true });
	$w.addClass("find-window");
	let results = [];
	let selected_index = -1;
	let stop_search = null;
	let sort_by = null; // { column, descending }

	const $find_now = $("<button class='default'>").text("Find Now");
	const $stop = $("<button>").text("Stop").prop("disabled", true);
	const $new_search = $("<button>").text("New Search");
	const $animation = $("<div class='find-animation'>").append($("<img width='32' height='32' draggable='false'>").attr("src", getIconPath(iconID, 32)));
	const $results = $("<div class='find-results inset-deep' role='grid' tabindex='0'>").css("--find-columns", columns.map((column) => `${column.width}px`).join(" ")).hide();
	const $header = $("<div class='find-results-header' role='row'>").appendTo($results);
	const $rows = $("<div class='find-results-rows' role='rowgroup'>").appendTo($results);
	const $status = $("<div class='status-bar inset-shallow'>").hide();

	for (const column of columns) {
		$("<button role='columnheader' tabindex='-1'>").text(column.label).appendTo($header).on("click", () => {
			sort_by = { column, descending: sort_by?.column === column && !sort_by.descending };
			const sort_value = column.sort ?? column.text;
			results.sort((a, b) => {
				const [x, y] = [sort_value(a), sort_value(b)];
				return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * (sort_by.descending ? -1 : 1);
			});
			selected_index = -1;
			$rows.empty().append(results.map(make_row));
		});
	}

	function make_row(result) {
		const $row = $("<div class='find-result' role='row'>");
		for (const [index, column] of columns.entries()) {
			const $cell = $("<div role='gridcell'>").appendTo($row);
			if (index === 0) {
				$cell.append($("<img width='16' height='16' draggable='false'>").attr("src", getIconPath(result.iconID, 16)));
			}
			$cell.append($("<span>").text(column.text(result)));
		}
		$row.on("pointerdown", () => select(results.indexOf(result)));
		$row.on("dblclick", () => open_selected());
		return $row;
	}
	function select(index) {
		selected_index = index;
		$rows.children().each((i, row) => {
			row.classList.toggle("selected", i === index);
			row.setAttribute("aria-selected", i === index);
		});
		if (index !== -1) {
			$rows.children()[index].scrollIntoView({ block: "nearest" });
		}
	}
	// (a frame later, after the window gets the focus back from the click, see keep_in_front)
	function open_selected() {
		const result = results[selected_index];
		if (result) {
			requestAnimationFrame(() => open(result));
		}
	}
	$results.on("keydown", (event) => {
		const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
		if (step && results.length) {
			select(Math.min(results.length - 1, Math.max(0, selected_index + step)));
			event.preventDefault();
		} else if (event.key === "Enter") {
			open_selected();
		}
	});

	function show_count() {
		$status.text(count_text(results.length));
	}
	let current_search = 0;
	async function find_now() {
		stop_search?.();
		const search_number = ++current_search;
		let stopped = false;
		stop_search = () => {
			stopped = true;
		};
		results = [];
		selected_index = -1;
		sort_by = null;
		$rows.empty();
		if ($results.is(":hidden")) {
			// (the window grows to show the results, as in Windows)
			$results.show();
			$status.show();
			$w.setDimensions({ innerHeight: Math.max($w.$content.outerHeight(), 380) });
			$w.applyBounds?.();
		}
		$w.title(describe_search());
		$status.text("Searching...");
		// (before Find Now is disabled, which would leave nothing focused)
		$results.trigger("focus");
		$find_now.prop("disabled", true);
		$stop.prop("disabled", false);
		$animation.addClass("searching");
		await search((result) => {
			if (!stopped) {
				results.push(result);
				$rows.append(make_row(result));
			}
		}, () => stopped);
		// (unless another search has taken its place)
		if (search_number === current_search) {
			stop_search = null;
			$find_now.prop("disabled", false);
			$stop.prop("disabled", true);
			$animation.removeClass("searching");
			show_count();
		}
	}
	$find_now.on("click", find_now);
	$stop.on("click", () => stop_search?.());
	$new_search.on("click", () => {
		stop_search?.();
		new_search();
		results = [];
		selected_index = -1;
		$rows.empty();
		$w.title(title);
		show_count();
	});
	// Enter in the criteria is Find Now
	const $tabs = $Tabs(tabs).on("keydown", "input", (event) => {
		if (event.key === "Enter" && !$find_now.prop("disabled")) {
			event.preventDefault();
			find_now();
		}
	});

	$w.setMenuBar(new MenuBar({
		"&File": [
			{
				label: "&Open",
				enabled: () => selected_index !== -1,
				action: open_selected,
				description: "Opens the selected item.",
			},
			...(open_containing_folder ? [{
				label: "Open &Containing Folder",
				enabled: () => selected_index !== -1,
				action: () => open_containing_folder(results[selected_index]),
				description: "Opens the folder that contains the selected item.",
			}] : []),
			MENU_DIVIDER,
			{
				label: "&Close",
				action: () => $w.close(),
				description: "Closes the window.",
			},
		],
		...(options_menu ? { "&Options": options_menu } : {}),
	}));
	$w.$content.addClass("find").append(
		$("<div class='find-form'>").append(
			$tabs,
			$("<div class='find-buttons'>").append($find_now, $stop, $new_search, $animation),
		),
		$results,
		$status,
	);
	$w.onClosed(() => stop_search?.());
	$w.setDimensions({ innerWidth: 570 });
	return $w;
}

// Find: All Files

const find_look_in_folders = [
	["(C:)", "/"],
	["Desktop", "/Desktop"],
	["My Documents", "/My Documents"],
	["My Music", "/My Music"],
	["My Pictures", "/My Pictures"],
	["Program Files", "/Program Files"],
	["Windows", "/Windows"],
];

const find_file_types = [
	{ label: "All Files and Folders" },
	{ label: "Folder", folders: true },
	{ label: "Application", extensions: ["exe", "com", "scr"] },
	{ label: "Text Document", extensions: ["txt", "log", "md"] },
	{ label: "PDF Document", extensions: ["pdf"] },
	{ label: "Picture", extensions: ["bmp", "gif", "jpg", "jpeg", "png", "webp"] },
	{ label: "Sound", extensions: ["wav", "mid", "mp3", "ogg"] },
	{ label: "Help File", extensions: ["hlp", "cnt", "chm"] },
	{ label: "System File", extensions: ["dll", "sys", "vxd", "pdr", "inf", "ini"] },
	{ label: "Font", extensions: ["ttf", "fon"] },
	{ label: "Shortcut", extensions: ["lnk"] },
];

function FindFiles() {
	return open_dialog_window("find-files", () => {
		let case_sensitive = false;

		// Name & Location
		const $named = $("<input type='text'>");
		const $look_in = $("<select>").append(find_look_in_folders.map(([label, path]) => $("<option>").val(path).text(label)));
		const $subfolders = $Checkbox("Include subfolders", true, () => {});
		const $name_and_location = $("<div class='find-fields'>").append(
			$("<label class='field-label'>").append($("<span>").text("Named:"), $named),
			$("<label class='field-label'>").append($("<span>").text("Look in:"), $look_in),
			$subfolders,
		);

		// Date Modified
		const $date_any = $("<input type='radio' name='find-date'>").prop("checked", true);
		const $date_some = $("<input type='radio' name='find-date'>");
		const $date_between = $("<input type='radio' name='find-date-range'>").prop("checked", true);
		const $date_months = $("<input type='radio' name='find-date-range'>");
		const $date_days = $("<input type='radio' name='find-date-range'>");
		const $from = $("<input type='date'>");
		const $to = $("<input type='date'>");
		const $months = $("<input type='number' min='1' value='1'>");
		const $days = $("<input type='number' min='1' value='1'>");
		const $date_modified = $("<div class='find-fields find-dates'>").append(
			$("<label class='radio-field'>").append($date_any, $("<span>").text("All files")),
			$("<label class='radio-field'>").append($date_some, $("<span>").text("Find all files created or modified:")),
			$("<div class='find-date-ranges'>").append(
				$("<label class='radio-field'>").append($date_between, $("<span>").text("between"), $from, $("<span>").text("and"), $to),
				$("<label class='radio-field'>").append($date_months, $("<span>").text("during the previous"), $months, $("<span>").text("month(s)")),
				$("<label class='radio-field'>").append($date_days, $("<span>").text("during the previous"), $days, $("<span>").text("day(s)")),
			),
		);
		// (choosing a range chooses to find by date)
		$date_modified.find(".find-date-ranges").on("input change pointerdown", () => $date_some.prop("checked", true));

		// Advanced
		const $type = $("<select>").append(find_file_types.map((type, index) => $("<option>").val(index).text(type.label)));
		const $size_is = $("<select>").append(["", "At least", "At most"].map((label) => $("<option>").val(label).text(label)));
		const $size = $("<input type='number' min='0' value='0'>");
		const $advanced = $("<div class='find-fields'>").append(
			$("<label class='field-label'>").append($("<span>").text("Of type:"), $type),
			$("<label class='field-label find-size'>").append($("<span>").text("Size is:"), $size_is, $size, $("<span>").text("KB")),
		);

		const date_test = () => {
			if (!$date_some.prop("checked")) {
				return () => true;
			}
			if ($date_between.prop("checked")) {
				const from = $from.val() ? new Date(`${$from.val()}T00:00`).getTime() : -Infinity;
				const to = $to.val() ? new Date(`${$to.val()}T23:59:59.999`).getTime() : Infinity;
				return (ms) => ms >= from && ms <= to;
			}
			const since = new Date();
			if ($date_months.prop("checked")) {
				since.setMonth(since.getMonth() - Number($months.val() || 1));
			} else {
				since.setDate(since.getDate() - Number($days.val() || 1));
			}
			return (ms) => ms >= since.getTime();
		};

		const $w = make_find_window({
			title: "Find: All Files",
			iconID: "find-file",
			tabs: [
				{ label: "Name & Location", $panel: $name_and_location },
				{ label: "Date Modified", $panel: $date_modified },
				{ label: "Advanced", $panel: $advanced },
			],
			columns: [
				{ label: "Name", width: 160, text: (result) => result.name },
				{ label: "In Folder", width: 140, text: (result) => drive_path_to_dos_path(result.folder_path) },
				{ label: "Size", width: 56, text: (result) => result.is_directory ? "" : `${Math.ceil(result.size / 1024).toLocaleString("en-US")}KB`, sort: (result) => result.is_directory ? -1 : result.size },
				{ label: "Type", width: 76, text: (result) => result.is_directory ? "Folder" : (result.extension ? `${result.extension.toUpperCase()} File` : "File") },
				{ label: "Modified", width: 110, text: (result) => format_short_date(result.mtime), sort: (result) => result.mtime },
			],
			describe_search: () => $named.val().trim() ? `Find: Files named ${$named.val().trim()}` : "Find: All Files",
			count_text: (count) => `${count} file(s) found`,
			search: async (add_result, is_stopped) => {
				const name_test = make_name_test($named.val(), case_sensitive);
				const modified_test = date_test();
				const type = find_file_types[$type.val()];
				const size_limit = Number($size.val() || 0) * 1024;
				await walk_drive($look_in.val(), $subfolders.find("input").prop("checked"), ({ path, name, folder_path, stats }) => {
					const is_directory = stats.isDirectory();
					const extension = is_directory ? "" : file_extension_from_path(name).toLowerCase();
					if (
						!name_test(name) ||
						!modified_test(stats.mtimeMs) ||
						(type.folders && !is_directory) ||
						(type.extensions && (is_directory || !type.extensions.includes(extension))) ||
						($size_is.val() && is_directory) ||
						($size_is.val() === "At least" && stats.size < size_limit) ||
						($size_is.val() === "At most" && stats.size > size_limit)
					) {
						return;
					}
					add_result({ path, name, folder_path, is_directory, extension, size: stats.size, mtime: stats.mtimeMs, iconID: icon_id_for_file(path, is_directory) });
				}, is_stopped);
			},
			new_search: () => {
				$named.val("");
				$look_in.val("/");
				$subfolders.find("input").prop("checked", true);
				$date_any.prop("checked", true);
				$type.val(0);
				$size_is.val("");
				$size.val(0);
				$named.trigger("focus");
			},
			// (Windows' own files say access is denied, see is_locked_file)
			open: (result) => systemExecuteFile(result.path),
			open_containing_folder: (result) => Explorer(result.folder_path),
			options_menu: [
				{
					label: "Case &Sensitive",
					checkbox: {
						check: () => case_sensitive,
						toggle: () => {
							case_sensitive = !case_sensitive;
						},
					},
					description: "Finds only names that match the capitalization of what's typed in Named.",
				},
			],
		});
		requestAnimationFrame(() => $named.trigger("focus"));
		return $w;
	});
}

// Find: Computer, on the network: the computers in the Network folder

function FindComputer() {
	return open_dialog_window("find-computer", () => {
		const $named = $("<input type='text'>");
		const $w = make_find_window({
			title: "Find: Computer",
			iconID: "find-computer",
			tabs: [
				{ label: "Computer Name", $panel: $("<div class='find-fields'>").append($("<label class='field-label'>").append($("<span>").text("Named:"), $named)) },
			],
			columns: [
				{ label: "Name", width: 150, text: (result) => result.name },
				{ label: "Location", width: 130, text: () => "Entire Network" },
				{ label: "Comment", width: 200, text: () => "" },
			],
			describe_search: () => $named.val().trim() ? `Find: Computers named ${$named.val().trim()}` : "Find: Computer",
			count_text: (count) => `${count} computer(s) found`,
			search: async (add_result, is_stopped) => {
				const name_test = make_name_test($named.val(), false);
				// (it takes the network a moment to answer)
				await new Promise((resolve) => setTimeout(resolve, 1200));
				if (is_stopped()) {
					return;
				}
				await walk_drive("/Network", false, ({ path, name, stats }) => {
					if (!stats.isDirectory() && name_test(name)) {
						add_result({ path, name, iconID: "network" });
					}
				}, is_stopped);
			},
			new_search: () => {
				$named.val("");
				$named.trigger("focus");
			},
			// (what's on the network asks to log in, or can't be reached)
			open: (result) => systemExecuteFile(result.path),
		});
		requestAnimationFrame(() => $named.trigger("focus"));
		return $w;
	});
}

// F3 on the desktop is Find, as in Windows
$(window).on("keydown", (event) => {
	if (event.key === "F3" && !event.ctrlKey && !event.altKey && !event.metaKey && !$(event.target).closest(".os-window, iframe").length) {
		event.preventDefault();
		FindFiles();
	}
});
