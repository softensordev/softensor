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
    <Section id="hero" background="gradient" className="min-h-screen flex items-center justify-center pt-20 md:pt-24">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="text-center space-y-8 md:space-y-12">
          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-transparent bg-clip-text bg-neon-gradient animate-glow px-4">
            {t('hero.title')}
          </h1>

          {/* Subtitle */}
          <h2 className="text-xl md:text-3xl lg:text-4xl font-semibold text-neon-cyan px-4">
            {t('hero.subtitle')}
          </h2>

          {/* Description */}
          <p className="text-base md:text-lg lg:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-6 md:px-8">
            {t('hero.description')}
          </p>

          {/* CTA Button */}
          <div className="pt-8 md:pt-12 flex justify-center">
            <Button
              variant="neon"
              size="lg"
              onClick={scrollToContact}
              className="animate-float"
            >
              {t('hero.cta')}
            </Button>
          </div>

          {/* Decorative Elements */}
          <div className="pt-16 md:pt-20 flex justify-center items-center space-x-6 md:space-x-8">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-neon-pink opacity-20 blur-xl animate-pulse"></div>
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-neon-purple opacity-20 blur-xl animate-pulse delay-75"></div>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-neon-cyan opacity-20 blur-xl animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Hero;
