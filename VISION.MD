## Prompt complet (spécification claire)

Je veux développer une app mobile **Ionic + Vue + Capacitor** déjà créée avec :

`ionic start oiia-oiia blank --type=vue --capacitor`

### Objectif

Créer une **app fullscreen vide** (aucun menu, aucun header), avec un seul écran :

* Quand l’utilisateur **ne tourne pas sur lui-même**, afficher une **image statique** du “spinning cat”.
* Quand l’utilisateur **tourne sur lui-même** (rotation du corps sur l’axe vertical), lancer :

    * une **animation** (le chat tourne vite / version animée type GIF ou sprite / ou rotation CSS),
    * * un **son** en boucle : “oiia oiia”.
* Dès que l’utilisateur **arrête de tourner**, **stop immédiat** :

    * animation stoppée,
    * son stoppé,
    * retour à l’image statique.

### Contraintes techniques

* Tech stack : **Ionic Vue + Capacitor**.
* App doit fonctionner **sur Android** (priorité), iOS si possible.
* Utiliser les **capteurs natifs** via Capacitor (le plus simple possible).
* Pas besoin de backend, pas de login, pas de stockage.
* Le design est minimal : **fond noir**, contenu centré, fullscreen.
* Prévoir les **permissions** nécessaires (capteurs / motion).

### Détection de rotation (logique attendue)

Je veux une détection simple et robuste basée sur les capteurs :

* Utiliser de préférence le **gyroscope** (rotation rate), sinon fallback sur autre capteur.
* On considère que “l’utilisateur tourne” si la rotation sur l’axe vertical dépasse un seuil :

    * exemple : `|rotationRateY|` ou `|rotationRateZ|` (selon convention du plugin) > **SEUIL**
    * le seuil doit être ajustable (ex: `1.0 rad/s` ou équivalent).
* Pour éviter que ça clignote :

    * **hystérésis / debounce** :

        * démarrage si > seuil pendant ~150 ms,
        * arrêt si < seuil pendant ~250 ms.
* Tant que la condition “tourne” est vraie :

    * le son continue en boucle,
    * l’animation continue.
* Dès que “tourne” devient faux :

    * tout s’arrête.

### Assets

* Je vais fournir (ou tu crées des placeholders) :

    * `cat_static.png` (image)
    * `cat_spin.gif` OU bien une rotation CSS d’une image `cat.png`
    * `oiia.mp3` (audio)
* L’audio doit pouvoir être joué en boucle et stoppé net.

### UX attendue

* Au lancement : écran fullscreen, chat statique, aucun son.
* Quand je commence à tourner sur moi-même : son + animation start rapidement (<200ms).
* Quand je m’arrête : stop immédiat et retour statique.

### Livrables attendus

1. Installer/configurer le plugin capteur (Capacitor-friendly) et permissions Android.
2. Implémenter un composant Vue/Ionic unique (ex: `HomePage.vue`) qui :

    * écoute les capteurs (start/stop propre au lifecycle),
    * calcule “spinning: boolean”,
    * gère l’animation (GIF ou CSS),
    * gère l’audio (loop + stop).
3. Code clair, minimal, commenté, avec un endroit unique pour régler :

    * seuil,
    * timings debounce/hystérésis.

---

## Version courte (si tu veux un prompt compact)

Je veux une app Ionic-Vue-Capacitor fullscreen avec un chat statique. Quand l’utilisateur tourne sur lui-même (détecté via gyroscope rotation rate sur axe vertical > seuil avec debounce), l’app affiche une animation de chat qui tourne + joue un son “oiia oiia” en boucle. Dès que l’utilisateur s’arrête, tout stop immédiatement et retour au chat statique. Android prioritaire. Code minimal, seuil et timings réglables.

---

## Petite note utile (pour que l’IA fasse le bon choix)

* Pour “je tourne sur moi-même”, le plus logique est le **gyroscope / rotation rate** (pas la boussole).
* La boussole (heading) peut aider, mais elle est souvent bruitée et filtrée.
* Donc demande explicitement : **gyro d’abord**, fallback éventuel ensuite.

Si tu veux, je peux te proposer une **formule de détection “safe”** (seuil + moyenne glissante) que tu mets telle quelle dans le prompt, mais déjà là ton spec est assez béton pour que l’IA code dans la bonne direction.
