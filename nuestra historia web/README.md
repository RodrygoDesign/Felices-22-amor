# Meli + Rodri — cumpleaños de Meli

La web funciona sin instalación ni dependencias. Abre `index.html` en el navegador.

## Añadir el vídeo

1. Copia el vídeo dentro de esta carpeta.
2. Llámalo exactamente `video.mp4` (en minúsculas).
3. Recarga la página y cualquiera de los botones de reproducción abrirá el vídeo.

Mientras el archivo no esté, la web muestra un mensaje de espera dentro del reproductor.

## Reel de la carta

El vídeo vertical de la sección **Una nota del amor de tu vida** se carga desde `reel.MP4`. Se reproduce en silencio cuando entra en pantalla y muestra controles para poder pausarlo o activar su sonido. Al activar el audio del reel, la canción de fondo se pausa automáticamente para que no se mezclen.

## Añadir la canción de fondo

1. Guarda una copia obtenida legalmente de la canción dentro de esta carpeta.
2. Llámala exactamente `cancion.mp3`.
3. El control flotante permite reproducirla, pausarla y cambiar su volumen.

La interfaz está rotulada como **Todo de Ti — Rauw Alejandro**. Mientras no exista el archivo local, se utiliza como respaldo la previsualización oficial de Apple Music. Si utilizas otra canción, cambia esos dos textos en `index.html`.

El volumen inicial está configurado al 15 %. La página intenta iniciar la música automáticamente y, si el navegador bloquea el audio con sonido, comienza con la primera pulsación del visitante.

## Efectos de sonido

La web genera efectos suaves sin archivos adicionales: un toque al pulsar botones y controles, pequeños pulsos al avanzar por la página, una transición al entrar en nuevas secciones y sonido de papel al arrastrar las notas. Por las restricciones de los navegadores, se activan después de la primera pulsación del visitante.

## Personalizar textos

Todo el contenido está en `index.html`. Puedes cambiar el texto de portada y la carta buscando sus textos directamente. Los colores y estilos están centralizados al principio de `styles.css`.

Las tres fotografías de las notas se leen desde `note-img1.JPG`, `note-img2.JPG` y `note-img3.jpg`. Las tarjetas se pueden arrastrar y su posición inicial está definida en los atributos `data-x`, `data-y` y `data-rotate` de `index.html`.
