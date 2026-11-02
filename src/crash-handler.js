function timeToPanic() {
    console.log("[USR] ibocse@crlab2-h032: digitalis.exe()");

    const kernelText = `<p id="kpanic" class="crt" style="color: whitesmoke; font-family: IBM3x;">
		[	1.089542] Kernel panic - not syncing: VFS: Unable to mount package digitalis on unkown-block(0,0)<br>
		[	1.090150] CPU: 0 PID: 1 Comm: swapper/0 Not tainted 3.10.8-327.el7x86_64 #<br>
		[	1.091479] Client Tunnel: ` + escapeHTML(navigator.userAgent) + `<br>
		[	1.092354] ffffffff8184e928 000000001e6559f5 ffff880139387d60 ffffffff816351f1<br>
		[	1.092846] ffff880139387de0 ffffffff8162ea6c ffffffff00000010 ffff880139387df0<br>
		[	1.099352] ffff880139387d90 000000001e6559f5 000000001e6559f5 ffff880139387e00<br>
		[	1.101371] Call Trace:<br>
		[	1.102354]  [<ffff69756c69616e>] digitalis+0xff/0xff<br>
		[	1.102483]  [<ffffffff81638c78>] run+0x3a/0x6c<br>
		[	1.103047]  [<ffffffff81638c78>] desktop+0x24/0x1f<br>
		[	1.103705]  [<ffffffff816351f1>] dump_stack+0x19/0x1b<br>
		[	1.104687]  [<ffffffff8162ea6c>] panic+0xd8/0x1e7<br>
		[	1.104952]  [<ffffffff81a8d5fa>] mount_block_root+0x2a1/0x2b0<br>
		[	1.105784]  [<ffffffff81a8d65c>] mount_root+0x53/0x56<br>
		[	1.106415]  [<ffffffff81a8d79b>] prepare_namespace+0x13c/0x174<br>
		[	1.106941]  [<ffffffff81a8d268>] kerne;_init_freeable+0x1f0/0x217<br>
		[	1.107124]  [<ffffffff81a8c9db>] ? initcall_blacklist+0xb0/0xb0<br>
		[	1.107715]  [<ffffffff81624e10>] ? rest_init+0x80/0x80<br>
		[	1.107856]  [<ffffffff81624e1e>] kernel_init+0xe/0xf0<br>
		[	1.107911]  [<ffffffff81645858>] ret_from_fork+0x58/0x90<br>
		[	1.108146]  [<ffffffff81624e10>] ? rest_init+0x80/0x80<br>
		<br>
		Bailing out, you are on your own. Good luck.
		</p>`;

    $desktop.css({backgroundImage: `url("../images/glitch.jpg")`});
    console.log("[USR] ibocse@crlab2-h032: Connection lost. Retrying...");

    sleep(1000).then(() => {
        document.documentElement.innerHTML = '<body style="background-color:black;" class="unselectable"></body>';
        document.body.insertAdjacentHTML('beforeend',`<link href="css/boot.css" rel="stylesheet" type="text/css">`);
        document.body.insertAdjacentHTML('beforeend',`<link href="css/crt.css" rel="stylesheet" type="text/css">`);
        document.body.insertAdjacentHTML('beforeend',kernelText);
    });
    console.log("[SYSTEM] Fatal system error!");
    console.log("[SYSTEM] Unable to recover system. Dumping stack trace:");
    console.log("\[<ffff69756c69616e>\] digitalis+0xff/0xff");
    console.log("\[<ffffffff81638c78>\] run+0x3a/0x6c");
    console.log("\[<ffffffff81638c78>\] desktop+0x24/0x1f");
    console.log("\[<ffffffff816351f1>\] dump_stack+0x19/0x1b");
    console.log("\[<ffffffff8162ea6c>\] panic+0xd8/0x1e7");
    console.log("\[<ffffffff81a8d5fa>\] mount_block_root+0x2a1/0x2b0");
    console.log("\[<ffffffff81a8d65c>\] mount_root+0x53/0x56");
    console.log("\[<ffffffff81a8d79b>\] prepare_namespace+0x13c/0x174");
    console.log("\[<ffffffff81a8d268>\] kerne;_init_freeable+0x1f0/0x217");
    console.log("\[<ffffffff81a8c9db>\] ? initcall_blacklist+0xb0/0xb0");
    console.log("\[<ffffffff81624e10>\] ? rest_init+0x80/0x80");
    console.log("\[<ffffffff81624e1e>\] kernel_init+0xe/0xf0");
    console.log("\[<ffffffff81645858>\] ret_from_fork+0x58/0x90");
    console.log("\[<ffffffff81624e10>\] ? rest_init+0x80/0x80");
}
