import React from 'react';
import { useTranslation } from 'next-i18next';
import Section from '../common/Section';
import SectionTitle from '../common/SectionTitle';
import Card from '../common/Card';
import { services, techStack } from '../../config/services';

const Services: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <Section id="services" background="default">
      <SectionTitle
        title={t('services.title')}
        subtitle={t('services.subtitle')}
      />

      {/* Grilla limpia: 1 columna en móvil, 4 en desktop. Sin bento: las cuatro
          categorías tienen el mismo peso comercial, así que jerarquizarlas por
          tamaño de celda comunicaría una prioridad que no existe. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {services.map((service) => (
          <Card key={service.key} className="h-full">
            <div className="space-y-4">
              {/* El icono es marcador de categoría, no acción: va en --color-text,
                  no en acento. El acento queda reservado para lo clicable
                  (DESIGN-SPEC §1) y estas tarjetas no lo son. */}
              <span className="block text-text">{service.icon}</span>
              <h3 className="text-xl md:text-2xl font-bold text-text">
                {t(`services.${service.key}.title`)}
              </h3>
              <p className="text-sm md:text-base text-text-muted leading-relaxed">
                {t(`services.${service.key}.description`)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Stack tecnológico */}
      <div className="mt-20 md:mt-24 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-text mb-10 md:mb-12 px-4">
          {t('services.stack.title')}
        </h3>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 px-4">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="px-4 md:px-5 py-2 md:py-3 rounded-full bg-surface-raised border border-border text-sm md:text-base text-text-muted hover:border-accent hover:text-accent transition-colors duration-200 ease-standard"
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
