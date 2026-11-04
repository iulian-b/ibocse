// The color schemes of the Appearance tab of Display Properties (src/control-panel.js): those of Windows 95,
// as ReactOS has them in its default registry (boot/bootdata/hivedef.inf, "Control Panel\Appearance\New Schemes").
// Each is its system colors, in the order of system_color_names (Windows' own order, as in the registry),
// named as in the [Control Panel\Colors] section of .theme files, which is what os-gui's parseThemeFileString reads.
// "Windows Standard" is the one the stylesheets have to begin with (lib/os-gui/windows-98.css, as lib/os-gui/windows-default.css),
// with Windows' MenuHilight and MenuBar, which os-gui doesn't use.

const system_color_names = [
	"Scrollbar",
	"Background",
	"ActiveTitle",
	"InactiveTitle",
	"Menu",
	"Window",
	"WindowFrame",
	"MenuText",
	"WindowText",
	"TitleText",
	"ActiveBorder",
	"InactiveBorder",
	"AppWorkspace",
	"Hilight",
	"HilightText",
	"ButtonFace",
	"ButtonShadow",
	"GrayText",
	"ButtonText",
	"InactiveTitleText",
	"ButtonHilight",
	"ButtonDkShadow",
	"ButtonLight",
	"InfoText",
	"InfoWindow",
	"ButtonAlternateFace",
	"HotTrackingColor",
	"GradientActiveTitle",
	"GradientInactiveTitle",
	"MenuHilight",
	"MenuBar",
];

