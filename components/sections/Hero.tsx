import React from 'react';
import { useTranslation } from 'next-i18next';
import Button from '../common/Button';
import Section from '../common/Section';

const Hero: React.FC = () => {
  const { t } = useTranslation('common');

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Section
      id="hero"
      background="default"
      className="min-h-screen flex items-center justify-center pt-24 md:pt-28"
    >
      <div className="max-w-3xl mx-auto text-center">
        {/* H1 tipográfico: sin gradiente ni glow. El peso lo carga la escala,
            no el ornamento. clamp de DESIGN-SPEC, con --text-display (3.25rem)
            como techo y su line-height/tracking replicados a mano — la utilidad
            arbitraria no hereda los modificadores del token. */}
        <h1 className="text-[clamp(2rem,7vw,3.25rem)] leading-[1.06] tracking-[-.03em] font-bold text-text text-balance">
          {t('hero.title')}
        </h1>

        {/* Texto de apoyo, no un segundo titular: sin color de acento. El acento
            queda reservado para la acción (DESIGN-SPEC §1). */}
        <p className="mt-5 md:mt-6 text-lg md:text-xl font-medium text-text-muted text-pretty">
          {t('hero.subtitle')}
        </p>

        <div className="mt-9 md:mt-11 flex justify-center">
          <Button variant="primary" size="lg" onClick={scrollToContact}>
            {t('hero.cta')}
          </Button>
        </div>
      </div>
    </Section>
  );
};

export default Hero;
