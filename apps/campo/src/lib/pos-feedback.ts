/**
 * Feedback sensorial instantáneo para operaciones de Punto de Venta (Campo).
 * Utiliza Web Audio API nativo para sintetizar el "bip" de caja registradora
 * sin requerir conexión a internet ni descargar archivos mp3/wav externos.
 * Incluye respuesta háptica mediante navigator.vibrate.
 */

export type ScanSoundType = 'success' | 'error' | 'combo';

export function playScanBeep(type: ScanSoundType = 'success') {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'success') {
      // Bip agudo, nítido y satisfactorio (A5 / 880 Hz, duración 75ms)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      osc.start(now);
      osc.stop(now + 0.075);
    } else if (type === 'combo') {
      // Doble tono ascendente tipo recompensa / combo (E5 659Hz -> B5 987Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659, now);
      osc.frequency.setValueAtTime(987, now + 0.05);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      // Tono grave de advertencia / quiebre / error (180 Hz, duración 220ms)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch {
    // Si el usuario tiene el audio bloqueado o el dispositivo no soporta AudioContext, degradar en silencio
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') {
        navigator.vibrate(35);
      } else if (type === 'medium') {
        navigator.vibrate([40, 30, 40]);
      } else {
        navigator.vibrate([80, 50, 80]);
      }
    } catch {
      // Degradar silenciosamente en navegadores que no permitan vibración
    }
  }
}

/** Ejecuta feedback sonoro y háptico sincronizado */
export function triggerScanFeedback(type: ScanSoundType = 'success') {
  playScanBeep(type);
  if (type === 'success') triggerHaptic('light');
  else if (type === 'combo') triggerHaptic('medium');
  else triggerHaptic('heavy');
}
