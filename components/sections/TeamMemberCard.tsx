import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import Card from '../common/Card';
import Avatar from './Avatar';
import { TeamMember } from '../../config/team';

interface TeamMemberCardProps {
  member: TeamMember;
}

// Tarjeta de un socio con EXPANSIÓN APILADA (DESIGN-SPEC §7, micro-interacción
// #5 de §2).
//
// Colapsada: avatar + nombre + disciplina + rol + tagline.
// Expandida: además, bio + chips de stack (+ foto, si algún día existe).
//
// Mecánica: el contenedor del panel anima `grid-template-rows` 0fr→1fr, 300ms,
// `--ease-signal`. NO `height: auto` (no animable) ni `max-height` (easing
// irregular: el tiempo se reparte sobre una altura ficticia). El contenido va
// dentro de un hijo con `overflow: hidden`, que es lo que recorta durante la
// transición.
//
// El disparador es CLIC, no hover: el tráfico es mayormente móvil y en táctil
// el hover no existe (o queda pegado tras el tap).
//
// `prefers-reduced-motion: reduce` lo cubre `styles/globals.css` vía el
// atributo `data-expand` (`transition-duration: 0ms !important`) → el toggle
// es instantáneo, no desaparece. Por eso la transición se declara en CSS y no
// con framer-motion: no hay estado de animación que gestionar en JS.
const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);

  const panelId = `${member.id}-bio-panel`;

  return (
    <Card className="h-full">
      {/* Sin `space-y-*` en este contenedor: el panel colapsado sigue siendo
          una caja (de altura 0), y el gap del stack le dejaría un hueco muerto
          al pie de la tarjeta cerrada. El espaciado va DENTRO de cada bloque. */}
      <div>
        {/* Disparador: <button> real, no un div con handlers. Trae Enter/Space,
            rol y foco de fábrica; el anillo lo pinta el :focus-visible global. */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="block w-full text-left cursor-pointer"
        >
          <div className="space-y-4">
            <Avatar
              avatar={member.avatar}
              uid={member.id}
              className="w-20 h-20 md:w-24 md:h-24"
            />

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                {/* Nombre propio: no pasa por i18n. */}
                <h3 className="text-xl md:text-2xl font-bold text-text">
                  {member.name}
                </h3>
                {/* Disciplina: reutiliza el bloque preexistente `team.roles`. */}
                <p className="text-sm md:text-base text-text-muted">
                  {t(`team.roles.${member.discipline}`)}
                </p>
                {/* `member.role` YA es la clave i18n compartida (`team.founderRole`). */}
                <p className="text-xs md:text-sm text-text-subtle">
                  {t(member.role)}
                </p>
              </div>

              {/* Affordance de estado. Va en acento porque AQUÍ SÍ hay algo
                  clicable (DESIGN-SPEC §1: el acento señaliza la acción).
                  `aria-hidden`: el estado ya lo comunica `aria-expanded`. */}
              <svg
                data-expand
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-5 h-5 shrink-0 text-accent transition-transform duration-200 ease-standard ${
                  expanded ? 'rotate-180' : 'rotate-0'
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <p className="text-sm md:text-base text-text-muted leading-relaxed">
              {t(member.tagline)}
            </p>
          </div>
        </button>

        {/* Panel expandible. El contenido vive siempre en el HTML (colapsado =
            fila de 0fr), que es justo lo que hace animable la apertura.
            `inert` mientras está cerrado: sin él, un lector de pantalla leería
            texto que no se ve. */}
        <div
          id={panelId}
          data-expand
          inert={!expanded}
          className={`grid transition-[grid-template-rows] duration-300 ease-signal ${
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-4 space-y-4">
              {/* Foto: hoy `photo` es undefined para ambos socios y la sección
                  debe funcionar así (DESIGN-SPEC §7). Cuando exista, se monta
                  SOLO con la tarjeta abierta — no basta con `lazy`: dentro del
                  panel colapsado el <img> igual entraría al DOM.
                  Sin foto NO se repite el avatar en grande: ya está arriba a
                  tamaño legible y duplicarlo solo empuja la bio hacia abajo. */}
              {expanded && member.photo && (
                <Image
                  src={member.photo.src}
                  alt={member.name}
                  width={member.photo.width}
                  height={member.photo.height}
                  loading="lazy"
                  priority={false}
                  placeholder="blur"
                  blurDataURL={member.photo.blurDataURL}
                  className="rounded-md w-full max-w-[320px] h-auto"
                />
              )}

              <p className="text-sm md:text-base text-text-muted leading-relaxed">
                {t(member.bio)}
              </p>

              {/* Chips de stack: nombres propios de tecnología, no i18n.
                  Misma familia visual que los chips de Servicios, pero SIN el
                  hover en acento: estos no son clicables (DESIGN-SPEC §1). */}
              <ul className="flex flex-wrap gap-2">
                {member.stack.map((tech) => (
                  <li
                    key={tech}
                    className="px-3 py-1 rounded-full bg-surface-raised border border-border font-mono text-caption text-text-muted"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Enlace opcional: si `portfolioUrl` es undefined no se renderiza nada.
            Fuera del <button> — un <a> dentro de un <button> es HTML inválido. */}
        {member.portfolioUrl && (
          <a
            href={member.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-sm md:text-base text-accent hover:text-accent-hover transition-colors duration-200 ease-standard"
          >
            {t('team.viewPortfolio')}
          </a>
        )}
      </div>
    </Card>
  );
};

export default TeamMemberCard;
