import React from 'react';
import { useTranslation } from 'next-i18next';
import Section from '../common/Section';
import SectionTitle from '../common/SectionTitle';
import TeamMemberCard from './TeamMemberCard';
import { TeamMember } from '@/types/team';

const Team: React.FC = () => {
  const { t } = useTranslation('common');

  // Initial team members - can be easily extended
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Team Member 1',
      role: 'physicist',
      specialties: ['Quantum Computing', 'Computational Physics', 'Python'],
    },
    {
      id: 2,
      name: 'Team Member 2',
      role: 'mathematician',
      specialties: ['Algorithms', 'Optimization', 'Machine Learning'],
    },
    {
      id: 3,
      name: 'Team Member 3',
      role: 'engineer',
      specialties: ['Full Stack', 'Cloud Architecture', 'DevOps'],
    },
    {
      id: 4,
      name: 'Team Member 4',
      role: 'statistician',
      specialties: ['Data Analysis', 'Statistical Modeling', 'R/Python'],
    },
  ];

  return (
    <Section id="team" background="gradient">
      <SectionTitle
        title={t('team.title')}
        subtitle={t('team.subtitle')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
        {teamMembers.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>

      {/* Values Section */}
      <div className="mt-24 md:mt-32">
        <SectionTitle title={t('values.title')} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {['smallBusiness', 'development', 'innovation'].map((value) => (
            <div
              key={value}
              className="text-center p-8 md:p-10 rounded-xl bg-sunset-dark/50 border border-neon-purple hover:border-neon-cyan transition-all"
            >
              <h3 className="text-xl md:text-2xl font-bold text-neon-cyan mb-4 md:mb-6 px-2">
                {t(`values.${value}.title`)}
              </h3>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed px-2">
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
