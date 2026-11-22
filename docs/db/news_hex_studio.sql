-- Noticias de Hex Studio para la PWA (tabla game.news_posts).
-- Reemplaza todas las noticias de prueba (devlogs del laboratorio, borrador interno) por las del estudio.
-- Uso: Supabase → SQL Editor → pegar y ejecutar. Corre en una transacción: si algo falla, no cambia nada.
-- Las portadas salen de cover_key (frontend/src/features/news/covers.ts); todas son ilustraciones del juego.
-- published_at = null es un borrador: existe en la base, pero la API no lo devuelve.

begin;

delete from game.news_posts;

insert into game.news_posts (slug, title, summary, content_md, cover_key, published_at) values

('anunciamos-the-day-i-made-that-promise',
 'Anunciamos The Day I Made That Promise',
 'Una promesa, una espada carmesí sin filo y unas islas que flotan sobre las nubes. Este es el primer juego de Hex Studio.',
 $md$
Hoy presentamos el proyecto en el que hemos trabajado desde el verano: **The Day I Made That Promise**, una aventura de acción con arte pixel sobre una promesa que nadie quiere dejar cumplir.

## Una promesa que desafía al cielo

Tsuki prometió quedarse junto a Hikari todo el tiempo que les quedara. Cuando una luz baja del cielo y se la lleva, Tsuki salta tras ella y despierta en una isla flotante con una marca en la mano: la marca de un **Rulebreaker**, alguien que rompió las reglas del cielo.

## El poder no se encuentra, se fabrica

No hay cofres con armas legendarias. Tsuki empieza con una espada carmesí que perdió su filo hace mucho, y cada mejora sale de lo que recolecta y forja con sus propias manos:

- **Explora** islas que cambian a cada paso.
- **Combate** criaturas que avisan antes de atacar.
- **Recolecta** materiales en cada zona.
- **Forja** mejoras para la espada y el equipo.
- **Desafía** a los guardianes que custodian el camino al Gran Juzgado.

> «El poder no se encuentra. Se fabrica.»

En las próximas semanas publicaremos diarios de desarrollo con lo que vamos construyendo. Gracias por acompañarnos desde el principio.

— *El equipo de Hex Studio*
$md$,
 'news_announcement', '2026-09-30 10:00:00-06'),

('diario-01-los-primeros-pasos-de-tsuki',
 'Diario de desarrollo #1: los primeros pasos de Tsuki',
 'Movimiento, ataque y la sensación de cada golpe. Así ajustamos los controles antes de construir cualquier otra cosa.',
 $md$
Antes de dibujar una sola isla nos hicimos una pregunta: **¿se siente bien mover a Tsuki?** Si la respuesta era no, nada de lo demás iba a importar.

## Moverse en diagonal sin pensarlo

Las islas se ven en perspectiva, así que «arriba» en el teclado no es «arriba» en el mapa. Probamos tres esquemas de control y nos quedamos con el que nadie tuvo que explicar en las pruebas: las teclas mueven a Tsuki en la dirección que el jugador espera ver en pantalla.

## Cada golpe tiene que pesar

Un ataque que no se siente es un ataque que no existe. Para cada golpe ajustamos tres cosas:

1. **Anticipación:** un instante en el que Tsuki se prepara.
2. **Impacto:** el enemigo retrocede y parpadea.
3. **Recuperación:** una ventana corta en la que eres vulnerable.

Con esos tres tiempos, atacar se vuelve una decisión y no solo un botón que se presiona sin parar.

## Lo que sigue

Con el movimiento resuelto, el siguiente paso fue darle a Tsuki algo contra qué pelear. De eso trata el próximo diario.
$md$,
 'news_devlog02', '2026-10-08 12:00:00-06'),

('diario-02-las-criaturas-de-la-isla',
 'Diario de desarrollo #2: las criaturas de la isla',
 'En el cielo, la marca de Rulebreaker convierte a Tsuki en enemigo de todos. Así diseñamos a quienes salen a su encuentro.',
 $md$
Las criaturas de las islas no preguntan quién eres: ven la marca de **Rulebreaker** y atacan. Nuestro reto fue que esos combates fueran justos.

## Leer antes de reaccionar

Cada enemigo **avisa antes de atacar**. Puede ser una postura, un destello o un sonido, pero siempre hay una señal. La regla interna del equipo es sencilla: si un golpe te alcanza, tiene que ser porque no reaccionaste a tiempo, nunca porque no había forma de verlo.

## Dos formas de pelear

En el capítulo 1 hay dos tipos de criatura y cada una pide algo distinto:

- **Las que embisten:** cargan en línea recta. Esquivar hacia un lado y contraatacar es la respuesta.
- **Las que rodean:** llegan en grupo y buscan tu espalda. Aquí importa más dónde te paras que qué tan rápido atacas.

## Lo que dejan al caer

Al vencerlas sueltan materiales. No son decoración: son lo único que hará que la espada de Tsuki vuelva a cortar. Y para eso hace falta una forja.
$md$,
 'news_devlog03', '2026-10-17 12:00:00-06'),

