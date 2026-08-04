import React from 'react';
import { motion } from 'framer-motion';
import { TeamMember } from '../../config/team';
import { useAvatarEyes, type AvatarEyeMotion } from '../../hooks/useAvatarEyes';

// Avatar SVG de los socios (DESIGN-SPEC §5 y §6).
//
// ESTADO TRANSITORIO DELIBERADO: hay DOS assets conviviendo.
//   - Luis  → ilustración real (diseñada en Claude Design), integrada aquí.
//   - David → placeholder geométrico, hasta que haya foto + visto bueno suyo.
// El despacho vive en `AVATAR_SHAPES` (abajo): un mapa `uid → componente`, con
// el geométrico como fallback. Añadir el avatar de David = añadir su SVG y una
// entrada al mapa. No hay que reescribir nada.
//
// ESTA ETAPA (3.4a): los ojos cobran movimiento. El resto del SVG sigue siendo
// estático y se renderiza igual en el HTML del servidor.
//
// DÓNDE VIVE EL MOVIMIENTO, Y POR QUÉ AQUÍ
// El estado y los efectos viven en `hooks/useAvatarEyes.ts`, y `Avatar` —que
// hasta ahora era un despachador puro— es el ÚNICO que llama al hook. Los
// assets (`IllustratedLuis`, `GeometricAvatar`) siguen siendo presentacionales:
// solo reciben estilos ya calculados y se los cuelgan a sus `motion.g`.
// Las tres alternativas y por qué se descartaron:
//   - Movimiento dentro de cada asset: duplicaría timers y springs por asset y
//     obligaría a reimplementarlo en el avatar de David cuando llegue.
//   - Wrapper `<AnimatedAvatar>` alrededor del `<svg>`: no sirve. Lo que hay
//     que animar son nodos INTERNOS del SVG (`g#eyes`, `g.pupil`); un wrapper
//     externo no los alcanza sin `querySelector`, que es justo lo que un
//     componente de React no debe hacer.
//   - Sub-componente `<AnimatedPupils>` que renderice los ojos: tendría que
//     conocer la geometría de CADA asset (los ojos de Luis y los del
//     placeholder están en coordenadas distintas), o recibirla por props. Es el
//     mismo acoplamiento, con un componente más.
// Un hook en `Avatar` + estilos por props cumple lo que se pedía: (a) el
// placeholder de David hereda el movimiento sin tocarlo —sus `g.pupil` ya
// existen—, (b) el SSR no cambia (ver abajo), (c) `TeamMemberCard` solo tiene
// que pasar `expanded`.
//
// SSR: `motion.g` con MotionValues en su valor por defecto (x=0, y=0, scaleY=1)
// emite `transform: none`. El HTML estático sale con las pupilas centradas y
// sin transform real, igual que antes de esta etapa, y el primer render de
// cliente es idéntico (el modo de movimiento se resuelve en un efecto) → no hay
// salto visual ni mismatch de hidratación.
//
// Las capas siguen separadas en grupos: bg / hair / face / brows / eyes (con un
// `g.pupil` POR OJO) / mouth. Solo `g#eyes` se anima en esta fase (§5); el
// resto está separado para poder animarlo cuando toque, sin rediseñar el SVG.
//
// Los ids se prefijan con `uid` (el id del socio) porque la página monta dos
// avatares: `id="eyes"` duplicado sería HTML inválido. El nombre de capa que
// exige el spec va además en `className`, que sí puede repetirse (`g.pupil` es
// literalmente eso).

interface AvatarProps {
  /** Tokens de color del integrante (`config/team.ts` → `avatar`). */
  avatar: TeamMember['avatar'];
  /** Prefijo único de ids dentro del documento; se usa `member.id`. */
  uid: string;
  className?: string;
  /**
   * Estado de la tarjeta contenedora. Dispara la reacción al tap de §6: al
   * expandirse, la mirada baja hacia el contenido que se despliega.
   * Opcional para que el avatar siga sirviendo fuera de una tarjeta.
   */
  expanded?: boolean;
}

/**
 * Contrato que cumple cada asset concreto: los props públicos de identidad más
 * los estilos animados que `Avatar` ya calculó. El asset no sabe de dónde salen
 * ni si hay movimiento montado — solo los aplica.
 */
