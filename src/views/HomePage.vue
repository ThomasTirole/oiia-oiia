<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false" class="oiia-content">
      <!-- iOS 13+ : permission capteurs requise via geste utilisateur -->
      <div v-if="needsPermission" class="prompt" @click="requestPermission">
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
import { ref, onMounted, onUnmounted } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';

/* ── Tunables ────────────────────────────────────────────
   Modifier ces valeurs pour ajuster le comportement.
   ─────────────────────────────────────────────────────── */
const CONFIG = {
  ROTATION_THRESHOLD: 50,          // deg/s – augmenter si trop sensible
  START_DELAY:        150,         // ms avant activation du spin
  STOP_DELAY:         250,         // ms avant désactivation du spin
  USE_GIF:            true,       // true → utilise SPIN_IMAGE (gif) au lieu de la rotation CSS
  DEBUG:              false,       // true → overlay avec données gyroscope
  STATIC_IMAGE:       '/cat_static.png',  // remplacer par '/cat_static.png' avec votre asset
  SPIN_IMAGE:         '/cat_spin.gif',    // utilisé seulement si USE_GIF = true
  AUDIO_FILE:         '/oiia.mp3',
};

// ── État réactif ──────────────────────────────────────
const isSpinning = ref(false);
const needsPermission = ref(false);
const rotationRate = ref(0);

// ── Audio ─────────────────────────────────────────────
let audio: HTMLAudioElement | null = null;

function initAudio() {
  audio = new Audio(CONFIG.AUDIO_FILE);
  audio.loop = true;
  audio.preload = 'auto';
}

// ── Contrôle du spin ──────────────────────────────────
function startSpinning() {
  if (isSpinning.value) return;
  isSpinning.value = true;
  audio?.play().catch(() => {});
}

function stopSpinning() {
  if (!isSpinning.value) return;
  isSpinning.value = false;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

// ── Gyroscope avec hystérésis ─────────────────────────
let aboveSince: number | null = null;
let belowSince: number | null = null;

function onMotion(e: DeviceMotionEvent) {
  const r = e.rotationRate;
  if (!r) return;

  // Max sur les 3 axes → robuste quelle que soit l'orientation du téléphone
  const rate = Math.max(
    Math.abs(r.alpha ?? 0),
    Math.abs(r.beta ?? 0),
    Math.abs(r.gamma ?? 0),
  );
  rotationRate.value = rate;

  const now = Date.now();

  if (rate > CONFIG.ROTATION_THRESHOLD) {
    belowSince = null;
    if (aboveSince === null) aboveSince = now;
    if (!isSpinning.value && now - aboveSince >= CONFIG.START_DELAY) {
      startSpinning();
    }
  } else {
    aboveSince = null;
    if (belowSince === null) belowSince = now;
    if (isSpinning.value && now - belowSince >= CONFIG.STOP_DELAY) {
      stopSpinning();
    }
  }
}

// ── Permission iOS 13+ ───────────────────────────────
async function requestPermission() {
  try {
    const res = await (DeviceMotionEvent as any).requestPermission();
    if (res === 'granted') {
      needsPermission.value = false;
      window.addEventListener('devicemotion', onMotion);
    }
  } catch {
    /* refusé ou non supporté */
  }
}

// ── Lifecycle ─────────────────────────────────────────
onMounted(() => {
  initAudio();

  if (!('DeviceMotionEvent' in window)) return; // desktop sans capteurs

  if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
    needsPermission.value = true; // iOS → attendre geste utilisateur
  } else {
    window.addEventListener('devicemotion', onMotion); // Android → direct
  }
});

onUnmounted(() => {
  window.removeEventListener('devicemotion', onMotion);
  stopSpinning();
  audio = null;
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
