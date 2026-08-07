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
          {/* Wordmark: ancla a la izquierda. Sigue siendo un <button> (3.2) —
              alcanzable por teclado y sin robarle el <h1> al hero.
              Tipográfico en mono minúscula + cursor de terminal (3.5b-2): el
              texto es texto real, y el `_` es un <span> aparte para poder
              animarlo solo a él, `aria-hidden` porque es ornamento (el lector
              debe leer "softensor", no "softensor guion bajo").
              `font-medium` y no `font-bold`: JetBrains Mono se carga en un solo
              peso (500) desde `_app`; pedir 700 daría bold sintético.

              PRUEBA VISUAL (3.5b-2): el símbolo de marca SUSTITUYE a la "s"
              inicial — se lee [S]oftensor_. Notas de la prueba:

              · Se usa la "S" SOLA, sin el cuadro redondeado del favicon: ese
                cuadro es `#07090A`, el mismo color que `bg-bg` de esta barra,
                así que no sería un badge sino un rectángulo fantasma, visible
                solo por el 10 % de transparencia del nav. Aparte, dentro de una
                palabra un cuadro de fondo la partiría en dos. El dibujo es el
                del favicon (mismo `polyline`, mismo grosor relativo); solo
                cambia el `viewBox`, recortado al bounding box del trazo
                (26,22 → 76,78) para que no arrastre el aire interior del icono.

              · ACCESIBILIDAD — lo que obliga esta variante. El texto visible ya
                no dice "softensor" sino "oftensor", así que un lector de
                pantalla leería eso. Por tanto TODO el lockup visual va
                `aria-hidden` y el nombre completo vive en un `sr-only`
                hermano: sigue siendo texto real en el DOM (indexable, no
                imagen), y lo que se anuncia es "softensor".

              · Métrica: `h-[0.65em]` ata la altura del símbolo al font-size, así
                que escala sola entre `text-2xl` y `text-3xl` sin un segundo
                valor. 0,65 em queda entre la altura de x (~0,55 em) y la de las
                ascendentes de la "f" y la "t" (~0,75 em): a la altura de x el
                trazo del símbolo cerraría sus propios contra-espacios y se
                vería como un borrón.

              · Alineación: sin flex a propósito. Un SVG inline es un elemento
                reemplazado, y su borde inferior se apoya solo en la línea base
                del texto — igual que una letra sin descendente, que es
                exactamente lo que tiene que hacer aquí. `mr-0.5` repone el
                espacio lateral que el `viewBox` recortado no tiene y que sí
                tienen las letras del mono. */}
          <button
            onClick={() => scrollToSection('hero')}
            className="flex-shrink-0 font-mono font-medium text-2xl md:text-3xl tracking-tight text-text"
          >
            <span className="sr-only">softensor</span>
            <span aria-hidden="true">
              <svg
                viewBox="26 22 50 56"
                className="inline-block align-baseline h-[0.65em] w-auto mr-0.5 text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth={12}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="70,28 32,28 32,50 70,50 70,72 32,72" />
              </svg>
              oftensor
              <span className="wordmark-cursor text-accent">_</span>
            </span>
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