type AvatarShape = React.FC<
  Required<Pick<AvatarProps, 'avatar' | 'uid'>> & {
    className: string;
  } & AvatarEyeMotion
>;

// Los colores viajan como CUSTOM PROPERTIES, no como atributos `fill`.
//
// La ilustración está parametrizada con `var(--avatar-*, fallback)` en decenas
// de nodos; pintarla por atributo obligaría a rociar props por todo el árbol.
// Con variables se setean UNA vez en el `<svg>` y heredan. Ese es también el
// motivo de que el SVG vaya INLINE y no en un `<img>`: una custom property del
// documento no cruza la frontera de un documento SVG externo.
//
// `--avatar-skin-shadow` NO viene de `config/team.ts`: es la sombra del tabique
// nasal, derivada de la piel, no un token de identidad del socio. Se deja caer
// al fallback del propio SVG (#b98461). Si algún día la piel de un socio cambia,
// hay que añadirle su sombra aquí, no dejarla desincronizada.
const colorVars = (avatar: AvatarProps['avatar']): React.CSSProperties =>
  ({
    '--avatar-skin': avatar.skin,
    '--avatar-hair': avatar.hair,
    '--avatar-accent': avatar.accent,
  }) as React.CSSProperties;

// `transform-box: fill-box` + `transform-origin: center` ya NO se declaran aquí:
// los trae `eyesStyle`/`pupilStyle` desde `useAvatarEyes`, junto al transform que
// los necesita. Siguen siendo requisito —sin `fill-box` el `translate` se
// referiría al origen del viewBox y las pupilas saldrían de la cara—, solo que
// ahora viven pegados a su motivo.