const color_schemes = {
	"Brick": "#e1e0d2 #420000 #800000 #8d8961 #c2bfa5 #ffffff #000000 #000000 #000000 #e1e0d2 #c2bfa5 #c2bfa5 #e1e0d2 #8d8961 #ffffff #c2bfa5 #8d8961 #8d8961 #000000 #e1e0d2 #e1e0d2 #000000 #c2bfa5 #800000 #e1e0d2 #c0c0c0 #800000 #b07440 #c8b870 #008080 #c2bfa5",
	"Eggplant": "#90b0a8 #400040 #588078 #90b0a8 #90b0a8 #ffffff #000000 #000000 #000000 #ffffff #90b0a8 #90b0a8 #808080 #588078 #ffffff #90b0a8 #588078 #588078 #000000 #588078 #c8d8d8 #000000 #90b0a8 #800080 #ffffff #c0c0c0 #588078 #834b83 #cbbdd2 #588078 #90b0a8",
	"High Contrast Black": "#000000 #000000 #800080 #008000 #000000 #000000 #ffffff #ffffff #ffffff #ffffff #ffff00 #008000 #000000 #800080 #ffffff #000000 #808080 #00ff00 #ffffff #ffffff #c0c0c0 #ffffff #ffffff #ffffff #000000 #c0c0c0 #800080 #800080 #008000 #800080 #000000",
	"High Contrast White": "#ffffff #ffffff #000000 #ffffff #ffffff #ffffff #000000 #000000 #000000 #ffffff #808080 #c0c0c0 #808080 #000000 #ffffff #ffffff #808080 #00ff00 #000000 #000000 #c0c0c0 #000000 #c0c0c0 #000000 #ffffff #c0c0c0 #000000 #000000 #ffffff #000000 #ffffff",
	"Lilac": "#aea8d9 #000000 #5a4eb1 #808080 #aea8d9 #ffffff #000000 #000000 #000000 #ffffff #aea8d9 #aea8d9 #5a4eb1 #5a4eb1 #ffffff #aea8d9 #5a4eb1 #5a4eb1 #000000 #ffffff #d8d5ec #000000 #aea8d9 #000000 #ffffff #c0c0c0 #5a4eb1 #b68fcb #b8b4d0 #5a4eb1 #aea8d9",
	"Maple": "#f2ecd7 #000000 #800000 #c6a646 #e6d8ae #ffffff #000000 #000000 #000000 #ffffff #e6d8ae #e6d8ae #c6a646 #c6a646 #000000 #e6d8ae #c6a646 #c6a646 #000000 #f2ecd7 #f2ecd7 #000000 #e6d8ae #000000 #ffffff #c0c0c0 #c6a646 #c09c38 #e0c888 #c6a646 #e6d8ae",
	"Marine": "#c8e0d8 #2c4e47 #000080 #489088 #88c0b8 #c8e0d8 #000000 #000000 #000000 #ffffff #88c0b8 #88c0b8 #4b8d84 #000080 #ffffff #88c0b8 #489088 #489088 #000000 #c0c0c0 #c8e0d8 #000000 #88c0b8 #000000 #c8e0d8 #c0c0c0 #000080 #18b4c0 #78ccd8 #000080 #88c0b8",
	"Plum": "#d8d0c8 #402840 #484060 #786058 #a89890 #d8d0c8 #000000 #000000 #000000 #ffffff #a89890 #a89890 #74635a #008080 #d8d0c8 #a89890 #786058 #786058 #000000 #a89890 #d8d0c8 #000000 #a89890 #300058 #d5ccc8 #c0c0c0 #484060 #a084b8 #a89878 #008080 #a89890",
	"Pumpkin": "#f5eacf #420042 #d7a52f #a0a0a4 #ecd59d #ffffff #000000 #000000 #000000 #ffffff #ecd59d #ecd59d #f5eacf #800080 #ffffff #ecd59d #d7a52f #d7a52f #000000 #f5eacf #f5eacf #000000 #ecd59d #800080 #ffffff #c0c0c0 #d7a52f #e0cc88 #d0cc90 #800080 #ecd59d",
	"Rainy Day": "#c1ccd9 #000000 #4f657d #808080 #8399b1 #ffffff #000000 #000000 #000000 #ffffff #8399b1 #8399b1 #808080 #4f657d #ffffff #8399b1 #4f657d #4f657d #000000 #c1ccd9 #c1ccd9 #000000 #8399b1 #000000 #ffffff #c0c0c0 #4f657d #80b4d0 #b0bcd0 #4f657d #8399b1",
	"Red, White, and Blue": "#c0c0c0 #000042 #800000 #808080 #c0c0c0 #ffffff #000000 #000000 #000000 #ffffff #c0c0c0 #c0c0c0 #ffffff #800000 #ffffff #c0c0c0 #808080 #808080 #000000 #c0c0c0 #ffffff #000000 #c0c0c0 #000080 #ffffff #c0c0c0 #800000 #0010a8 #babec9 #800000 #c0c0c0",
	"Rose": "#cfafb7 #808080 #9f6070 #a0a0a4 #cfafb7 #ffffff #000000 #000000 #000000 #ffffff #cfafb7 #cfafb7 #9f6070 #9f6070 #ffffff #cfafb7 #9f6070 #9f6070 #000000 #7d7d7d #e7d8dc #000000 #cfafb7 #000000 #ffffff #c0c0c0 #9f6070 #d8ccd0 #d0d4d0 #9f6070 #cfafb7",
	"Slate": "#cedce3 #414141 #558097 #808080 #9db9c8 #ffffff #000000 #000000 #000000 #ffffff #9db9c8 #9db9c8 #424242 #558097 #ffffff #9db9c8 #558097 #558097 #000000 #c0c0c0 #cedce3 #000000 #9db9c8 #000000 #ffffff #c0c0c0 #558097 #88b8d8 #a0bcc8 #558097 #9db9c8",
	"Storm": "#c0c0c0 #000000 #800080 #808080 #c0c0c0 #ffffff #000000 #000000 #000000 #ffffff #c0c0c0 #c0c0c0 #808080 #800080 #ffffff #c0c0c0 #808080 #808080 #000000 #c0c0c0 #ffffff #000000 #c0c0c0 #800080 #ffffff #c0c0c0 #800080 #388cb0 #a8aca8 #800080 #c0c0c0",
	"Teal": "#c0c0c0 #004040 #008080 #808080 #c0c0c0 #ffffff #000000 #000000 #000000 #ffffff #c0c0c0 #c0c0c0 #808080 #008080 #ffffff #c0c0c0 #808080 #808080 #000000 #fffbf0 #ffffff #000000 #c0c0c0 #000000 #ffffff #c0c0c0 #008080 #00ccd8 #98c8b8 #008080 #c0c0c0",
	"Wheat": "#eeeed0 #00401d #808000 #bcbc41 #dedea0 #ffffff #000000 #000000 #000000 #ffffff #dedea0 #dedea0 #bcbc41 #808000 #ffffff #dedea0 #bcbc41 #bcbc41 #000000 #ffffff #eeeed0 #000000 #dedea0 #000000 #ffffff #c0c0c0 #808000 #c8b048 #b8b880 #808000 #dedea0",
	"Windows Standard": "#c0c0c0 #008080 #000080 #808080 #c0c0c0 #ffffff #000000 #000000 #000000 #ffffff #c0c0c0 #c0c0c0 #808080 #000080 #ffffff #c0c0c0 #808080 #808080 #000000 #c0c0c0 #ffffff #000000 #dfdfdf #000000 #ffffe1 #b4b4b4 #0000ff #1084d0 #b5b5b5 #000080 #c0c0c0",
	// The colors this site had before going back to Windows'
	"Sinclair Green": "#b0c0b0 #000000 #503840 #485048 #687868 #fffff0 #000000 #000000 #000000 #fffff0 #687868 #687868 #485048 #b87840 #ffffff #687868 #485048 #485048 #000000 #687868 #b0c0b0 #000000 #687868 #000000 #ced9ce #c0c0c0 #008080 #00ccd8 #98c8b8 #b87840 #687868",
};

// The color schemes only one of the operating systems has, as its own (src/operating-systems.js)
const own_color_schemes = ["Sinclair Green"];

// Whether the operating system running has a color scheme
function has_color_scheme(name) {
	return Object.hasOwn(color_schemes, name) && (!own_color_schemes.includes(name) || name === booted_os.color_scheme);
}

// The CSS properties for a color scheme, including the pictures that os-gui draws with its colors (as for a .theme file)
function color_scheme_css_properties(name) {
	const colors = color_schemes[name].split(" ").map((hex, index) => {
		const rgb = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
		return `${system_color_names[index]}=${rgb.join(" ")}`;
	});
	return parseThemeFileString(`[Control Panel\\Colors]\n${colors.join("\n")}\n`);
}
