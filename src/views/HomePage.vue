<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false" class="oiia-content">
      <!-- iOS 13+ : permission capteurs requise via geste utilisateur -->
      <div v-if="needsPermission" class="prompt" @click="grantAndStart">
        <p>Appuie pour activer les capteurs de mouvement</p>
      </div>

      <!-- Chat principal -->
      <div class="center">
        <img
          v-if="CONFIG.USE_GIF && isSpinning"
          :src="CONFIG.SPIN_IMAGE"
          class="cat"
          alt="oiia cat"
        />
        <img
          v-else
          :src="CONFIG.STATIC_IMAGE"
          :class="['cat', { 'cat--spin': isSpinning && !CONFIG.USE_GIF }]"
          alt="oiia cat"
        />
      </div>

      <!-- Debug overlay (activer via CONFIG.DEBUG) -->
      <div v-if="CONFIG.DEBUG" class="debug">
        {{ rotationRate.toFixed(1) }}&deg;/s &middot; {{ isSpinning ? 'SPIN' : 'idle' }}
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { useSpinDetector } from '@/composables/useSpinDetector';

/* ── Configuration ───────────────────────────────────────
   Modifier ces valeurs pour ajuster le comportement.
   ──────────────────────────────────────────────────────── */
const CONFIG = {
  ROTATION_THRESHOLD: 50,          // deg/s – augmenter si trop sensible
  START_DELAY:        150,         // ms avant activation du spin
  STOP_DELAY:         250,         // ms avant désactivation du spin
  USE_GIF:            true,        // true → utilise SPIN_IMAGE (gif) au lieu de la rotation CSS
  DEBUG:              false,       // true → overlay avec données gyroscope
  STATIC_IMAGE:       '/cat_static.png',
  SPIN_IMAGE:         '/cat_spin.gif',
  AUDIO_FILE:         '/oiia.mp3',
};

// ── Capteur via composable Capacitor ──────────────────
const { isSpinning, rotationRate, start, stop } = useSpinDetector({
  threshold:  CONFIG.ROTATION_THRESHOLD,
  startDelay: CONFIG.START_DELAY,
  stopDelay:  CONFIG.STOP_DELAY,
});

// ── Audio ─────────────────────────────────────────────
let audio: HTMLAudioElement | null = null;

function initAudio() {
  audio = new Audio(CONFIG.AUDIO_FILE);
  audio.loop = true;
  audio.preload = 'auto';
}

// Quand isSpinning change → play / stop audio
watch(isSpinning, (spinning) => {
  if (!audio) return;
  if (spinning) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
    audio.currentTime = 0;
  }
});

// ── Permission iOS 13+ ───────────────────────────────
const needsPermission = ref(false);

async function grantAndStart() {
  try {
    const DME = DeviceMotionEvent as any;
    if (typeof DME.requestPermission === 'function') {
      const res = await DME.requestPermission();
      if (res !== 'granted') return;
    }
    needsPermission.value = false;
    await start();
  } catch {
    /* refusé ou non supporté */
  }
}

// ── Lifecycle ─────────────────────────────────────────
onMounted(async () => {
  initAudio();

  const DME = DeviceMotionEvent as any;
  if (typeof DME.requestPermission === 'function') {
    // iOS 13+ → geste utilisateur obligatoire avant d'activer le capteur
    needsPermission.value = true;
  } else {
    // Android / web → démarrer directement le capteur Capacitor
    await start();
  }
});

onUnmounted(async () => {
  await stop();
  if (audio) {
    audio.pause();
    audio = null;
  }
});
</script>

<style scoped>
.oiia-content {
  --background: #000;
}

.center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.cat {
  max-width: 80vw;
  max-height: 80vh;
  object-fit: contain;
  will-change: transform;
}

.cat--spin {
  animation: spin 0.4s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.prompt p {
  color: #fff;
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
}

.debug {
  position: fixed;
  bottom: 1rem;
  left: 0;
  right: 0;
  text-align: center;
  color: #0f0;
  font-family: monospace;
  font-size: 0.85rem;
  pointer-events: none;
}
</style>
