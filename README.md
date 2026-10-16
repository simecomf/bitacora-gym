# Bitácora de Gym

App web instalable (PWA) para registrar entrenamientos, progreso, récords y medidas.
Los datos se guardan solo en el dispositivo (IndexedDB); exporta el respaldo JSON
desde **Rutinas › Respaldo** al menos una vez por semana.

- `index.html` — la app
- `localdb.js` — capa de datos local con la interfaz `doc()/collection()` que usa la app
- `sw.js` — service worker (app + librería XLSX sin internet). Sube `VERSION` al cambiar archivos.
- `manifest.webmanifest`, `icons/` — instalación en el teléfono
