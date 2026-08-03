import React from 'react';
import { useTranslation } from 'next-i18next';
import Card from '../common/Card';
import Avatar from './Avatar';
import { TeamMember } from '../../config/team';

interface TeamMemberCardProps {
  member: TeamMember;
}

// Tarjeta COLAPSADA de un socio (3.3c-1): avatar + nombre + disciplina + rol +
// tagline. Sin interacción.
//
// `bio` y `stack` existen en config/team.ts pero NO se renderizan aquí todavía:
// son el contenido de la expansión apilada (DESIGN-SPEC §7), que es 3.3c-2.
const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => {
  const { t } = useTranslation('common');

  return (
    <Card className="h-full">
      <div className="space-y-4">
        <Avatar
          avatar={member.avatar}
          uid={member.id}
          className="w-20 h-20 md:w-24 md:h-24"
        />

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

        <p className="text-sm md:text-base text-text-muted leading-relaxed">
          {t(member.tagline)}
        </p>

        {/* Enlace opcional: si `portfolioUrl` es undefined no se renderiza nada.
            Va en acento porque aquí sí hay una acción (DESIGN-SPEC §1). */}
        {member.portfolioUrl && (
          <a
            href={member.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm md:text-base text-accent hover:text-accent-hover transition-colors duration-200 ease-standard"
          >
            {t('team.viewPortfolio')}
          </a>
        )}
      </div>
    </Card>
  );
};

export default TeamMemberCard;
