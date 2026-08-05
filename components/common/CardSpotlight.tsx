import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePointerTracker } from '../../hooks/usePointerTracker';

// Halo de tarjeta (DESIGN-SPEC §3, micro-interacción #8 de §2).
//
// Misma prohibición que el halo global y por la misma razón: gradiente
// ESTÁTICO, movido solo por `transform`. Nada de `background-position`.
//
// Se diferencia del global por ESCALA y NITIDEZ, nunca por color (decisión de
// Fase 2, §3): la mitad de radio, ~3× la opacidad, borde perceptible y spring
// rápido. Su color es el acento teal FIJO (`--color-accent`): no hereda la
// atmósfera, porque la tarjeta es superficie de contenido, no fondo.
//
// NO AÑADE LISTENERS. Deriva la posición relativa a la tarjeta restando el
// origen cacheado de la caja a los MotionValues globales del tracker (§4). Con
// N tarjetas siguen existiendo N suscripciones aritméticas, pero UN solo
// `pointermove`. `getBoundingClientRect()` no se llama por evento: se cachea y
// se invalida con `scroll`/`resize`, igual que el centro del avatar en
// `useAvatarEyes`.

/** Radio del halo en px (§3: ~300), la mitad del global. */
const RADIUS = 300;

/** Opacidad pico (§3: 14–18 %). Se multiplica por la opacidad de la capa
 *  contenedora, que es 0 mientras el cursor no está sobre la tarjeta. */
const PEAK_OPACITY = 0.16;

/**
 * Spring RÁPIDO (§3): sigue al cursor de cerca. ω = √(k/m) ≈ 26 rad/s, ~4×
 * el del halo global; ζ ≈ 1,3, sin rebote. El contraste entre este y el lag
 * del global es lo que hace legibles los dos niveles del spotlight.
 */
const SPRING = { stiffness: 420, damping: 40, mass: 0.6 } as const;

/**
 * Halo teal de una tarjeta. Lo monta `Card` con `spotlight`, nunca se usa
 * suelto: depende de que su contenedor sea `relative isolate` (ver `Card`).
 *
 * Como el global, no se monta en táctil ni bajo `reduce`, y en el primer
 * render —servidor y cliente— tampoco: sin mismatch de hidratación.
 */
const CardSpotlight: React.FC = () => {
  const { x: pointerX, y: pointerY, mode } = usePointerTracker();

  const clipRef = useRef<HTMLDivElement | null>(null);

  // Posición del cursor RELATIVA a la tarjeta. El spring lee de aquí; nada más
  // escribe en estos valores.
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);

  const haloX = useSpring(targetX, SPRING);
  const haloY = useSpring(targetY, SPRING);

  useEffect(() => {
    if (mode !== 'pointer') return;

    // Origen de la tarjeta en coordenadas de viewport. Cacheado: leerlo por
    // `pointermove` fuerza layout y es exactamente el costo que §4 evita.
    const origin = { x: 0, y: 0 };
    let stale = true;

    const measure = (): void => {
      const el = clipRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      origin.x = rect.left;
      origin.y = rect.top;
      stale = false;
    };

    const invalidate = (): void => {
      stale = true;
    };

    const update = (): void => {
      if (stale) measure();
      targetX.set(pointerX.get() - origin.x);
      targetY.set(pointerY.get() - origin.y);
    };

    measure();
    update();
    // Sin el `jump`, el halo entraría deslizándose desde la esquina superior
    // izquierda la primera vez que el cursor toca la tarjeta. Coloca el spring
    // en su destino sin animar y con velocidad 0.
    haloX.jump(targetX.get());
    haloY.jump(targetY.get());

    const unsubscribeX = pointerX.on('change', update);
    const unsubscribeY = pointerY.on('change', update);
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate, { passive: true });

    return () => {
      unsubscribeX();
      unsubscribeY();
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
    };
  }, [mode, pointerX, pointerY, targetX, targetY, haloX, haloY]);

  if (mode !== 'pointer') return null;

  return (
    // Capa de recorte. El `overflow-hidden` que pide §3 vive AQUÍ y no en la
    // `Card`: ponerlo en la tarjeta recortaría también el anillo de
    // `:focus-visible` de su botón (`outline-offset: 2px`), que es una
    // regresión de accesibilidad a cambio de nada.
    // `-z-10` dentro del `isolate` de la Card: por encima del fondo de la
    // tarjeta y por debajo de su texto.
    // La opacidad es la compuerta de proximidad: sin ella, un halo de 300 px
    // se derramaría desde la tarjeta vecina. Se anima `opacity` — compositada
    // — y el gate es CSS puro, sin estado de React por hover.
    <div
      ref={clipRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-lg opacity-0 transition-opacity duration-200 ease-standard group-hover:opacity-100"
    >
      <motion.div
        className="absolute top-0 left-0"
        style={{
          x: haloX,
          y: haloY,
          willChange: 'transform',
          width: RADIUS * 2,
          height: RADIUS * 2,
          marginLeft: -RADIUS,
          marginTop: -RADIUS,
          // ESTÁTICO, como el global. El borde "perceptible" de §3 sale de que
          // el color se sostiene hasta el 30 % del radio antes de caer, en vez
          // del desvanecido plano del halo global.
          backgroundImage:
            'radial-gradient(circle closest-side, var(--color-accent) 0%, var(--color-accent) 30%, transparent 100%)',
          opacity: PEAK_OPACITY,
        }}
      />
    </div>
  );
};

export default CardSpotlight;
