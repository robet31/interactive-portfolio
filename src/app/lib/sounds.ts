// Sound notification utility
// Using free sounds from reliable CDNs

const SOUND_URLS = {
  success: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  warning: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
  upload: 'https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  notification: 'https://assets.mixkit.co/active_storage/sfx/2991/2991-preview.mp3',
};

const audioCache: Record<string, HTMLAudioElement> = {};

function preloadSounds() {
  Object.entries(SOUND_URLS).forEach(([key, url]) => {
    if (!audioCache[key]) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      audioCache[key] = audio;
    }
  });
}

preloadSounds();

export function playSound(type: keyof typeof SOUND_URLS = 'notification') {
  try {
    const audio = audioCache[type] || audioCache.notification;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Fallback: create beep sound
        playBeep();
      });
    } else {
      playBeep();
    }
  } catch {
    playBeep();
  }
}

function playBeep() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch {
    // Ignore errors
  }
}

export function playSuccessSound() {
  playSound('success');
}

export function playErrorSound() {
  playSound('error');
}

export function playUploadSound() {
  playSound('upload');
}

export function playNotificationSound() {
  playSound('notification');
}

export function playClickSound() {
  playSound('click');
}
