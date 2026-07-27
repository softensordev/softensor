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
  const backgroundStyles = {
    default: 'bg-bg',
    surface: 'bg-surface',
    gradient: 'bg-bg',
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