('diario-03-la-forja-de-kaede',
 'Diario de desarrollo #3: la forja de Kaede',
 'Una investigadora, un campamento escondido entre los árboles y la primera mejora de la espada: de 15 a 25 de daño.',
 $md$
Del otro lado del puente, en tierra firme, vive **Kaede**, una investigadora que le ofrece a Tsuki lo que nadie más le daría a un **Rulebreaker**: un refugio y una forja.

## Recetas, no suerte

En la forja eliges una receta y ves de inmediato qué te falta. Si no tienes los materiales, no se gasta nada: puedes revisar todo con calma antes de decidir.

La receta más importante del capítulo es el **Módulo de espada**:

- Necesita **Alma antigua** y **Circuito antiguo**, que sueltan las criaturas y guardan las ruinas.
- Despierta la espada carmesí y sube su daño de **15 a 25**.

Además puedes forjar pociones, la Gota de Amrita y una armadura de cuero completa: casco, pechera y botas.

## Por qué la forja está lejos

Pudimos poner la forja junto a cada combate, pero preferimos que volver al campamento fuera parte del viaje. Regresar con los bolsillos llenos y ver la lista de recetas iluminarse es una de las sensaciones que más cuidamos.

> Kaede no regala nada. Pero tampoco hace preguntas.
$md$,
 'news_devlog01', '2026-10-24 12:00:00-06'),

('diario-04-la-prueba-del-santuario',
 'Diario de desarrollo #4: la prueba del Santuario',
 'Antes del guardián, la espada tiene que demostrar que está lista. Así funciona la prueba por oleadas del Santuario.',
 $md$
El camino al primer guardián pasa por el **Santuario**, un salón de piedra rodeado de cristales donde la espada de Tsuki se pone a prueba.

## Oleadas que enseñan

La prueba se divide en **dos oleadas**. La primera repasa lo que ya sabes: leer las señales de cada criatura y elegir bien dónde pararte. La segunda mezcla los dos tipos de enemigo y te obliga a cambiar de táctica a mitad del combate.

## El sello

La puerta del guardián está cerrada por un sello. Solo se abre cuando la espada ya despertó en la forja de Kaede. Así nos aseguramos de que nadie llegue al jefe con una espada sin filo y pase un mal rato sin entender por qué.

## Guardar antes de lo difícil

Justo antes del sello hay un punto de guardado. Si el guardián te derrota, vuelves aquí con todo lo que habías conseguido, sin repetir la isla completa.
$md$,
 'news_devlog04', '2026-10-31 12:00:00-06'),

('la-leyenda-detras-de-la-promesa',
 'La leyenda detrás de la promesa',
 'Un rey que alzó su espada contra los dioses, cuatro doncellas y un destierro a las islas del cielo. El mundo del juego, contado desde el principio.',
 $md$
Cada partida comienza con la misma historia, contada en seis viñetas. Aquí la compartimos completa para quien quiera conocer el mundo antes de jugar.

## Hace mil años

Un rey alzó su espada contra los dioses. Lo acompañaron un pecador, una bestia y cuatro doncellas. Perdieron.

Como castigo, los humanos bendecidos fueron **desterrados a islas suspendidas sobre las nubes**, y quien vuelve a romper las reglas del cielo recibe una marca en la mano: la de un **Rulebreaker**.

## Tsuki y Hikari

Siglos después, Tsuki encontró a una chica caída del cielo: **Hikari**. Le prometió quedarse a su lado todo el tiempo que les quedara. Un día, un rayo de luz bajó de las nubes y se la llevó.

Tsuki solo tiene una promesa. Y para cumplirla, desafiará al mismo cielo.

## El Gran Juzgado

Para llegar hasta Hikari, Tsuki tiene que alcanzar el Gran Juzgado. El camino está cerrado por **cuatro guardianes**, y ninguno le dará su permiso a un Rulebreaker por las buenas.
$md$,
 'news_devlog07', '2026-11-07 12:00:00-06'),

