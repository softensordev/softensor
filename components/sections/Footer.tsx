import React from 'react';
import { useTranslation } from 'next-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sunset-deep border-t-2 border-sunset-light py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        <div className="text-center space-y-6">
          {/* Logo */}
          <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-neon-gradient">
            Softensor
          </h3>

          {/* Slogan */}
          <p className="text-base md:text-lg text-neon-cyan italic px-4">
            {t('footer.slogan')}
          </p>

          {/* Copyright */}
          <p className="text-gray-400 text-sm md:text-base px-4">
            © {currentYear} Softensor. {t('footer.rights')}
          </p>

          {/* Decorative Line */}
          <div className="pt-6">
            <div className="h-1 w-32 md:w-40 mx-auto bg-gradient-to-r from-neon-purple via-neon-pink to-neon-orange rounded-full"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