// ---------------------------------------------------------------------------
// Luis — ilustración real (Claude Design). Reemplaza al placeholder geométrico.
// ---------------------------------------------------------------------------
// Decorativo: `role="presentation"` + `aria-hidden`. El SVG original traía
// `role="img"` y `aria-label="Avatar socio 1"`; se retiran a propósito porque en
// la tarjeta el nombre del socio ya está en texto y el avatar no aporta
// información nueva — anunciarlo sería ruido duplicado para un lector.
const IllustratedLuis: AvatarShape = ({
  avatar,
  uid,
  className,
  svgRef,
  eyesStyle,
  pupilStyle,
}) => (
  <svg
    ref={svgRef}
    viewBox="0 0 120 120"
    className={className}
    style={colorVars(avatar)}
    role="presentation"
    aria-hidden="true"
    focusable="false"
  >
    <g id={`${uid}-bg`} className="bg">
      <circle cx="60" cy="60" r="58" fill="#0d1112" />
      <circle
        cx="60"
        cy="60"
        r="57"
        fill="none"
        style={{ stroke: 'var(--avatar-accent, #00C2A8)' }}
        strokeWidth="1"
        opacity="0.35"
      />
    </g>

    {/* El pelo va en dos capas (detrás y delante de la cara); la de atrás
        también hace de silueta de cabeza. */}
    <g
      id={`${uid}-hair-back`}
      className="hair-back"
      style={{ fill: 'var(--avatar-hair, #241a14)' }}
    >
      <circle cx="60" cy="20" r="14" />
      <circle cx="44" cy="22" r="12" />
      <circle cx="76" cy="22" r="12" />
      <circle cx="33" cy="33" r="12" />
      <circle cx="87" cy="33" r="12" />
      <circle cx="29" cy="48" r="12" />
      <circle cx="91" cy="48" r="12" />
      <circle cx="30" cy="63" r="11" />
      <circle cx="90" cy="63" r="11" />
      <circle cx="34" cy="76" r="10" />
      <circle cx="86" cy="76" r="10" />
      <circle cx="41" cy="85" r="9" />
      <circle cx="79" cy="85" r="9" />
    </g>

    <g
      id={`${uid}-face`}
      className="face"
      style={{ fill: 'var(--avatar-skin, #cf9c78)' }}
    >
      <rect x="52" y="84" width="16" height="18" rx="6" />
      <ellipse cx="37" cy="63" rx="4" ry="6" />
      <ellipse cx="83" cy="63" rx="4" ry="6" />
      <path d="M60,33 C46,33 37,44 37,60 C37,78 48,90 60,90 C72,90 83,78 83,60 C83,44 74,33 60,33 Z" />
      <path
        style={{ fill: 'var(--avatar-skin-shadow, #b98461)' }}
        opacity="0.55"
        d="M60,61 C57,61 56,66 57,69 C58,71 62,71 63,69 C64,66 63,61 60,61 Z"
      />
    </g>

    <g
      id={`${uid}-brows`}
      className="brows"
      style={{ fill: 'var(--avatar-hair, #241a14)' }}
    >
      <path d="M42,51 Q49,48 56,51 L56,53 Q49,50.5 42,53 Z" />
      <path d="M64,51 Q71,48 78,51 L78,53 Q71,50.5 64,53 Z" />
    </g>

    {/* Un `g.pupil` por ojo (§5). El blanco del ojo NO se mueve; las pupilas
        se desplazan dentro de él en el rango ±2.5 del viewBox, que con
        `rx=6`/`r=3.1` las mantiene siempre dentro de la esclerótica.
        Las dos comparten `pupilStyle` a propósito: ojos conjugados. */}
    <motion.g id={`${uid}-eyes`} className="eyes" style={eyesStyle}>
      <ellipse cx="49" cy="58" rx="6" ry="4" fill="#f4f3ef" />
      <ellipse cx="71" cy="58" rx="6" ry="4" fill="#f4f3ef" />
      <motion.g id={`${uid}-pupil-left`} className="pupil" style={pupilStyle}>
        <circle cx="49" cy="58" r="3.1" fill="#5a3d2b" />
        <circle cx="49" cy="58" r="1.6" fill="#1a1310" />
        <circle cx="50.2" cy="56.9" r="0.8" fill="#ffffff" />
      </motion.g>
      <motion.g id={`${uid}-pupil-right`} className="pupil" style={pupilStyle}>
        <circle cx="71" cy="58" r="3.1" fill="#5a3d2b" />
        <circle cx="71" cy="58" r="1.6" fill="#1a1310" />
        <circle cx="72.2" cy="56.9" r="0.8" fill="#ffffff" />
      </motion.g>
    </motion.g>

    <g id={`${uid}-mouth`} className="mouth">
      <path
        d="M52,75 Q60,79 68,75"
        fill="none"
        stroke="#9a5b52"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>

    <g
      id={`${uid}-facial-hair`}
      className="facial-hair"
      style={{ fill: 'var(--avatar-hair, #241a14)' }}
    >
      <path
        opacity="0.85"
        d="M52,73 Q56,72 60,73.5 Q64,72 68,73 Q64,74.5 60,74.2 Q56,74.5 52,73 Z"
      />
      <ellipse cx="60" cy="79" rx="2.4" ry="1.6" opacity="0.8" />
      {/* Perilla. El `d` original venía roto: terminaba en `Q57.5,89 60,91
          Q56,83 Z`, con un `Q` de UN solo par de coordenadas (necesita dos) y
          el punto 60,91 repetido. Un segmento inválido corta el render del
          path en ese punto (SVG 1.1 §8.3.1), así que la perilla salía como
          medio triángulo abierto. Corregido al cierre simétrico evidente:
          la última curva vuelve al punto inicial 56,83. Si el diseño quería
          otra cosa, regenerar el asset y reemplazar SOLO este `d`. */}
      <path opacity="0.9" d="M56,83 Q60,82.4 64,83 Q62.5,89 60,91 Q57.5,89 56,83 Z" />
      <path opacity="0.45" d="M52,81 Q54,85 57,88 L56,84 Q54,82.5 52,81 Z" />
      <path opacity="0.45" d="M68,81 Q66,85 63,88 L64,84 Q66,82.5 68,81 Z" />
    </g>

    <g
      id={`${uid}-hair-front`}
      className="hair-front"
      style={{ fill: 'var(--avatar-hair, #241a14)' }}
    >
      <circle cx="60" cy="25" r="11" />
      <circle cx="46" cy="28" r="9" />
      <circle cx="74" cy="28" r="9" />
      <circle cx="38" cy="38" r="8" />
      <circle cx="82" cy="38" r="8" />
      <circle cx="52" cy="32" r="7" />
      <circle cx="68" cy="32" r="7" />
      <circle cx="34" cy="49" r="7" />
      <circle cx="86" cy="49" r="7" />
    </g>

    {/* Capa opcional del spec (§5). Vacía hoy; existe para no reabrir el asset
        el día que haya gafas o audífonos. */}
    <g id={`${uid}-accessory`} className="accessory" />
  </svg>
);

