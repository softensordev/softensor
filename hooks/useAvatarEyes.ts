import { useEffect, useMemo, useRef, type RefObject } from 'react';
import {
  animate,
  useMotionValue,
  useSpring,
  type AnimationPlaybackControls,
  type MotionStyle,
} from 'framer-motion';
import { usePointerTracker } from './usePointerTracker';

// Movimiento de los ojos del avatar (DESIGN-SPEC §6, micro-interacciones #9,
// #10 y #11 de §2).
//
// INVARIANTE DEL SPEC: el desplazamiento de `g.pupil` está clampeado a ±2.5
// unidades de usuario del viewBox, SIEMPRE, venga de donde venga el valor.
// Lo único que cambia entre desktop y táctil es la FUENTE:
//   desktop (`hover:hover` + `pointer:fine`) → listener compartido de §4.
//   táctil  (`pointer:coarse`)               → mirada errante por timer.
//   reduce                                   → nada; ningún efecto se monta.
//
// UN SOLO PAR DE MOTIONVALUES PARA LOS DOS OJOS. Las dos pupilas comparten
// `x`/`y`: los ojos humanos son conjugados, mover cada uno por su cuenta lee
// como estrabismo. §6 pide desincronizar los AVATARES entre sí (intervalo
// aleatorio por avatar), no los ojos entre sí — y eso se cumple solo porque
// cada instancia de este hook tiene sus propios timers y springs.
//
// PRESUPUESTO DE RENDER (no negociable en esta etapa): este hook no llama a
// `setState` en ningún handler ni en ningún timer. Lo único que provoca un
// re-render de React es el cambio de `mode`, que ocurre una vez al hidratar.
// Todo el movimiento vive en MotionValues y en los springs de framer-motion,
// que son compositados y se detienen solos al llegar al destino. No hay ni un
// `requestAnimationFrame` escrito a mano.

/** Rango de desplazamiento de la pupila, en unidades del `viewBox` (§6). */
const RANGE = 2.5;

/**
 * Distancia de cursor (px CSS) a la que la pupila alcanza el tope del rango.
 * Con el avatar a ~90px, ±2.5 unidades de un viewBox de 120 son <2px reales:
 * el seguimiento se lee como "mirada", no como un ojo que rueda.
 */
const POINTER_REACH = 400;

const WANDER_MIN_MS = 2000;
const WANDER_MAX_MS = 4000;
const BLINK_MIN_MS = 4000;
const BLINK_MAX_MS = 7000;
const BLINK_DURATION_MS = 140;
const TAP_DURATION_MS = 300;

/** Spring suave: sigue al cursor con lag perceptible, sin rebote. */
const SPRING = { stiffness: 130, damping: 22, mass: 0.35 } as const;

// --- Easings: se LEEN de los tokens, no se redefinen -----------------------
// `styles/globals.css` es la fuente de verdad de `--ease-signal` y
// `--ease-standard`. framer-motion no entiende `cubic-bezier(...)` como string,
// así que hay que pasarle los cuatro números — pero sacándolos del token, no
// copiándolos. La lectura es UNA por token y por sesión (cache de módulo): un
// `getComputedStyle` al primer parpadeo, nunca dentro de un timer ni de un
// handler. Los fallbacks solo cubren el caso de que el token no exista.

type EaseToken = '--ease-signal' | '--ease-standard';
type Bezier = [number, number, number, number];

const EASE_FALLBACK: Record<EaseToken, Bezier> = {
  '--ease-signal': [0.16, 1, 0.3, 1],
  '--ease-standard': [0.4, 0, 0.2, 1],
};

const easeCache = new Map<EaseToken, Bezier>();

const cssEase = (token: EaseToken): Bezier => {
  const cached = easeCache.get(token);
  if (cached) return cached;

  let parsed = EASE_FALLBACK[token];
  if (typeof window !== 'undefined') {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(token)
      .trim();
    const match = raw.match(/^cubic-bezier\(([^)]+)\)$/);
    if (match) {
      const numbers = match[1].split(',').map((part) => Number(part.trim()));
      if (numbers.length === 4 && numbers.every(Number.isFinite)) {
        parsed = numbers as Bezier;
      }
    }
  }

  easeCache.set(token, parsed);
  return parsed;
};

const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

/** Desfase de cursor (px) → desplazamiento de pupila, clampeado a ±RANGE. */
const deflect = (distance: number): number =>
  clamp(distance / POINTER_REACH, -1, 1) * RANGE;

const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min);

export interface AvatarEyeMotion {
  /** Va al `<svg>` del avatar: de ahí sale el centro contra el que se mide. */
  svgRef: RefObject<SVGSVGElement | null>;
  /** Para `motion.g` de `g#eyes` — solo `scaleY` (parpadeo). */
  eyesStyle: MotionStyle;
  /** Para AMBOS `motion.g.pupil` — `x`/`y` compartidos. */
  pupilStyle: MotionStyle;
}

/**
 * @param expanded Estado de expansión de la tarjeta contenedora. Al pasar a
 *   `true`, las pupilas se orientan hacia el contenido que se despliega
 *   (§6, micro-interacción #11). Es un MotionValue puntual, no un listener.
 */