('tu-partida-en-la-web-y-en-tu-telefono',
 'Tu partida, también en la web y en tu teléfono',
 'Con una sola cuenta ves tus partidas, tus logros y las noticias del estudio desde el navegador o desde la app para Android.',
 $md$
El juego no termina cuando cierras la ventana. Con la **misma cuenta** del juego ahora puedes revisar tu progreso desde cualquier lugar.

## En el navegador

Inicia sesión en este sitio y entra a tu panel:

- Tus **tres ranuras de guardado**, con capítulo y tiempo de juego.
- Tu **historial** de sesiones y los hitos de cada partida.
- Los **logros** que llevas desbloqueados.

El sitio se puede **instalar como app** desde Chrome o Edge, y lo último que consultaste sigue disponible aunque te quedes sin conexión.

## En tu teléfono

La app compañera para **Android** muestra lo mismo en tu bolsillo. Descárgala desde la sección *Tu partida, en tu bolsillo* de la página principal. Al instalarla, Android te pedirá permitir apps de origen desconocido.

## Una sola cuenta

Juego, web y app usan la misma cuenta. Lo que avanzas en la PC aparece en los otros dos en cuanto el juego se conecta.
$md$,
 'news_pwa', '2026-11-12 12:00:00-06'),

('conoce-a-varn-el-guardian-del-umbral',
 'Conoce a Varn, el Guardián del Umbral',
 'Escudo, puños y una espada que guarda en el pecho. Así diseñamos al primer guardián del camino al Gran Juzgado.',
 $md$
**Varn** custodia la entrada al Gran Juzgado. Es el primero de los cuatro guardianes y el jefe final del capítulo 1.

## Dos fases, una arena

El combate ocurre en una arena roja que deja todo a la vista: no hay rincones donde esconderse ni enemigos menores que distraigan.

- **Primera fase:** Varn pelea con escudo y puños. Sus golpes son lentos y muy claros; es el momento de aprender su ritmo.
- **Segunda fase:** cuando se enfurece, saca la espada que guarda en el pecho. Los ataques se encadenan y el choque de espadas pide reaccionar rápido.

## Telegrafiado, siempre

Fieles a la regla del estudio, cada ataque de Varn tiene su aviso. Puede vencerte, pero nunca debería sorprenderte.

## Lo que se gana

Vencer a Varn le da a Tsuki el **permiso del primer guardián**. El camino al Gran Juzgado sigue cerrado, pero ya hay una puerta menos.

> El umbral no se cruza. Se gana.
$md$,
 'news_devlog05', '2026-11-16 12:00:00-06'),

('ya-puedes-jugar-la-demo-del-capitulo-1',
 'Ya puedes jugar la demo del capítulo 1',
 'Dos zonas, la forja de Kaede y el duelo contra Varn. Descarga gratis la demo para Windows y juega de 20 a 30 minutos.',
 $md$
La espera terminó: **la demo del capítulo 1 ya está disponible** y es gratis.

## Qué incluye

- La **Isla de las Flores** y el camino a tierra firme.
- El campamento y la **forja de Kaede**, con sus recetas y mejoras.
- La **prueba del Santuario**.
- El duelo contra **Varn, el Guardián del Umbral**.

Se juega en **20 a 30 minutos**.

## Requisitos mínimos

- **Sistema:** Windows 10 u 11 (64 bits)
- **Gráficos:** compatible con DirectX 11 o 12
- **Espacio:** 600 MB libres
- **Controles:** teclado y mouse

## Cómo instalarla

1. Ve a la sección *Descarga la demo* de la página principal y descarga el archivo ZIP.
2. Descomprímelo en cualquier carpeta.
3. Abre `TheDayIMadeThatPromise.exe`.

Crea tu cuenta para guardar tu partida en la nube y ver tu progreso desde la web y la app.

Gracias a todas las personas que probaron las versiones tempranas. Esta demo también es suya.

— *Hex Studio*
$md$,
 'news_demo', '2026-11-20 18:00:00-06'),

-- Borrador: está en la base pero no aparece en la web hasta que tenga fecha de publicación.
('lo-que-viene-despues-del-capitulo-1',
 'Lo que viene después del capítulo 1',
 'Tres guardianes más, nuevas zonas y lo que aprendimos de la demo.',
 $md$
*Borrador interno. Publicar cuando el plan del capítulo 2 esté confirmado.*

## Pendiente

- Zonas del capítulo 2.
- Siguiente guardián.
- Cambios a partir de los comentarios de la demo.
$md$,
 'news_devlog09', null);

commit;

-- Comprobación: 9 publicadas y 1 borrador, de la más nueva a la más antigua.
select slug, title, cover_key, published_at
from game.news_posts
order by published_at desc nulls last;
