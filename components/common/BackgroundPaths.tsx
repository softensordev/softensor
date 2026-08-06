import React from 'react';

// Atmósfera de fondo — paths SVG (DESIGN-SPEC §1). Última capa de movimiento
// de la Fase 3.
//
// QUÉ ES: un juego de líneas curvas finas que cruzan el viewport, tipo curvas
// de nivel o traza de señal, cuyo color respira teal→cian→azul con el ciclo de
// atmósfera. Es TEXTURA, no interacción: no persigue al cursor, no escucha
// eventos, no tiene estado.
//
// CÓMO CICLA EL COLOR: el mismo cross-fade de tres capas que usa el halo
// global. Tres grupos superpuestos, cada uno con su `stroke` ESTÁTICO en
// `--color-atmo-1/2/3` y su clase `.atmo-1/2/3` de `styles/globals.css`. El
// color no se interpola —eso exigiría `@property` o animar `stroke`, ambos
// prohibidos—: se cruzan capas de color fijo por `opacity`. Lo único que se
// anima en todo el componente es `opacity`, que es una propiedad compositada:
// GPU pura, cero trabajo de layout o paint por frame.
//
// SIN JAVASCRIPT. Ni framer-motion, ni `requestAnimationFrame`, ni estado, ni
// `matchMedia`. Todo el movimiento son los `@keyframes atmo-a/b/c` que ya
// existían desde 3.0 y que hasta 3.4c nadie consumía. Delta de bundle JS ≈ 0.
//
// A DIFERENCIA DEL HALO, SE MONTA SIEMPRE. El halo depende del modo puntero
// (no existe en táctil ni bajo `reduce`) porque sin cursor no tiene qué
// perseguir. Los paths no persiguen nada, así que se ven igual en táctil. Y
// como no consultan el modo, el markup es idéntico en servidor y en cliente:
// el SVG sale entero en el HTML estático y la hidratación no puede
// desalinearse.
//
// REDUCED-MOTION: no hay una sola regla nueva. Bajo
// `prefers-reduced-motion: reduce`, el bloque que ya existe en `globals.css`
// congela `.atmo-1` visible y `.atmo-2/3` a opacidad 0 —las líneas quedan
// quietas en teal— y `.bg-paths` (la clase reservada desde 3.0, que este
// componente por fin usa) anula cualquier `animation`/`transform` del
// contenedor.

/**
 * Presencia de la textura: opacidad del contenedor, multiplicada por la
 * `strokeOpacity` de cada línea y por el alfa del cross-fade.
 *
 * Calibrado para PRESENCIA MEDIA, que es el encargo explícito de 3.4c: el
 * fondo con solo el halo al 5 % quedaba casi imperceptible. Con este valor la
 * línea más fuerte compone al 16 % sobre `--color-bg` (#07090A) → ≈ rgb(6,39,35)
 * en teal: se lee con claridad como textura y sigue muy por debajo del texto
 * (#ECEEEE), así que no compite con la lectura. La más tenue queda al 7,2 %,
 * apenas por encima del halo, y esa diferencia entre líneas es lo que da
 * sensación de profundidad.
 *
 * Igual que en el halo, en mitad de un cruce de colores el alfa del grupo cae a
 * 0,75 (`1 − 0,5·0,5`, source-over no conserva la suma de opacidades), así que
 * el rango real es 12–16 % para la línea fuerte. Aquí no hay banda de spec que
 * respetar: §1 solo pide que la atmósfera cicle en lo decorativo.
 */
const PRESENCE = 0.16;

/**
 * Las líneas. Bézier cúbicas suaves (`C` + `S`, que garantiza tangente continua
 * en cada empalme: sin picos), casi horizontales y desfasadas entre sí.
 *
 * Todas empiezan en x = −100 y terminan en x = 1540, fuera del viewBox de
 * 1440×900: los extremos se recortan y nunca se ve dónde nace o muere una
 * línea. Ocho es la densidad que lee como textura sin convertirse en patrón:
 * con dos o tres se ven líneas sueltas, con veinte se vuelve rejilla.
 *
 * `width` y `opacity` varían por línea a propósito. Un juego de líneas
 * idénticas se lee como un gráfico; variarlas lo lee como profundidad, que es
 * lo que quiere "Señal": técnico y limpio, no orgánico recargado.
 */
