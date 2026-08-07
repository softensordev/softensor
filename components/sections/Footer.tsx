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
          {/* Wordmark: mismo tratamiento exacto que el del nav (mono 500 +
              cursor animado, 3.5b-2). Se mantiene la animación aquí a
              propósito: es un solo signo de marca, y dejar el cursor fijo en el
              pie y vivo en la barra se leería como un fallo, no como sobriedad.
              El pie además solo se ve al final del scroll, así que el parpadeo
              no compite con ninguna lectura en curso.
              Aquí no es interactivo, así que va como texto plano — un <h3>
              suelto en el footer rompería la jerarquía de encabezados de la
              página. */}
          <p className="font-mono font-medium text-2xl md:text-3xl tracking-tight text-text">
            softensor
            <span aria-hidden="true" className="wordmark-cursor text-accent">
              _
            </span>
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
