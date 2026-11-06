// The parts of ZenFS the site uses, bundled into lib/zenfs.js by pull-libs.js
// and exposed to the site's (classic, non-module) scripts as the global `ZenFS`.
export { attachFS, configure, fs, mounts, CopyOnWrite, Fetch, Journal, Port } from "@zenfs/core";
export { IndexedDB } from "@zenfs/dom";
// ZenFS's errors (only its own kind keep their code, "ENOENT" and so on, on the way to the programs' windows)
export { withErrno } from "kerium";