const PATHS = [
  // Arranca en y ≈ 115 y no más arriba: la navegación es `fixed`, mide ~72 px y
  // es casi opaca (`bg-bg/90` + `backdrop-blur`), así que una línea por encima
  // de esa cota queda escondida bajo la barra en todo su ancho. Verificado por
  // muestreo de píxel: a y = 60 el trazo no llegaba a la pantalla.
  { d: 'M-100 115 C 300 240, 600 95, 900 205 S 1300 110, 1540 165', width: 1, opacity: 0.45 },
  { d: 'M-100 180 C 200 120, 420 260, 720 210 S 1240 100, 1540 170', width: 1.5, opacity: 0.6 },
  { d: 'M-100 300 C 240 220, 460 380, 760 320 S 1260 200, 1540 280', width: 2, opacity: 0.9 },
  { d: 'M-100 430 C 260 360, 500 520, 800 450 S 1280 330, 1540 400', width: 1.25, opacity: 0.7 },
  { d: 'M-100 560 C 220 500, 480 660, 780 580 S 1300 470, 1540 530', width: 2.25, opacity: 1 },
  { d: 'M-100 690 C 260 640, 520 790, 820 710 S 1300 610, 1540 660', width: 1.5, opacity: 0.75 },
  { d: 'M-100 820 C 240 780, 500 900, 800 840 S 1320 740, 1540 790', width: 1, opacity: 0.55 },
  { d: 'M-100 940 C 300 880, 620 980, 900 900 S 1320 840, 1540 880', width: 1.75, opacity: 0.5 },
] as const;

/** Las tres atmósferas, en orden de apilamiento. Mismo par (clase, color) que
 *  el halo global: una sola definición conceptual del ciclo. */
const ATMO_LAYERS = [
  { className: 'atmo-1', color: 'var(--color-atmo-1)' },
  { className: 'atmo-2', color: 'var(--color-atmo-2)' },
  { className: 'atmo-3', color: 'var(--color-atmo-3)' },
] as const;

/** Id del grupo de paths en `<defs>`. Se dibuja UNA vez y se instancia tres
 *  veces con `<use>`: el SVG que sale en el HTML lleva ocho `d` (≈ 500 B), no
 *  veinticuatro. Los paths no declaran `stroke`, así que cada `<g>` les impone
 *  el suyo por herencia. */
const PATHS_ID = 'atmo-signal-paths';

/**
 * Textura de fondo global. Se monta UNA vez, junto al halo, y no por sección:
 * es `fixed`, así que cubre el documento entero sin importar de dónde cuelgue
 * del árbol, y una sola instancia significa una sola copia del SVG, un solo
 * juego de tres capas compositadas y un ciclo de color sincronizado en toda la
 * página. Por sección habría N copias del mismo SVG y N capas más en GPU a
 * cambio de nada visible.
 */
const BackgroundPaths: React.FC = () => (
  <div
    aria-hidden="true"
    // `-z-20`: por debajo del halo global (`-z-10`) y del contenido, por encima
    // del lienzo del documento. `pointer-events: none` por si acaso — con
    // z negativo el SVG ya no puede interceptar un clic.
    className="bg-paths fixed inset-0 -z-20 pointer-events-none overflow-hidden"
    style={{ opacity: PRESENCE }}
  >
    <svg
      className="w-full h-full"
      viewBox="0 0 1440 900"
      // `slice` = cubrir sin deformar: la relación de aspecto se conserva y lo
      // que sobra se recorta. Con `none` las curvas se aplastarían en móvil
      // (390×844 contra un viewBox de 1440×900) hasta parecer otra cosa.
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <g id={PATHS_ID}>
          {PATHS.map(({ d, width, opacity }) => (
            <path
              key={d}
              d={d}
              fill="none"
              strokeWidth={width}
              strokeOpacity={opacity}
              strokeLinecap="round"
            />
          ))}
        </g>
      </defs>

      {ATMO_LAYERS.map(({ className, color }) => (
        <g key={className} className={className} stroke={color}>
          <use href={`#${PATHS_ID}`} />
        </g>
      ))}
    </svg>
  </div>
);

export default BackgroundPaths;
