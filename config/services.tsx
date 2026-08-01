import React from 'react';

// Servicios de la sección Servicios. Mismo patrón que
// config/contactChannels.tsx: interface exportada + array exportado.
// Agregar un servicio = añadir UN objeto a `services`; el layout no cambia.
//
// i18n — `key` es el sufijo de las claves ya existentes en common.json:
//   t(`services.${key}.title`) y t(`services.${key}.description`).
// El icono NO es traducible. Va como SVG inline (sin dependencia de iconos):
// markup estilo Lucide (MIT), mismo contrato visual que el sobre de
// contactChannels.tsx — viewBox 0 0 24 24, fill="none", stroke="currentColor",
// strokeWidth 1.5. El color lo hereda del contenedor vía currentColor: los
// iconos NO llevan color propio.

export interface Service {
  key: string;           // sufijo de las claves i18n `services.<key>.*`
  icon: React.ReactNode; // SVG inline con aria-hidden="true"
}

const iconProps = {
  'aria-hidden': true as const,
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'w-10 h-10 md:w-11 md:h-11',
};

export const services: Service[] = [
  {
    key: 'fullstack',
    icon: (
      // code
      <svg {...iconProps}>
        <path d="m18 16 4-4-4-4" />
        <path d="m6 8-4 4 4 4" />
        <path d="m14.5 4-5 16" />
      </svg>
    ),
  },
  {
    key: 'cloud',
    icon: (
      // cloud
      <svg {...iconProps}>
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </svg>
    ),
  },
  {
    key: 'ai',
    icon: (
      // cpu
      <svg {...iconProps}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
        <path d="M9 2v2" />
        <path d="M15 2v2" />
        <path d="M9 20v2" />
        <path d="M15 20v2" />
        <path d="M2 9h2" />
        <path d="M2 15h2" />
        <path d="M20 9h2" />
        <path d="M20 15h2" />
      </svg>
    ),
  },
  {
    key: 'data',
    icon: (
      // bar chart
      <svg {...iconProps}>
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
  },
];

// Stack tecnológico. Nombres propios de producto: NO se traducen (mismo
// criterio que `tags` en config/projects.ts). El encabezado del bloque sí es
// texto visible y va por i18n (`services.stack.title`).
export const techStack: string[] = [
  'React',
  'Next.js',
  'TypeScript',
  'Python',
  'Java',
  'AWS',
  'Azure',
  'GCP',
  'TensorFlow',
  'PyTorch',
  'PostgreSQL',
  'MongoDB',
  'Docker',
  'Kubernetes',
];
