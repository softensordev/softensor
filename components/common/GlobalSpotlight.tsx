import React from 'react';
import { motion, useSpring } from 'framer-motion';
import { usePointerTracker } from '../../hooks/usePointerTracker';

// Halo global del spotlight (DESIGN-SPEC §3, micro-interacción #7 de §2).
//
// LA PROHIBICIÓN EXPLÍCITA DEL SPEC, y la razón de que este archivo se lea así:
// el halo es UN `<div>` con un `radial-gradient` ESTÁTICO —definido una vez, en
// el `style` de abajo— que se mueve SOLO por `transform`. Nunca se recalcula
// `background-image` ni `background-position` por evento. Recalcularlos
// obligaría a repintar el viewport entero en cada `pointermove`; moviendo el
// div, el trabajo por frame es una composición de una capa ya rasterizada.
// El centro del gradiente está FIJO respecto al div: lo que persigue al cursor
// es el div completo.
//
// SEGUNDO CONSUMIDOR DEL LISTENER COMPARTIDO (§4). No añade ni un
// `pointermove`: llama a `usePointerTracker()` y el refcount del hook hace el
// resto. `hooks/usePointerTracker.ts` no se tocó en esta etapa.
//
// CERO `setState` por evento: los MotionValues del tracker alimentan dos
// springs y los springs escriben el `transform`. Lo único que provoca un
// re-render de React aquí es la resolución del modo, una vez al hidratar.
//
// 3.4c — EL COLOR YA CICLA (§1). El halo dejó de ser un div y pasó a ser un
// contenedor con TRES capas superpuestas, cada una con su gradiente estático en
// `--color-atmo-1/2/3` y su clase `.atmo-1/2/3` de `styles/globals.css`. El
// color NO se interpola: se cruzan capas de color fijo por `opacity`, que es la
// decisión de Fase 2 sobre cómo ciclar sin `@property`. El `transform` sigue
// viviendo en el contenedor —una sola suscripción, un solo par de springs— así
// que las tres capas persiguen al cursor como un único objeto y lo único que
// cambia entre ellas es cuál está visible. Sin `@keyframes` nuevos: los de
// atmósfera existen desde 3.0 y hasta ahora nadie los consumía.

/** Radio del halo en px (§3: ~600). El div mide 2×RADIUS y el gradiente
 *  `closest-side` hace que el radio visible sea exactamente RADIUS. */
const RADIUS = 600;

/**
 * Opacidad pico del halo global (§3: **12 %**). Vive en el CONTENEDOR, no en el
 * color ni en las capas: es exactamente lo que 3.4b dejó preparado.
 *
 * CÓMO SE COMPONEN LAS DOS OPACIDADES. Las capas se mezclan primero entre sí
 * (el `opacity` del contenedor las agrupa y las compone en un búfer aparte) y
 * el resultado se multiplica por PEAK_OPACITY. Dentro del grupo el fondo es
 * transparente, así que el alfa que sale de N capas apiladas es
 * `1 − Π(1 − aᵢ)`, no `Σ aᵢ`:
 *
 *   - En el PICO de cada color (t = 0, 1/3, 2/3 del ciclo) una capa está a 1 y
 *     las otras dos a 0 → alfa del grupo = 1 → halo al **12,0 %**. Es el número
 *     que pide §3, en el instante en que el color es una atmósfera pura.
 *   - En mitad de un cruce (dos capas a 0,5) el alfa del grupo baja a
 *     `1 − 0,5·0,5 = 0,75` → **9,0 %**. Es un valle, no un pico: §3 acota la
 *     opacidad *pico*, y el pico sigue siendo 12 %. El valle dura un instante
 *     de un ciclo de 24 s y hace el halo ~25 % más tenue justo cuando el color
 *     está a medio camino entre dos atmósferas.
 *
 * El valle es estructural al cross-fade por alfa (source-over no conserva la
 * suma de opacidades). A 9 % el halo SIGUE SIENDO VISIBLE, así que no hay nada
 * que corregir: es una respiración, no una desaparición.
 *
 * 3.5a — POR QUÉ 0,12 Y NO EL 4–6 % ORIGINAL. El rango aprobado en Fase 2 era
 * 4–6 %, y ahí el halo global resultaba imperceptible **frente al halo de
 * tarjeta**, que §3 fija en 14–18 %: dos niveles de spotlight cuya diferencia
 * es tan grande que el nivel global no se ve dejan de ser dos niveles. Luis lo
 * validó en pantalla (a 5 %, y hasta 10 %, el global no se leía) y amplió el
 * rango a 12 %. La jerarquía se mantiene —el global sigue por debajo del de
 * tarjeta— y la diferenciación entre ambos sigue siendo por ESCALA Y NITIDEZ,
 * nunca por color, que es la decisión de Fase 2 que encabeza §3.
 *
 * Es una **ampliación documentada del spec**, no una deriva: DESIGN-SPEC §3
 * quedó actualizado con el 12 % y con el 4–6 % anotado como reemplazado, y el
 * registro completo está en BITACORA.md, Entrada 20.
 */
