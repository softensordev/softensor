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

/** Radio del halo en px (§3: ~600). El div mide 2×RADIUS y el gradiente
 *  `closest-side` hace que el radio visible sea exactamente RADIUS. */
const RADIUS = 600;

/** Opacidad pico (§3: 4–6 %). Va en el elemento, no en el color: así 3.4c
 *  puede apilar capas de atmósfera y cruzarlas por `opacity` sin tocar el
 *  gradiente (mismo patrón que `.atmo-1/2/3` de `styles/globals.css`). */
const PEAK_OPACITY = 0.05;

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
      // `-z-10`: por debajo del contenido (§3). Un z-index NEGATIVO no es una
      // preferencia estética — pinta en la capa que va justo encima del fondo
      // del canvas y por debajo de los fondos de bloque y del texto, así que
      // el halo no puede taparlos ni interceptar un clic ni aunque
      // `pointer-events` fallara. `Section` deja su fondo transparente
      // (mismo color que el body) precisamente para que esta capa se vea.
      className="fixed top-0 left-0 -z-10 pointer-events-none"
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
        // ESTÁTICO. Se escribe una vez, en el montaje, y no se vuelve a tocar.
        // Sin borde (§3): el degradado muere en `transparent`.
        // 3.4c conectará este color al ciclo de atmósfera (cross-fade
        // teal→cian→azul de `--color-atmo-1/2/3`, §1). Hasta entonces queda
        // fijo en `--color-atmo-1`, que es el primer paso de ese ciclo.
        backgroundImage:
          'radial-gradient(circle closest-side, var(--color-atmo-1), transparent)',
        opacity: PEAK_OPACITY,
      }}
    />
  );
};

export default GlobalSpotlight;
