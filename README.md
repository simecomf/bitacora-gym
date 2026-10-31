# Bitácora de Gym

App web instalable (PWA) para registrar entrenamientos, progreso, récords y medidas.
Los datos se guardan solo en el dispositivo (IndexedDB); exporta el respaldo JSON
desde **Rutinas › Respaldo** al menos una vez por semana.

- `index.html` — la app
- `localdb.js` — capa de datos local con la interfaz `doc()/collection()` que usa la app
- `session-model.js` — mezcla de sesiones entre pestañas, orden, eliminaciones y bloques de cardio
- `share-report.js` — informes de resultados para compartir, con selección de fechas y datos opcionales
- `sw.js` — service worker (app + librería XLSX sin internet). Sube `VERSION` al cambiar archivos.
- `manifest.webmanifest`, `icons/` — instalación en el teléfono
- `exercises-db.json` — índice del banco de imágenes [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense, dominio público); las imágenes se cargan desde jsDelivr fijadas a un commit
- `catalog.js` — catálogo de ejercicios por músculo con variantes, imagen y nota con su fuente científica
- Respaldo en Google Drive: pon el ID de cliente OAuth en `GOOGLE_CLIENT_ID` (index.html); usa el permiso `drive.file`

Durante una sesión, **Subir / Bajar** cambia el orden y **Quitar de hoy** elimina un
ejercicio solo de ese entrenamiento. Las series ya anotadas requieren confirmación.
La rutina habitual se edita desde **Rutinas › Editar**.

**Agregar cardio a esta sesión** permite registrar varios bloques (caminata,
carrera, bicicleta, elíptica, remo, escaladora u otro), antes o después de las pesas.
Solo los minutos son obligatorios. En el editor del día se puede activar un bloque
de cardio por defecto. Se incluye en historial, resúmenes, progreso, respaldos y Excel.

**Progreso › Cuerpo** separa brazo, antebrazo, muslo y pantorrilla por lado.
Las medidas anteriores se conservan como **sin lado**; no se duplican ni se
asignan automáticamente a una extremidad. Cada medida tiene su propia gráfica.

**Ver movimiento** reproduce una secuencia de las dos posiciones disponibles en
free-exercise-db, con pausa, ritmo y avance manual. No es un video continuo ni
incluye posiciones intermedias. Las fotos propias siguen siendo imágenes fijas;
para ejercicios sin referencia se puede elegir una del banco. Las posiciones se
guardan para uso sin conexión una vez descargadas.

Para ejecutar localmente: `python -m http.server 8765 --bind 127.0.0.1` y abrir
`http://127.0.0.1:8765/`. Usa un origen local separado de la app publicada para las pruebas.
Pruebas de regresión (sin dependencias): `node --test tests/session.test.cjs tests/share-report.test.cjs`.

**Compartir resultados** está en Historial, Rutinas y el resumen de una sesión.
Permite elegir una sesión, los últimos 7/30/90 días, todo el historial o fechas
personalizadas. Las medidas corporales y notas se incluyen solo si se marcan.
Se leen todas las sesiones guardadas, aunque no estén entre las últimas 1000 de la vista.

- **Resumen:** vista previa, copiar, enlace a WhatsApp con mensaje preparado y menú nativo de compartir cuando el navegador lo admite. En WhatsApp el usuario elige el destinatario y confirma el envío.
- **Informe para IA:** todas las series marcadas, su tipo, unidad y RPE, cardio y datos opcionales. Se puede copiar, descargar como TXT/JSON o compartir un TXT cuando el dispositivo lo permite. Incluye una petición de análisis. Con **Compartir…** el usuario elige ChatGPT u otra app disponible; también puede pegar o adjuntar el informe en su mensaje.

Los informes no incluyen fotos, ajustes de cuenta ni datos de conexión. No son
respaldos para restaurar. Se generan localmente; no requieren una API de IA ni
envían resultados automáticamente. Cancelar el menú de compartir no muestra un error.
