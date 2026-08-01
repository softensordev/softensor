'use client';

import React, { useState } from 'react';
// El provider lo monta appWithTranslation con la copia CJS de react-i18next que
// trae next-i18next; importar desde 'react-i18next' directamente resuelve a otra
// copia del módulo (otro contexto de React) y t() devuelve la clave en SSG.
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Button from './Button';

const MOBILE_MENU_ID = 'nav-mobile-menu';

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

  /** Selector de idioma: peso bajo. Sin fondo sólido — el acento sólido queda
   *  reservado para el CTA, que es la única acción de conversión de la barra. */
  const LocaleSwitch: React.FC = () => (
    <div className="flex items-center font-mono text-sm">
      {(['es', 'en'] as const).map((locale, i) => {
        const isActive = router.locale === locale;
        return (
          <React.Fragment key={locale}>
            {i > 0 && <span className="text-text-subtle px-1.5">/</span>}
            <button
              lang={locale}
              onClick={() => changeLanguage(locale)}
              aria-current={isActive ? 'true' : undefined}
              className={`px-1 py-1 uppercase transition-colors ${
                isActive
                  ? 'text-text'
                  : 'text-text-subtle hover:text-text-muted'
              }`}
            >
              {locale}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        <div className="flex justify-between items-center h-20">
          {/* Wordmark: ancla a la izquierda. Sin logo; tipográfico limpio en
              sans 700. */}
          <button
            onClick={() => scrollToSection('hero')}
            className="flex-shrink-0 text-2xl md:text-3xl font-bold tracking-tight text-text"
          >
            Softensor
          </button>

          {/* Desktop: navegación (peso medio) → idioma (peso bajo) → CTA (peso alto) */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <div className="flex items-center gap-6 lg:gap-8">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => scrollToSection(item.id)}
                  className="text-base font-medium text-text-muted hover:text-accent transition-colors"
                >
                  {t(`nav.${item.key}`)}
                </button>
              ))}
            </div>

            <span aria-hidden="true" className="h-5 w-px bg-border" />

            <LocaleSwitch />

            <Button
              variant="primary"
              size="sm"
              onClick={() => scrollToSection('contact')}
            >
              {t('nav.cta')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-md bg-surface-raised text-text hover:bg-surface transition-colors"
              aria-label={t('nav.menuToggle')}
              aria-expanded={isMenuOpen}
              aria-controls={MOBILE_MENU_ID}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
          <div id={MOBILE_MENU_ID} className="md:hidden pb-6 space-y-1">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left px-5 py-3 text-base font-medium text-text-muted hover:bg-surface-raised hover:text-text rounded-md transition-colors"
              >
                {t(`nav.${item.key}`)}
              </button>
            ))}

            {/* Idioma discreto y CTA como acción destacada al cierre del panel */}
            <div className="flex items-center justify-between gap-4 px-5 pt-5 mt-4 border-t border-border">
              <LocaleSwitch />
              <Button
                variant="primary"
                size="sm"
                onClick={() => scrollToSection('contact')}
              >
                {t('nav.cta')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
