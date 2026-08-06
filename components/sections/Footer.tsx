import React from 'react';
import { useTranslation } from 'next-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  // El `<footer>` ya no lleva `bg-bg`: era el último fondo de bloque opaco de
  // la página y tapaba las capas decorativas de z-index negativo justo sobre el
  // pie (la costura que 3.4b dejó documentada y sin corregir). Mismo caso que
  // `Section`: el lienzo del documento ya pinta `--color-bg`, así que quitarlo
  // es idéntico píxel a píxel salvo por el halo y los paths, que ahora sí se
  // ven aquí.
  return (
    <footer className="border-t border-border py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        <div className="text-center space-y-4">
          {/* Wordmark: mismo tratamiento que el del nav (sans 700, limpio).
              Aquí no es interactivo, así que va como texto plano — un <h3>
              suelto en el footer rompería la jerarquía de encabezados de la
              página. */}
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Softensor
          </p>

          <p className="text-base md:text-lg text-text-muted">
            {t('footer.slogan')}
          </p>

          <p className="text-sm text-text-subtle">
            © {currentYear} Softensor. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
