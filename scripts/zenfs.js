// The parts of ZenFS the site uses, bundled into lib/zenfs.js by pull-libs.js
// and exposed to the site's (classic, non-module) scripts as the global `ZenFS`.
export { attachFS, configure, fs, mounts, CopyOnWrite, Fetch, Journal, Port } from "@zenfs/core";
export { IndexedDB } from "@zenfs/dom";
