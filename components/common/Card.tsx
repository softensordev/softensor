import React from 'react';

interface CardProps {
  children: React.ReactNode;
  /** `neon` y `gradient` son alias legacy: solo existen para que las secciones
   *  aún sin migrar compilen. Se eliminan en la sub-etapa 3.3. */
  variant?: 'default' | 'raised' | 'neon' | 'gradient';
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  hover = true,
}) => {
  const baseStyles = 'rounded-lg p-6 md:p-8 border transition-colors duration-200 ease-standard';

  const variantStyles = {
    default: 'bg-surface border-border',
    raised: 'bg-surface-raised border-border',
    neon: 'bg-surface border-border',
    gradient: 'bg-surface-raised border-border',
  };

  // El hover-lift real de las tarjetas se especifica en DESIGN-SPEC.md
  // (spotlight de tarjeta, sub-etapa 3.3). Aquí solo la base.
  const hoverStyles = hover ? 'hover:border-border-strong' : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
