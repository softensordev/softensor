import React from 'react';
import { useTranslation } from 'next-i18next';
import Section from '../common/Section';
import SectionTitle from '../common/SectionTitle';
import Card from '../common/Card';

const Services: React.FC = () => {
  const { t } = useTranslation('common');

  const services = [
    {
      key: 'fullstack',
      icon: '💻',
      color: 'neon-purple',
    },
    {
      key: 'cloud',
      icon: '☁️',
      color: 'neon-blue',
    },
    {
      key: 'ai',
      icon: '🤖',
      color: 'neon-pink',
    },
    {
      key: 'data',
      icon: '📊',
      color: 'neon-cyan',
    },
  ];

  return (
    <Section id="services" background="dark">
      <SectionTitle
        title={t('services.title')}
        subtitle={t('services.subtitle')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
        {services.map((service) => (
          <Card key={service.key} variant="neon">
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl md:text-6xl lg:text-7xl mb-6">{service.icon}</div>
              <h3 className={`text-xl md:text-2xl font-bold text-${service.color} mb-3`}>
                {t(`services.${service.key}.title`)}
              </h3>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed px-2">
                {t(`services.${service.key}.description`)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Technologies Section */}
      <div className="mt-20 md:mt-24 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-neon-cyan mb-10 md:mb-12 px-4">
          Stack Tecnológico / Tech Stack
        </h3>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 px-4">
          {[
            'React', 'Next.js', 'TypeScript', 'Python', 'Java',
            'AWS', 'Azure', 'GCP', 'TensorFlow', 'PyTorch',
            'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes'
          ].map((tech) => (
            <span
              key={tech}
              className="px-4 md:px-5 py-2 md:py-3 bg-sunset-medium border border-neon-purple rounded-full text-sm md:text-base text-gray-300 hover:border-neon-cyan hover:text-neon-cyan transition-all"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default Services;