export const useAvatarEyes = (expanded: boolean): AvatarEyeMotion => {
  const { x: pointerX, y: pointerY, mode } = usePointerTracker();

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Destino de la mirada. Todas las fuentes (cursor, mirada errante, reacción
  // al tap) escriben AQUÍ; el spring es siempre el mismo y nunca se recablea.
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const blink = useMotionValue(1);

  const x = useSpring(targetX, SPRING);
  const y = useSpring(targetY, SPRING);

  /** Mientras la reacción al tap está viva, es dueña exclusiva del destino. */
  const holdRef = useRef(false);

  // --- Desktop: seguimiento del cursor -------------------------------------
  useEffect(() => {
    if (mode !== 'pointer') return;

    // El centro del avatar en coordenadas de viewport. Se cachea porque
    // `getBoundingClientRect()` fuerza layout: llamarlo en cada `pointermove`
    // es exactamente el error de performance que §4 quiere evitar. Se marca
    // sucio con scroll/resize y se recalcula, como mucho, una vez por evento
    // posterior a ese cambio.
    const center = { x: 0, y: 0 };
    let stale = true;

    const measure = (): void => {
      const el = svgRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      center.x = rect.left + rect.width / 2;
      center.y = rect.top + rect.height / 2;
      stale = false;
    };

    const invalidate = (): void => {
      stale = true;
    };

    const update = (): void => {
      if (holdRef.current) return;
      if (stale) measure();
      targetX.set(deflect(pointerX.get() - center.x));
      targetY.set(deflect(pointerY.get() - center.y));
    };

    measure();

    // El tracker escribe `x` y luego `y` por evento; suscribirse a ambos hace
    // que `update` corra dos veces, la primera con la `y` del evento anterior.
    // Es aritmética pura sobre un sub-frame y el valor final siempre es el
    // correcto — preferible a depender del orden interno del handler.
    const unsubscribeX = pointerX.on('change', update);
    const unsubscribeY = pointerY.on('change', update);
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate, { passive: true });

    return () => {
      unsubscribeX();
      unsubscribeY();
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      targetX.set(0);
      targetY.set(0);
    };
  }, [mode, pointerX, pointerY, targetX, targetY]);

  // --- Táctil: mirada errante ----------------------------------------------
  // `setTimeout` ENCADENADO, no `setInterval` ni `rAF` (§6). Encadenado porque
  // el intervalo se re-sortea en cada salto: dos avatares montados en el mismo
  // frame divergen desde el primer tick y no vuelven a sincronizarse.
  // El recorrido entre posiciones NO lo interpola este timer — lo produce el
  // spring sobre `transform`, que es lo compositado.
  useEffect(() => {
    if (mode !== 'wander') return;

    let timer: ReturnType<typeof setTimeout>;

    const schedule = (): void => {
      timer = setTimeout(() => {
        if (!holdRef.current) {
          // Punto uniforme dentro del disco de radio RANGE: `sqrt` corrige el
          // sesgo hacia el centro que da un radio uniforme.
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.sqrt(Math.random()) * RANGE;
          targetX.set(Math.cos(angle) * radius);
          targetY.set(Math.sin(angle) * radius);
        }
        schedule();
      }, randomBetween(WANDER_MIN_MS, WANDER_MAX_MS));
    };

    schedule();

    return () => {
      clearTimeout(timer);
      targetX.set(0);
      targetY.set(0);
    };
  }, [mode, targetX, targetY]);

  // --- Parpadeo (ambos modos) ----------------------------------------------
  // Independiente de la fuente de posición de las pupilas, por eso vive en su
  // propio efecto y su propio MotionValue.
  useEffect(() => {
    if (mode === 'off') return;

    let timer: ReturnType<typeof setTimeout>;
    let controls: AnimationPlaybackControls | null = null;

    const schedule = (): void => {
      timer = setTimeout(() => {
        controls = animate(blink, [1, 0.08, 1], {
          duration: BLINK_DURATION_MS / 1000,
          times: [0, 0.5, 1],
          ease: cssEase('--ease-standard'),
        });
        schedule();
      }, randomBetween(BLINK_MIN_MS, BLINK_MAX_MS));
    };

    schedule();

    return () => {
      clearTimeout(timer);
      controls?.stop();
      blink.set(1);
    };
  }, [mode, blink]);

  // --- Reacción al tap (§6, #11) -------------------------------------------
  // La tarjeta se expande hacia abajo, así que la mirada baja mientras dura la
  // expansión y luego suelta el control. `holdRef` existe porque en desktop el
  // seguimiento del cursor pisaría este destino en el siguiente `pointermove`.
  useEffect(() => {
    if (mode === 'off' || !expanded) return;

    holdRef.current = true;

    const options = {
      duration: TAP_DURATION_MS / 1000,
      ease: cssEase('--ease-signal'),
    };
    const controlsX = animate(targetX, 0, options);
    const controlsY = animate(targetY, RANGE, options);
    const release = setTimeout(() => {
      holdRef.current = false;
    }, TAP_DURATION_MS);

    return () => {
      controlsX.stop();
      controlsY.stop();
      clearTimeout(release);
      holdRef.current = false;
    };
  }, [expanded, mode, targetX, targetY]);

  // `transform-box`/`transform-origin` viajan aquí y no solo en el SVG porque
  // son requisito del transform: sin `fill-box`, el `translate` se referiría al
  // origen del viewBox y las pupilas saldrían de la cara. framer-motion no los
  // pisa: solo escribe `transform-origin` si se le pasan `originX`/`originY`,
  // y no se le pasan.
  const eyesStyle = useMemo<MotionStyle>(
    () => ({ scaleY: blink, transformBox: 'fill-box', transformOrigin: 'center' }),
    [blink],
  );

  const pupilStyle = useMemo<MotionStyle>(
    () => ({ x, y, transformBox: 'fill-box', transformOrigin: 'center' }),
    [x, y],
  );

  return { svgRef, eyesStyle, pupilStyle };
};
