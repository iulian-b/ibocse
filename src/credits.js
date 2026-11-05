// About's Credits (src/$start-menu.js): the projects this site is made from, and its games, and who made them, as Windows Setup
// lists its components. Double-clicking one opens its page.
// The icons are their own, from their repositories, where they have one; otherwise Windows 98's nearest.
const component_credits = [
	{ name: "98.js", developer: "Isaiah Odhner", url: "https://github.com/1j01/98", iconID: "98js" },
	{ name: "OS-GUI.js", developer: "Isaiah Odhner", url: "https://github.com/1j01/os-gui", iconID: "os-gui" },
	{ name: "JS Paint", developer: "Isaiah Odhner", url: "https://github.com/1j01/jspaint", iconID: "paint" },
	{ name: "3D Pipes", developer: "Isaiah Odhner", url: "https://github.com/1j01/pipes", iconID: "pipes" },
	{ name: "Webamp", developer: "Jordan Eldredge", url: "https://github.com/captbaritone/webamp", iconID: "winamp2" },
	{ name: "Butterchurn", developer: "Jordan Berg", url: "https://github.com/jberg/butterchurn", iconID: "media-player" },
	{ name: "Windows Calculator", developer: "Microsoft", url: "https://github.com/microsoft/calculator", iconID: "calculator" },
	{ name: "mcalculator", developer: "muzamil", url: "https://github.com/muzam1l/mcalculator", iconID: "mcalculator" },
	{ name: "Minesweeper", developer: "Jon Ziebell", url: "https://github.com/ziebelje/minesweeper", iconID: "minesweeper" },
	{ name: "JavaScript Solitaire", developer: "Radovan Janjic", url: "https://github.com/rjanjic/js-solitaire", iconID: "solitaire" },
	{ name: "3D FlowerBox", developer: "Kevin Shannon", url: "https://github.com/kevin-shannon/3D-FlowerBox", iconID: "pipes" },
	{ name: "Space Cadet Pinball", developer: "k4zmu2a, alula", url: "https://github.com/alula/SpaceCadetPinball", iconID: "pinball" },
	{ name: "js-dos", developer: "Alexander Guryanov", url: "https://github.com/caiiiycuk/js-dos", iconID: "msdos" },
	{ name: "ZenFS", developer: "James Prevett", url: "https://github.com/zen-fs/core", iconID: "hard-disk-drive" },
	{ name: "jQuery", developer: "OpenJS Foundation", url: "https://github.com/jquery/jquery", iconID: "jquery" },
	{ name: "jQuery UI", developer: "OpenJS Foundation", url: "https://github.com/jquery/jquery-ui", iconID: "jquery" },
	{ name: "three.js", developer: "mrdoob", url: "https://github.com/mrdoob/three.js", iconID: "threejs" },
	{ name: "markdown-it", developer: "Vitaly Puzrin", url: "https://github.com/markdown-it/markdown-it", iconID: "markdown-it" },
	{ name: "FileSaver.js", developer: "Eli Grey", url: "https://github.com/eligrey/FileSaver.js", iconID: "file-settings" },
	{ name: "Bootstrap", developer: "The Bootstrap Authors", url: "https://github.com/twbs/bootstrap", iconID: "bootstrap" },
	{ name: "BOOTSTRA.386", developer: "Chris McKenzie", url: "https://github.com/kristopolous/BOOTSTRA.386", iconID: "bootstra386" },
	{ name: "98.css", developer: "Jordan Scales", url: "https://github.com/jdan/98.css", iconID: "98css" },
	{ name: "MS Sans Serif", developer: "lou", url: "https://fontstruct.com/fontstructions/show/1384746/ms-sans-serif", iconID: "fonts-folder" },
	{ name: "Fixedsys Excelsior", developer: "Darien Valentine", url: "https://github.com/kika/fixedsys", iconID: "fonts-folder" },
	{ name: "Oldschool PC Font Pack", developer: "VileR", url: "https://int10h.org/oldschool-pc-fonts/", iconID: "fonts-folder" },
	{ name: "win98icons", developer: "Alex Meub", url: "https://win98icons.alexmeub.com/", iconID: "win98icons" },
	{ name: "React95", developer: "Gabriel Daltoso", url: "https://github.com/React95/React95", iconID: "react95" },
	{ name: "Vite", developer: "Evan You", url: "https://github.com/vitejs/vite", iconID: "vite" },
];

