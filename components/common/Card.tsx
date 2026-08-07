import React from 'react';
import CardSpotlight from './CardSpotlight';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'raised';
  className?: string;
  hover?: boolean;
  /** Halo de tarjeta del spotlight (DESIGN-SPEC §3). Opt-in, no por defecto:
   *  ver la nota de abajo sobre dónde se activa y por qué. */
  spotlight?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  hover = true,
  spotlight = false,
}) => {
  const baseStyles = 'rounded-lg p-6 md:p-8 border transition-colors duration-200 ease-standard';

  const variantStyles = {
    default: 'bg-surface border-border',
    raised: 'bg-surface-raised border-border',
  };

  const hoverStyles = hover ? 'hover:border-border-strong' : '';

  // Spotlight de tarjeta (DESIGN-SPEC §3), sub-etapa 3.4b.
  //
  // `isolate` no es decorativo: crea el contexto de apilamiento que hace que el
  // `-z-10` del halo caiga POR ENCIMA del fondo de esta tarjeta y por DEBAJO de
  // su contenido. Sin él, el z negativo se resolvería contra la raíz del
  // documento y el halo quedaría escondido tras `bg-surface`.
  // `group` es la compuerta de proximidad del halo (`group-hover:opacity-100`
  // en `CardSpotlight`): CSS puro, sin estado de React por hover.
  //
  // POR QUÉ ES OPT-IN Y NO EL DEFAULT DE TODA `Card`. Cada halo montado añade
  // una suscripción aritmética al `pointermove` compartido y una capa
  // promovida en GPU. En Servicios, Proyectos y Contacto las tarjetas son
  // bloques de lectura; el halo ahí es ruido que se paga en cada tarjeta de la
  // grilla. En Confianza la tarjeta ES el objeto interactivo (se expande al
  // clic, y su avatar ya sigue al cursor), así que el halo refuerza una
  // affordance que ya existe. Se activa solo ahí: 2 instancias.
  const spotlightStyles = spotlight ? 'relative isolate group' : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${spotlightStyles} ${className}`}
    >
      {spotlight && <CardSpotlight />}
      {children}
    </div>
  );
};

export default Card;
