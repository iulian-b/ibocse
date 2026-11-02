// Builds the deployable site into dist/: the files in git (plus new files that aren't ignored),
// minus development-only files, plus a generated filesystem-index.json.
// The site is plain static files, so nothing is bundled; dist/ can be served by any static host.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { make_filesystem_index } = require("./filesystem-index.js");

const root = path.resolve(__dirname, "..");
const out_dir = path.join(root, "dist");

// Development-only files, not part of the site
const excluded = [
	/^\.(github|idea|vscode)\//,
	/^\.git(attributes|ignore|modules)$/,
	/^(scripts|tests)\//,
	/^(package(-lock)?\.json|playwright\.config\.ts|vite\.config\.mjs|cspell\.json|pull-libs\.js|extract-icons\.sh|README\.md)$/,
	/^filesystem-index\.json/, // generated below
	/\.map$/,
];

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
	.split("\0")
	.filter((file) => file && !excluded.some((pattern) => pattern.test(file)))
	// skips files deleted from the working tree and submodule links
	.filter((file) => fs.statSync(path.join(root, file), { throwIfNoEntry: false })?.isFile());

fs.rmSync(out_dir, { recursive: true, force: true });
let bytes = 0;
for (const file of new Set(files)) {
	const destination = path.join(out_dir, file);
	fs.mkdirSync(path.dirname(destination), { recursive: true });
	fs.copyFileSync(path.join(root, file), destination);
	// keep the modified date, which the desktop shows for the files on its drive
	const stats = fs.statSync(path.join(root, file));
	fs.utimesSync(destination, stats.atime, stats.mtime);
	bytes += stats.size;
}
fs.writeFileSync(path.join(out_dir, "filesystem-index.json"), JSON.stringify(make_filesystem_index(out_dir)));

console.log(`Built ${files.length} files (${(bytes / 1024 / 1024).toFixed(1)} MB) into ${path.relative(root, out_dir)}/`);
