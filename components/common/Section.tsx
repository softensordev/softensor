import React from 'react';

interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  /** `gradient` y `dark` son alias legacy: solo existen para que las secciones
   *  aún sin migrar compilen. Se eliminan en la sub-etapa 3.3. */
  background?: 'default' | 'surface' | 'gradient' | 'dark';
}

const Section: React.FC<SectionProps> = ({
  id,
  children,
  className = '',
  background = 'default',
}) => {
  // `default` y `gradient` NO pintan fondo, y el resultado es idéntico píxel a
  // píxel al `bg-bg` que tenían: `body` ya es `--color-bg` (styles/globals.css),
  // así que un fondo transparente deja ver exactamente el mismo color.
  //
  // El cambio existe por el halo global del spotlight (DESIGN-SPEC §3, 3.4b), y
  // lo hereda la atmósfera de fondo de 3.4c. Las secciones viven en el escalón
  // de CONTENIDO (`z-20`) del apilamiento que abre `pages/index.tsx`, es decir
  // por encima de las dos capas decorativas: con `bg-bg` opaco en cada sección
  // el halo y los paths quedan tapados por toda la página y no se ven nunca.
  // La alternativa —subir las capas por encima del contenido— es justo lo que
  // §3 prohíbe. Con el fondo transparente, el color base lo pone el div raíz de
  // la página y la capa decorativa ocupa su sitio: encima del color base,
  // debajo de todo lo demás.
  //
  // `surface` sigue pintando, y ahí las capas decorativas no se ven: hoy
  // ninguna sección lo usa, y cuando alguna lo haga es una decisión de
  // contraste deliberada.
  const backgroundStyles = {
    default: '',
    surface: 'bg-surface',
    gradient: '',
    dark: 'bg-surface',
  };

  return (
    <section
      id={id}
      className={`py-16 md:py-24 lg:py-32 px-6 md:px-12 lg:px-20 ${backgroundStyles[background]} ${className}`}
    >
      <div className="max-w-7xl mx-auto w-full">
        {children}
      </div>
    </section>
  );
};

export default Section;
