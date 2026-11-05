// Windows like Windows 95's dialog boxes and property sheets, and their controls,
// for Settings (src/control-panel.js) and Find (src/find.js). They look as in css/dialogs.css.

// A window clicked on gets the focus back a frame later (os-gui's $Window), which can be after a window that the click opened,
// if the click was quick (or a double click), putting it behind: so windows opened here come to the front after that.
function keep_in_front($w) {
	requestAnimationFrame(() => {
		if (!$w.closed) {
			$w.bringToFront();
			$w.focus();
		}
	});
	return $w;
}

function show_message_box(options) {
	const promise = showMessageBox(options);
	keep_in_front(promise.$window);
	return promise;
}

// Each of these windows is only open once: opening it again brings it back
var open_dialog_windows = {};

function open_dialog_window(key, make_window) {
	const $existing = open_dialog_windows[key];
	if ($existing) {
		$existing.unminimize();
		return keep_in_front($existing);
	}
	const $w = make_window();
	open_dialog_windows[key] = $w;
	$w.onClosed(() => {
		delete open_dialog_windows[key];
	});
	new Task($w);
	$w.center();
	return keep_in_front($w);
}

// Dialog boxes and property sheets can't be resized; folders (the Control Panel, Printers) and Find can
// (icon: an icon's ID, or its pictures at two sizes)
function make_dialog_window(title, icon, { resizable = false } = {}) {
	const $w = $Window({
		title,
		icons: typeof icon === "string" ? iconsAtTwoSizes(icon) : icon,
		resizable,
		maximizeButton: resizable,
		minimizeButton: resizable,
	});
	$w.addClass("dialog-window");
	return $w;
}

// (like Windows' own files, see is_locked_file)
function deny_access(title, message = `Cannot open '${title}'.`) {
	show_message_box({ iconID: "error", title, message: `${message}\nInsufficient permissions: access is denied.` });
}

function ask_yes_or_no(title, message) {
	return show_message_box({
		title,
		message,
		iconID: "warning",
		buttons: [
			{ label: "Yes", value: "yes", default: true },
			{ label: "No", value: "no" },
		],
	}).then((answer) => answer === "yes");
}

// A property sheet's tabs: [{ label, $panel }]
function $Tabs(tabs) {
	const $tabs = $("<div class='tabs'>");
	const $strip = $("<div class='tab-strip' role='tablist'>").appendTo($tabs);
	const select = (index) => {
		tabs.forEach(({ $tab, $panel }, i) => {
			$tab.toggleClass("selected", i === index).attr({ "aria-selected": i === index, tabindex: i === index ? 0 : -1 });
			$panel.prop("hidden", i !== index);
		});
	};
	for (const [index, tab] of tabs.entries()) {
		tab.$tab = $("<div class='tab' role='tab'>").text(tab.label).appendTo($strip).on("pointerdown", () => select(index));
		tab.$panel.addClass("tab-panel").attr("role", "tabpanel").appendTo($tabs);
	}
	$strip.on("keydown", (event) => {
		const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
		if (step) {
			const index = (tabs.findIndex(({ $tab }) => $tab.hasClass("selected")) + step + tabs.length) % tabs.length;
			select(index);
			tabs[index].$tab.focus();
			event.preventDefault();
		}
	});
	select(0);
	return $tabs;
}

// OK, Cancel, Apply...: [{ label, action, is_default }]
function $DialogButtons(buttons) {
	const $row = $("<div class='dialog-buttons'>");
	for (const { label, action, is_default } of buttons) {
		$("<button>").text(label).toggleClass("default", Boolean(is_default)).on("click", action).appendTo($row);
	}
	return $row;
}

function $Checkbox(label, checked, on_change) {
	const $input = $("<input type='checkbox'>").prop("checked", checked).on("change", () => on_change($input.prop("checked")));
	return $("<label class='checkbox-field'>").append($input, $("<span>").text(label));
}

// A list box: items are { label, value, iconID?, detail? } (detail: at the right, as Windows Setup's sizes); calls back when one is selected
function $ListBox({ on_select, on_activate } = {}) {
	const $list = $("<div class='list-box inset-deep' role='listbox' tabindex='0'>");
	let items = [];
	let selected_index = -1;
	const select = (index, { scroll = true } = {}) => {
		selected_index = index;
		$list.children().each((i, element) => {
			element.classList.toggle("selected", i === index);
			element.setAttribute("aria-selected", i === index);
		});
		if (scroll && index !== -1) {
			$list.children()[index].scrollIntoView({ block: "nearest" });
		}
		on_select?.(items[index]?.value, items[index]);
	};
	$list.set_items = (new_items, selected_value) => {
		items = new_items;
		$list.empty().append(items.map((item, index) => {
			const $item = $("<div class='list-item' role='option'>").on("pointerdown", () => select(index)).on("dblclick", () => on_activate?.(item.value, item));
			if (item.iconID) {
				$item.append($("<img width='16' height='16' draggable='false'>").attr("src", getIconPath(item.iconID, 16)));
			}
			$item.append($("<span>").text(item.label));
			if (item.detail) {
				$item.append($("<span class='list-item-detail'>").text(item.detail));
			}
			return $item;
		}));
		select(items.findIndex((item) => item.value === selected_value), { scroll: false });
	};
	$list.get_selected = () => items[selected_index];
	$list.on("keydown", (event) => {
		const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
		if (step && items.length) {
			select(Math.min(items.length - 1, Math.max(0, selected_index + step)));
			event.preventDefault();
		} else if (event.key === "Enter" && items[selected_index]) {
			on_activate?.(items[selected_index].value, items[selected_index]);
		}
	});
	return $list;
}
