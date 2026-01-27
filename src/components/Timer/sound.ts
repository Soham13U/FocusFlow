let audio: HTMLAudioElement | null = null;

export function initSound()
{
    if(!audio)
    {
        audio = new Audio("/sounds/done.mp3");
        audio.preload = "auto";
    }

    audio.volume = 1.0;
    const p = audio.play();
    if (p && typeof p.then === "function") {
    p.then(() => {
      audio?.pause();
      if (audio) audio.currentTime = 0;
    }).catch(() => {
      // If blocked, that's okay. Completion play may still work depending on browser.
    });
  }

}


export function playEndSound() {
  if (!audio) {
    audio = new Audio("/sounds/done.mp3");
    audio.preload = "auto";
  }
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // ignore if blocked
  });
}