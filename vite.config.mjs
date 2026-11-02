import { createReadStream, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { defineConfig } from "vite";
import filesystem_index from "./scripts/filesystem-index.js";

const content_types = {
	".bmp": "image/bmp", ".css": "text/css", ".gif": "image/gif", ".htm": "text/html", ".html": "text/html",
	".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".js": "text/javascript", ".json": "application/json",
	".md": "text/markdown", ".mp3": "audio/mpeg", ".pdf": "application/pdf", ".png": "image/png",
	".svg": "image/svg+xml", ".txt": "text/plain", ".wav": "audio/wav", ".webp": "image/webp",
};

// The C: drive (the C/ folder) as it'll be on a static host:
// - filesystem-index.json is made fresh on every request, so files added to C/ show up on a reload, without a rebuild
// - files in C/ are sent as they are (Vite would otherwise rewrite .js, .css and .html files, which are just files on the drive)
const filesystem_plugin = {
	name: "filesystem",
	configureServer(server) {
		const drive_dir = resolve(server.config.root, filesystem_index.drive_folder);
		server.middlewares.use("/filesystem-index.json", (req, res) => {
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify(filesystem_index.make_filesystem_index(server.config.root)));
		});
		server.middlewares.use(`/${filesystem_index.drive_folder}/`, (req, res, next) => {
			let file;
			try {
				file = join(drive_dir, decodeURIComponent(new URL(req.url, "http://localhost").pathname));
			} catch {
				return next();
			}
			if (relative(drive_dir, file).startsWith("..") || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
				return next();
			}
			res.setHeader("Content-Type", content_types[extname(file).toLowerCase()] ?? "application/octet-stream");
			res.setHeader("Content-Length", statSync(file).size);
			createReadStream(file).pipe(res);
		});
	},
};

export default defineConfig({
	// A static multi-page site: missing files should 404 instead of falling back to index.html.
	appType: "mpa",
	plugins: [filesystem_plugin],
	server: {
		port: 1998,
		strictPort: true,
	},
	// `npm run preview` serves the output of `npm run build`
	build: {
		outDir: "dist",
	},
	preview: {
		port: 1998,
		strictPort: true,
	},
});