const PEAK_OPACITY = 0.12;

/** Las tres capas de atmósfera, en orden de apilamiento. Cada una lleva su
 *  color estático y la clase de cross-fade que le corresponde. */
const ATMO_LAYERS = [
  { className: 'atmo-1', color: 'var(--color-atmo-1)' },
  { className: 'atmo-2', color: 'var(--color-atmo-2)' },
  { className: 'atmo-3', color: 'var(--color-atmo-3)' },
] as const;

/**
 * Spring BLANDO (§3): el halo persigue al cursor con retraso perceptible.
 * ω = √(k/m) ≈ 6,7 rad/s frente a los ≈19,3 de las pupilas — casi 3× más
 * lento — y ζ = c/(2√(km)) ≈ 1,6 > 1, sobreamortiguado: llega tarde pero sin
 * rebotar. El rebote en una masa de 1200×1200 px se leería como un fallo.
 */
const SPRING = { stiffness: 45, damping: 22, mass: 1 } as const;

/**
 * Atmósfera que persigue al cursor a nivel de página. Se monta en `_app.tsx`,
 * fuera de cualquier sección, para que cubra el documento entero.
 *
 * No se monta en táctil (`wander`) ni bajo `reduce` (`off`): en el primer
 * render —servidor y cliente— `usePointerTracker` devuelve `off`, así que el
 * HTML estático no lo contiene y la hidratación no puede desalinearse. El halo
 * aparece después, ya en cliente, cuando el efecto resuelve el modo.
 */
const GlobalSpotlight: React.FC = () => {
  const { x, y, mode } = usePointerTracker();

  // Los hooks van antes del early return: el orden de hooks no puede depender
  // del modo. En `wander`/`off` los springs existen pero su fuente está quieta.
  const haloX = useSpring(x, SPRING);
  const haloY = useSpring(y, SPRING);

  if (mode !== 'pointer') return null;

  return (
    <motion.div
      aria-hidden="true"
      // `z-10`: escalón intermedio del stacking context de la página (ver
      // `pages/index.tsx`). Encima de los paths de atmósfera (`z-0`) y del
      // color base, debajo del contenido (`z-20`), que es lo que exige §3.
      //
      // Antes esto era `-z-10` y el "por debajo del contenido" salía de que un
      // z negativo se pinta por detrás de los fondos de bloque. Eso funciona,
      // pero es implícito y frágil: cualquier elemento en flujo con fondo
      // opaco tapa la capa sin avisar (pasó dos veces — el `background` de
      // `body` y el `bg-bg` de `Section`). Con el orden explícito, que el halo
      // quede debajo del contenido es una regla escrita, no un efecto
      // secundario del algoritmo de pintado.
      //
      // `Section` sigue dejando su fondo transparente: no porque haga falta
      // para el z-index, sino porque un fondo opaco encima de esta capa la
      // taparía igual — ahora por la razón correcta y visible.
      //
      // `pointer-events: none` es lo ÚNICO que impide que este div de
      // 1200×1200 px intercepte clics: con z no-negativo ya no hay una segunda
      // red de seguridad estructural.
      className="fixed top-0 left-0 z-10 pointer-events-none"
      style={{
        // Movimiento: SOLO transform. framer-motion compila `x`/`y` a
        // `translateX()/translateY()`; `will-change` promueve la capa para que
        // el compositor no tenga que re-rasterizar 1200×1200 px por frame
        // (es el equivalente práctico del `translate3d(x, y, 0)` del spec).
        x: haloX,
        y: haloY,
        willChange: 'transform',
        width: RADIUS * 2,
        height: RADIUS * 2,
        // El div se centra en su propio origen: así el punto (x, y) del
        // transform ES el centro del gradiente, sin aritmética por evento.
        marginLeft: -RADIUS,
        marginTop: -RADIUS,
        opacity: PEAK_OPACITY,
      }}
    >
      {/* Las tres atmósferas, superpuestas y a tamaño completo. Cada gradiente
          es ESTÁTICO: se escribe una vez, en el montaje, y no se vuelve a tocar
          —ni por evento de puntero ni por el ciclo de color, que solo mueve
          `opacity`. Sin borde (§3): el degradado muere en `transparent`.
          Comparten el transform del padre, así que el halo se mueve como uno
          solo y solo su color respira. */}
      {ATMO_LAYERS.map(({ className, color }) => (
        <div
          key={className}
          className={`absolute inset-0 ${className}`}
          style={{
            backgroundImage: `radial-gradient(circle closest-side, ${color}, transparent)`,
          }}
        />
      ))}
    </motion.div>
  );
};

export default GlobalSpotlight;
