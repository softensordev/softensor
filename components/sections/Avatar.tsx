import React from 'react';
import { TeamMember } from '../../config/team';

// Avatar SVG de los socios (DESIGN-SPEC §5).
//
// ESTA ETAPA (3.3c-1): SVG 100% ESTÁTICO. Sin framer-motion, sin listeners,
// sin timers. Se renderiza en el HTML estático; no depende de JS (SSR-friendly).
//
// Las capas están separadas en grupos A PROPÓSITO aunque hoy ninguna se anime:
// bg / hair / face / brows / eyes (con un `g.pupil` POR OJO) / mouth.
// La sub-etapa 3.4 le añadirá a `g.pupil` seguimiento de cursor, mirada errante
// y parpadeo vía `transform` con framer-motion (§6). Por eso las pupilas son
// grupos propios y no `<circle>` sueltos: 3.4 solo tiene que envolverlos, no
// rediseñar el asset. En reposo van centradas, sin `transform`.
//
// El asset es un PLACEHOLDER GEOMÉTRICO (§5); la ilustración final llega después.
//
// Los ids se prefijan con `uid` (el id del socio) porque la página monta dos
// avatares: `id="eyes"` duplicado sería HTML inválido y rompería cualquier
// `querySelector` de 3.4. El nombre de capa que exige el spec va además en
// `className`, que sí puede repetirse (`g.pupil` es literalmente eso).

interface AvatarProps {
  /** Tokens de color del integrante (`config/team.ts` → `avatar`). */
  avatar: TeamMember['avatar'];
  /** Prefijo único de ids dentro del documento; se usa `member.id`. */
  uid: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ avatar, uid, className = '' }) => {
  const clipId = `${uid}-avatar-clip`;

  return (
    <svg
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

      {/* Un `g.pupil` por ojo, centrado y sin transform (3.4 los mueve). */}
      <g id={`${uid}-eyes`} className="eyes">
        <ellipse cx="52" cy="68" rx="6.5" ry="5.5" fill="var(--color-text)" />
        <ellipse cx="68" cy="68" rx="6.5" ry="5.5" fill="var(--color-text)" />
        <g className="pupil">
          <circle cx="52" cy="68" r="2.8" fill="var(--color-bg)" />
        </g>
        <g className="pupil">
          <circle cx="68" cy="68" r="2.8" fill="var(--color-bg)" />
        </g>
      </g>

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

export default Avatar;
