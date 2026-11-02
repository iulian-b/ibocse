let trayIcon = document.getElementById('volume-tray-icon');
const loopAudio = new Audio('../audio/LOOP.wav');
const bootAudio = new Audio('../audio/BOOT.wav');
const panicAudio = new Audio('../audio/PANIC.wav');
// These are big, so they're only downloaded once they're played
loopAudio.preload = "none";
panicAudio.preload = "none";
loopAudio.volume = 0.2;
bootAudio.volume = 0.2;
panicAudio.volume = 1.0;
let muted = false;

// play() fails if the browser doesn't allow sound yet, or if pause() (log off, shut down, panic) or leaving the page
// cuts it short while the sound is still downloading; none of which needs handling.
function playSound(audio) {
    audio.play().catch((error) => {
        console.log(`Failed to play ${audio.src}: `, error);
    });
}

// Audio can only play after the user has interacted with the page.
// Autoplay is deprecated, so this momentarily works despite it being a hackjob.
document.getElementById('desktop').addEventListener('click', () => {
    if (!interacted) {
        interacted = true;

        // Play the boot audio first
        playSound(bootAudio);
        // When the boot audio finishes, play the loop audio
        bootAudio.addEventListener("ended", function() {
            playSound(loopAudio);
        });

        // When the loop audio finishes, loop the file itself (hence then name)
        loopAudio.addEventListener("ended", function() {
            playSound(loopAudio);
        });
    }
});

// Kernel panic
function audioPanic() {
    // Play audio
    bootAudio.pause();
    loopAudio.pause();
    playSound(panicAudio);
}

// Mute tray icon (the desktop's own sounds; Winamp has its own volume)
function setMuted(mute) {
    muted = mute;
    for (const audio of [loopAudio, bootAudio, panicAudio, shutdownAudio]) {
        audio.muted = mute;
    }
    trayIcon.src = mute ? 'images/icons/audio-nope-16x16.png' : 'images/icons/audio-okay-16x16.png';
    trayIcon.title = mute ? 'Volume (muted)' : 'Volume';
    try {
        localStorage.setItem('muted', mute);
    } catch (error) {
        // no local storage
    }
}
trayIcon.addEventListener('click', () => {
    setMuted(!muted);
});
try {
    if (localStorage.getItem('muted') === 'true') {
        setMuted(true);
    }
} catch (error) {
    // no local storage
}