// The games are other people's web versions of them: each is credited to whoever made the game,
// and its page is the web version that's played here (the address src/programs.js opens).
const game_credits = [
	{ name: "Arx Fatalis", developer: "Arkane Studios", url: "https://rgc.zone/ports/arxweb/index.html", iconID: "arx-fatalis" },
	{ name: "Battle City", developer: "Namco", url: "https://battle-city.berrry.app/", iconID: "battle-city" },
	{ name: "Cave Story", developer: "Studio Pixel", url: "https://rgc.zone/ports/cavestory/index.html", iconID: "cave-story" },
	{ name: "Commander Keen", developer: "id Software", url: "https://www.jamesfmackenzie.com/chocolatekeen/", iconID: "keen" },
	{ name: "Counter-Strike 1.6", developer: "Valve", url: "https://csjs.live/play", iconID: "counter-strike" },
	{ name: "Cyberpunk 2077", developer: "CD Projekt Red", url: "https://cyberpunk2077.lol/", iconID: "cyberpunk" },
	{ name: "Diablo", developer: "Blizzard North", url: "https://d07riv.github.io/diabloweb/", iconID: "diablo1" },
	{ name: "Doom", developer: "id Software", url: "https://raz0red.github.io/webprboom/", iconID: "doom" },
	{ name: "Duke Nukem 3D", developer: "3D Realms", url: "https://rgc.zone/ports/duke3dtg/index.html", iconID: "duke3d" },
	{ name: "Grand Theft Auto: Vice City", developer: "Rockstar North", url: "https://gta.rabisco.net/", iconID: "gta-vc" },
	{ name: "Heroes of Might and Magic II", developer: "New World Computing", url: "https://midzer.de/wasm/heroes2/", iconID: "heroes2" },
	{ name: "Minecraft", developer: "Mojang", url: "https://rgc.zone/ports/eaglecarftg/launch.html?v=188js.html", iconID: "minecraft" },
	{ name: "Need for Speed: Most Wanted", developer: "EA Black Box", url: "https://web.nfsmwo.com/", iconID: "nfs-mw" },
	{ name: "Need for Speed: Underground 2", developer: "EA Black Box", url: "https://nfsu2.xyz/", iconID: "nfs-ug2" },
	{ name: "Prince of Persia", developer: "Jordan Mechner", url: "https://princejs.com/", iconID: "prince-of-persia" },
	{ name: "Quake III Arena", developer: "id Software", url: "https://q3.pieter.com/", iconID: "quake3" },
	{ name: "SkiFree", developer: "Chris Pirih", url: "https://basicallydan.github.io/skifree.js/", iconID: "skifree" },
	{ name: "Sonic the Hedgehog", developer: "Sonic Team", url: "https://vinmannie.github.io/Sonic-1-WASM/", iconID: "sonic" },
	{ name: "Super Mario 64", developer: "Nintendo (pls don't sue me)", url: "https://rgc.zone/ports/sm64-main/index.html", iconID: "super-mario-64" },
	{ name: "The Elder Scrolls II: Daggerfall", developer: "Bethesda Softworks", url: "https://daggerfalljs.dev/play/", iconID: "daggerfall" },
	{ name: "Tomb Raider", developer: "Core Design", url: "https://xproger.github.io/OpenLara/", iconID: "tomb-raider" },
	{ name: "Wipeout", developer: "Psygnosis", url: "https://phoboslab.org/wipegame/", iconID: "wipeout" },
	{ name: "Wolfenstein 3D", developer: "id Software", url: "https://git.nihilogic.dk/wolf3d", iconID: "wolf-3d" },
];

function Credits() {
	return open_dialog_window("credits", () => {
		const $w = make_dialog_window("Credits", booted_os.logo_icons);
		const visit = (credit) => open(credit.url, "_blank", "noopener");
		const $page = $("<span class='credits-page'>");
		const $visit = $("<button>").text("Visit Page");
		const $list = $ListBox({
			on_select: (credit) => {
				$page.text(credit ? `Page: ${credit.url.replace(/^https:\/\/|\/$/g, "")}` : "");
				$visit.prop("disabled", !credit);
			},
			on_activate: visit,
		});
		$visit.on("click", () => {
			const credit = $list.get_selected()?.value;
			if (credit) {
				visit(credit);
			}
		});
		const credits = [...component_credits, ...game_credits];
		$list.set_items(credits.map((credit) => ({ label: credit.name, value: credit, iconID: credit.iconID, detail: credit.developer })), credits[0]);
		$w.$content.addClass("property-sheet credits").append(
			$("<p>").text("Below are the components this site is made from, then the games it plays, beside who made them. Double-click one to visit its page (for a game, the web version played here)."),
			$("<div>").text("Components:"),
			$list,
			$("<div class='buttons-right'>").append($page, $visit),
			$DialogButtons([{ label: "OK", is_default: true, action: () => $w.close() }]),
		);
		return $w;
	});
}
