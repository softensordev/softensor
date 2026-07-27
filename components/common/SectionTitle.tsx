import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  align = 'center',
}) => {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={`mb-16 md:mb-20 ${alignStyles[align]}`}>
      <h2 className="text-3xl md:text-display font-bold mb-6 px-4 text-text">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg md:text-xl text-text-muted max-w-3xl mx-auto px-4">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
