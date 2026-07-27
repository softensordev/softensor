import React from 'react';
import { useTranslation } from 'next-i18next';
import Card from '../common/Card';
import { TeamMember } from '@/types/team';

interface TeamMemberCardProps {
  member: TeamMember;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => {
  const { t } = useTranslation('common');

  const roleColors = {
    physicist: 'neon-blue',
    mathematician: 'neon-purple',
    engineer: 'neon-pink',
    statistician: 'neon-cyan',
  };

  const roleIcons = {
    physicist: '⚛️',
    mathematician: '∑',
    engineer: '⚙️',
    statistician: '📈',
  };

  return (
    <Card variant="gradient">
      <div className="text-center space-y-5 py-2">
        {/* Avatar */}
        <div className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-4xl md:text-5xl mb-2">
          {roleIcons[member.role]}
        </div>

        {/* Name */}
        <h3 className="text-lg md:text-xl font-bold text-white px-2">
          {member.name}
        </h3>

        {/* Role */}
        <p className={`text-sm md:text-base text-${roleColors[member.role]} font-semibold px-2`}>
          {t(`team.roles.${member.role}`)}
        </p>

        {/* Specialties */}
        <div className="flex flex-wrap justify-center gap-2 pt-2 px-2">
          {member.specialties.map((specialty, index) => (
            <span
              key={index}
              className="px-3 py-1.5 text-xs md:text-sm bg-sunset-deep border border-neon-cyan rounded-full text-gray-300"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TeamMemberCard;
