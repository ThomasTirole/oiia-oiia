/**
 * useSpinDetector — composable Vue pour détecter la rotation de l'utilisateur.
 *
 * Utilise le plugin natif @capacitor/motion pour lire le gyroscope.
 * Expose un booléen réactif `isSpinning` avec hystérésis (debounce start/stop)
 * pour éviter le clignotement.
 */
import { ref, readonly } from 'vue';
import { Motion } from '@capacitor/motion';
import type { PluginListenerHandle } from '@capacitor/core';

export interface SpinDetectorOptions {
  /** Seuil de rotation en deg/s (défaut : 50) */
  threshold?: number;
  /** Délai avant activation du spin en ms (défaut : 150) */
  startDelay?: number;
  /** Délai avant désactivation du spin en ms (défaut : 250) */
  stopDelay?: number;
}

export function useSpinDetector(options: SpinDetectorOptions = {}) {
  const threshold  = options.threshold  ?? 50;
  const startDelay = options.startDelay ?? 150;
  const stopDelay  = options.stopDelay  ?? 250;

  // ── État réactif (readonly pour le consommateur) ────
  const isSpinning   = ref(false);
  const rotationRate = ref(0);

  // ── Variables internes d'hystérésis ─────────────────
  let aboveSince: number | null = null;
  let belowSince: number | null = null;
  let handle: PluginListenerHandle | null = null;

  /**
   * Démarre l'écoute du capteur de mouvement via Capacitor Motion.
   * Sur iOS 13+, le plugin déclenche automatiquement la demande
   * de permission au premier appel.
   */
  async function start() {
    if (handle) return; // déjà en écoute

    handle = await Motion.addListener('accel', (event) => {
      const r = event.rotationRate;
      // Max absolu sur les 3 axes → robuste quelle que soit l'orientation du téléphone
      const rate = Math.max(Math.abs(r.alpha), Math.abs(r.beta), Math.abs(r.gamma));
      rotationRate.value = rate;

      const now = Date.now();

      if (rate > threshold) {
        // Au-dessus du seuil → reset le timer "below", armer le timer "above"
        belowSince = null;
        if (aboveSince === null) aboveSince = now;
        if (!isSpinning.value && now - aboveSince >= startDelay) {
          isSpinning.value = true;
        }
      } else {
        // En-dessous du seuil → reset le timer "above", armer le timer "below"
        aboveSince = null;
        if (belowSince === null) belowSince = now;
        if (isSpinning.value && now - belowSince >= stopDelay) {
          isSpinning.value = false;
        }
      }
    });
  }

  /** Arrête l'écoute et remet tout à zéro. */
  async function stop() {
    if (handle) {
      await handle.remove();
      handle = null;
    }
    aboveSince = null;
    belowSince = null;
    isSpinning.value = false;
    rotationRate.value = 0;
  }

  return {
    /** true quand l'utilisateur tourne sur lui-même */
    isSpinning:   readonly(isSpinning),
    /** taux de rotation actuel en deg/s */
    rotationRate: readonly(rotationRate),
    /** démarrer l'écoute du capteur */
    start,
    /** stopper l'écoute du capteur */
    stop,
  };
}
