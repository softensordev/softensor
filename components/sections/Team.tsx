import React from 'react';
import { useTranslation } from 'next-i18next';
import Section from '../common/Section';
import SectionTitle from '../common/SectionTitle';
import TeamMemberCard from './TeamMemberCard';
import { team } from '../../config/team';

const Team: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <Section id="team" background="default">
      <SectionTitle
        title={t('team.title')}
        subtitle={t('team.subtitle')}
      />

      {/* Dos socios: una columna en móvil, dos en desktop. La grilla sale de
          `config/team.ts`; añadir un integrante no toca este JSX. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {team.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>

      {/* Valores */}
      <div className="mt-20 md:mt-24">
        <SectionTitle title={t('values.title')} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {['smallBusiness', 'development', 'innovation'].map((value) => (
            <div
              key={value}
              className="p-6 md:p-8 rounded-lg bg-surface border border-border hover:border-accent transition-colors duration-200 ease-standard"
            >
              <h3 className="text-xl md:text-2xl font-bold text-text mb-4">
                {t(`values.${value}.title`)}
              </h3>
              <p className="text-sm md:text-base text-text-muted leading-relaxed">
                {t(`values.${value}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default Team;
