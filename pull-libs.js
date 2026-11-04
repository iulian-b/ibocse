// TODO: maybe even update script tags in html, with CDN URLs, integrity checksums, and fallbacks

const { mkdirSync, readFileSync, writeFileSync } = require("fs");
const { basename, join } = require("path");

// Some packages (os-gui, webamp) are published with Windows line endings, but the repo stores LF (see .gitattributes).
// Files are compared and written with LF, and only written if they changed, so they come out the same on every OS
// (CI's check that they're up to date runs on Linux; on Windows, git checks them out with CRLF).
const read_text = (file) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const write_text_if_changed = (file, text) => {
	let current = null;
	try {
		current = read_text(file);
	} catch (error) {
		// not there yet
	}
	if (current !== text) {
		writeFileSync(file, text);
	}
};

const copy = (from, toDir) => {
	const to = join(toDir, basename(from));
	console.log(`Copying ${from} => ${to}`);
	mkdirSync(toDir, { recursive: true });
	write_text_if_changed(to, read_text(from));
};

// These vendored files carry local changes, so they are NOT copied over here;
// diff against node_modules and re-apply the changes by hand when updating them:
// - lib/os-gui/$Window.js: titlebar icon margin, null check, draggable="false" for jQuery 4,
//   no error when a window is closed before its iframe finishes loading,
//   sandboxed iframes treated as cross-origin for focus integration
// (The site's old green color scheme, which used to be in windows-98.css, is "Sinclair Green" in src/color-schemes.js,
// the network operating system's: src/operating-systems.js.)
copy("node_modules/os-gui/build/layout.css", "lib/os-gui/");
copy("node_modules/os-gui/build/layout.css.map", "lib/os-gui/");
copy("node_modules/os-gui/build/windows-98.css", "lib/os-gui/");
copy("node_modules/os-gui/build/windows-98.css.map", "lib/os-gui/");
copy("node_modules/os-gui/build/windows-default.css", "lib/os-gui/");
copy("node_modules/os-gui/build/windows-default.css.map", "lib/os-gui/");
copy("node_modules/os-gui/build/peggys-pastels.css", "lib/os-gui/");
copy("node_modules/os-gui/build/peggys-pastels.css.map", "lib/os-gui/");
copy("node_modules/os-gui/parse-theme.js", "lib/os-gui/");
copy("node_modules/os-gui/$MenuBar.js", "lib/os-gui/");
copy("node_modules/os-gui/MenuBar.js", "lib/os-gui/");
copy("node_modules/jquery/dist/jquery.min.js", "lib/");
copy("node_modules/jquery-ui/dist/jquery-ui.js", "programs/sound-recorder/lib/");
copy("node_modules/file-saver/dist/FileSaver.js", "programs/notepad/lib/");
copy("node_modules/markdown-it/dist/browser/markdown-it.umd.min.js", "programs/mdview/lib/");
// copy("node_modules/webamp/built/webamp.bundle.js", "programs/winamp/lib/");
// copy("node_modules/webamp/built/webamp.bundle.min.js", "programs/winamp/lib/");
// copy("node_modules/webamp/built/webamp.bundle.min.js.map", "programs/winamp/lib/");
copy("node_modules/butterchurn/lib/butterchurn.min.js", "programs/winamp/lib/");
copy("node_modules/butterchurn-presets/lib/butterchurnPresets.min.js", "programs/winamp/lib/");

const copy_and_monkey_patch_webamp = (file_name) => {
	const from = `node_modules/webamp/built/${file_name}`;
	const to = `programs/winamp/lib/${file_name}`;
	console.log(`Monkey patching and copying ${from} => ${to}`);
	let js = read_text(from);
	js = js.replace(/((\w|\.)+)\.render\(\)/g, "(monkey_patch_render($1))");
	js = js.replace("//# sourceMappingURL=webamp.bundle.min.js.map", ""); // lastIndexOf + slice would be way more efficient but WHERE WE'RE GOING, WE DON'T NEED SPEED
	write_text_if_changed(to, js);
};
copy_and_monkey_patch_webamp("webamp.bundle.js");
copy_and_monkey_patch_webamp("webamp.bundle.min.js");

// ZenFS only comes as ES modules, so the parts the site uses (scripts/zenfs.js) are bundled
// into one classic script that defines the global `ZenFS`
const bundle_zenfs = async () => {
	console.log("Bundling @zenfs/core and @zenfs/dom => lib/zenfs.js");
	const { build } = await import("vite");
	await build({
		configFile: false,
		logLevel: "warn",
		root: __dirname,
		build: {
			lib: { entry: join(__dirname, "scripts/zenfs.js"), name: "ZenFS", formats: ["iife"], fileName: () => "zenfs.js" },
			outDir: join(__dirname, "lib"),
			emptyOutDir: false,
			copyPublicDir: false,
			target: "es2022",
			// keep the libraries' license comments (ZenFS is LGPL-3.0-or-later)
			rolldownOptions: { output: { comments: { legal: true } } },
		},
	});
};

bundle_zenfs().then(() => console.log(`Done.

Note: This script doesn't handle updating npm dependencies, it just copies scripts into the repo.`));