// ---------------------------------------------------------------------------
// Placeholder geométrico (§5) — el asset por defecto mientras no haya ilustración.
// Hoy lo usa David. Se conserva TAL CUAL estaba en 3.3c-1.
// ---------------------------------------------------------------------------
const GeometricAvatar: AvatarShape = ({
  avatar,
  uid,
  className,
  svgRef,
  eyesStyle,
  pupilStyle,
}) => {
  const clipId = `${uid}-avatar-clip`;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 120"
      className={className}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="60" cy="60" r="54" />
        </clipPath>
      </defs>

      {/* Fondo + hombros. El acento del integrante vive aquí, decorativo y a
          baja opacidad: no debe leerse como el señalizador de acción de §1. */}
      <g id={`${uid}-bg`} className="bg">
        <circle cx="60" cy="60" r="54" fill="var(--color-bg)" />
        <circle
          cx="60"
          cy="60"
          r="53"
          fill="none"
          stroke={avatar.accent}
          strokeWidth="2"
          opacity="0.35"
        />
        <ellipse
          cx="60"
          cy="124"
          rx="40"
          ry="30"
          fill={avatar.accent}
          opacity="0.3"
          clipPath={`url(#${clipId})`}
        />
      </g>

      <g id={`${uid}-face`} className="face">
        <rect x="53" y="82" width="14" height="14" fill={avatar.skin} />
        <rect x="39" y="30" width="42" height="56" rx="21" fill={avatar.skin} />
      </g>

      <g id={`${uid}-hair`} className="hair">
        <path d="M37.5 51a22.5 22.5 0 0 1 45 0z" fill={avatar.hair} />
      </g>

      <g id={`${uid}-brows`} className="brows" fill={avatar.hair} opacity="0.8">
        <rect x="45.5" y="59" width="13" height="2.6" rx="1.3" />
        <rect x="61.5" y="59" width="13" height="2.6" rx="1.3" />
      </g>

      {/* Un `g.pupil` por ojo. Recibe el MISMO movimiento que la ilustración
          de Luis sin código propio: esa era la prueba de que el hook vive en
          `Avatar` y no dentro de cada asset.
          Dos correcciones de 3.4a sobre lo que había: (1) a estos grupos les
          faltaba `transform-box: fill-box` —solo lo tenía la ilustración—, sin
          el cual el `translate` se referiría al origen del viewBox; ahora lo
          trae `pupilStyle`. (2) llevan id prefijado como el resto de capas: sin
          él, los dos avatares no eran distinguibles por id. */}
      <motion.g id={`${uid}-eyes`} className="eyes" style={eyesStyle}>
        <ellipse cx="52" cy="68" rx="6.5" ry="5.5" fill="var(--color-text)" />
        <ellipse cx="68" cy="68" rx="6.5" ry="5.5" fill="var(--color-text)" />
        <motion.g id={`${uid}-pupil-left`} className="pupil" style={pupilStyle}>
          <circle cx="52" cy="68" r="2.8" fill="var(--color-bg)" />
        </motion.g>
        <motion.g id={`${uid}-pupil-right`} className="pupil" style={pupilStyle}>
          <circle cx="68" cy="68" r="2.8" fill="var(--color-bg)" />
        </motion.g>
      </motion.g>

      <g id={`${uid}-mouth`} className="mouth">
        <path
          d="M53 79q7 5.5 14 0"
          fill="none"
          stroke="var(--color-text-subtle)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

// Registro de assets ilustrados. Quien no esté aquí cae al geométrico.
// Avatar de David → añadir `david: IllustratedDavid` cuando exista.
const AVATAR_SHAPES: Record<string, AvatarShape> = {
  luis: IllustratedLuis,
};

const Avatar: React.FC<AvatarProps> = ({
  avatar,
  uid,
  className = '',
  expanded = false,
}) => {
  const Shape = AVATAR_SHAPES[uid] ?? GeometricAvatar;
  // Una llamada por avatar montado → timers, springs e intervalos propios. Los
  // dos socios no se sincronizan porque no comparten nada más que el listener
  // de puntero, que es de solo lectura.
  const eyeMotion = useAvatarEyes(expanded);

  return <Shape avatar={avatar} uid={uid} className={className} {...eyeMotion} />;
};

export default Avatar;
