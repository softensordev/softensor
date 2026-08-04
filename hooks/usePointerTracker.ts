import { useEffect, useState } from 'react';
import { motionValue, type MotionValue } from 'framer-motion';

// Listener compartido de puntero (DESIGN-SPEC §4).
//
// CONTRATO DURO DEL SPEC, y la razón de que este archivo exista:
//   - UN solo `pointermove`, a nivel de `window`, con `{ passive: true }`.
//   - COMPARTIDO entre todos los consumidores. Hoy son las pupilas de los dos
//     avatares (§6); en 3.4b se suma el halo global del spotlight (§3). Tres
//     consumidores, un listener.
//   - CERO `setState` por evento. El handler solo escribe en dos MotionValues,
//     que viven FUERA del ciclo de render de React: nada se re-renderiza al
//     mover el ratón.
//   - No se suscribe bajo `prefers-reduced-motion: reduce` ni en táctil. No es
//     "desactivado con el listener puesto": el listener no llega a existir.
//
// POR QUÉ SINGLETON DE MÓDULO Y NO UN CONTEXT
// Un React Context daría lo mismo (un listener, N consumidores) a cambio de un
// Provider que hay que montar en `_app.tsx` y de que cada consumidor tenga que
// estar debajo de él. El singleton de módulo lo consigue sin acoplar el árbol:
// `usePointerTracker()` funciona desde cualquier componente, y el refcount de
// abajo garantiza que el listener se crea con el PRIMER consumidor y se
// desmonta con el ÚLTIMO. Los MotionValues son mutables por diseño (framer-
// motion los usa exactamente así), así que compartirlos a nivel de módulo no
// introduce estado compartido de React.
//
// Nota SSR: `motionValue()` no toca el DOM, así que crear los singletons en el
// import es seguro en el servidor. En Next con pages router el módulo se evalúa
// una vez por proceso; el estado que guarda (posición del cursor) es efímero y
// solo se escribe en cliente.

/** Fuente de movimiento resuelta tras la hidratación. */
export type PointerMode =
  /** `prefers-reduced-motion: reduce` → no se monta NADA. */
  | 'off'
  /** Desktop con puntero fino: hay cursor que seguir. */
  | 'pointer'
  /** Táctil / puntero grueso: no hay cursor; el consumidor decide su fuente. */
  | 'wander';

const QUERY_FINE = '(hover: hover) and (pointer: fine)';
const QUERY_REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * Posición del cursor en coordenadas de viewport (`clientX` / `clientY`).
 * Son los MISMOS objetos para todos los consumidores, por diseño.
 */
const pointerX = motionValue(0);
const pointerY = motionValue(0);

/** Consumidores activos en modo `pointer`. El listener existe sii es > 0. */
let subscribers = 0;
let detach: (() => void) | null = null;

const attach = (): void => {
  const onPointerMove = (event: PointerEvent): void => {
    // Lo único que ocurre por evento. Sin lecturas de layout, sin setState.
    pointerX.set(event.clientX);
    pointerY.set(event.clientY);
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  detach = () => window.removeEventListener('pointermove', onPointerMove);
};

const resolveMode = (): PointerMode => {
  // `matchMedia` falta en el servidor y en runtimes de test sin jsdom: 'off' es
  // el reposo seguro (sin movimiento) en vez de asumir desktop.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'off';
  }
  if (window.matchMedia(QUERY_REDUCED).matches) return 'off';
  return window.matchMedia(QUERY_FINE).matches ? 'pointer' : 'wander';
};

/**
 * Modo de movimiento del dispositivo, reevaluado si cambian las media queries
 * (el usuario activa "reducir movimiento", conecta un ratón a una tablet…).
 *
 * Devuelve `'off'` en el primer render —servidor y cliente— a propósito: el
 * HTML estático queda sin movimiento y la hidratación no puede desalinearse.
 * El modo real entra en el efecto, ya en cliente.
 */
export const usePointerMode = (): PointerMode => {
  const [mode, setMode] = useState<PointerMode>('off');

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const queries = [
      window.matchMedia(QUERY_REDUCED),
      window.matchMedia(QUERY_FINE),
    ];
    // React descarta el re-render si el valor no cambia, así que resuscribir
    // ambas queries al mismo handler no cuesta renders de más.
    const sync = () => setMode(resolveMode());

    sync();
    queries.forEach((query) => query.addEventListener('change', sync));
    return () => {
      queries.forEach((query) => query.removeEventListener('change', sync));
    };
  }, []);

  return mode;
};

export interface PointerTracker {
  /** `clientX` del puntero. Singleton compartido. */
  x: MotionValue<number>;
  /** `clientY` del puntero. Singleton compartido. */
  y: MotionValue<number>;
  /** Modo resuelto. En `'pointer'` (y solo ahí) `x`/`y` están vivos. */
  mode: PointerMode;
}

/**
 * Consumidor del listener compartido. Llamarlo desde N componentes sigue
 * produciendo UN solo `pointermove`: el segundo consumidor (el spotlight de
 * 3.4b) solo incrementa el refcount.
 *
 * En modo `'wander'` u `'off'` devuelve los MotionValues igualmente (quietos en
 * 0) para no obligar al consumidor a ramificar tipos; lo que cambia es que no
 * hay listener detrás.
 */
export const usePointerTracker = (): PointerTracker => {
  const mode = usePointerMode();

  useEffect(() => {
    if (mode !== 'pointer') return;

    subscribers += 1;
    if (subscribers === 1) attach();

    return () => {
      subscribers -= 1;
      if (subscribers === 0 && detach) {
        detach();
        detach = null;
      }
    };
  }, [mode]);

  return { x: pointerX, y: pointerY, mode };
};
