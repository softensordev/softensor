// TODO fase3.2: rediseño completo de Navigation a dirección Señal
'use client';

import React, { useState } from 'react';
// El provider lo monta appWithTranslation con la copia CJS de react-i18next que
// trae next-i18next; importar desde 'react-i18next' directamente resuelve a otra
// copia del módulo (otro contexto de React) y t() devuelve la clave en SSG.
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

const Navigation: React.FC = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const navItems = [
    { key: 'home', id: 'hero' },
    { key: 'services', id: 'services' },
    { key: 'team', id: 'team' },
    { key: 'contact', id: 'contact' },
  ];

  const localeButton = (locale: string) =>
    router.locale === locale
      ? 'bg-accent text-accent-contrast'
      : 'bg-surface-raised text-text-muted hover:text-text';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl md:text-3xl font-bold text-text cursor-pointer" onClick={() => scrollToSection('hero')}>
              Softensor
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.id)}
                className="text-base lg:text-lg font-medium text-text-muted hover:text-accent transition-colors"
              >
                {t(`nav.${item.key}`)}
              </button>
            ))}
          </div>

          {/* Language Toggle */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => changeLanguage('es')}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${localeButton('es')}`}
              >
                ES
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${localeButton('en')}`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-md bg-surface-raised text-text hover:bg-surface transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-6 space-y-3">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left px-5 py-3 text-base font-medium text-text-muted hover:bg-surface-raised hover:text-text rounded-md transition-colors"
              >
                {t(`nav.${item.key}`)}
              </button>
            ))}
            <div className="flex items-center justify-end px-5 pt-5 border-t border-border mt-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => changeLanguage('es')}
                  className={`px-4 py-2 rounded-md font-semibold transition-colors ${localeButton('es')}`}
                >
                  ES
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-4 py-2 rounded-md font-semibold transition-colors ${localeButton('en')}`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
