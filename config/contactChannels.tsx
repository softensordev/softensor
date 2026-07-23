import React from 'react';
import type { TFunction } from 'i18next';

// PLACEHOLDER: cambiar por el correo real de la marca cuando exista.
export const CONTACT_EMAIL = 'info@softensor.com';

export interface ContactChannel {
  id: string; // 'email' | futuros: 'whatsapp', 'linkedin'...
  buildHref: (t: TFunction) => string;
  icon: React.ReactNode; // SVG inline con aria-hidden="true"
  external: boolean; // true → target="_blank" rel="noopener noreferrer"
  i18nKey: string; // ej. 'contact.channels.email'
  detail?: string; // dato copiable mostrado en la tarjeta (correo, teléfono...)
}

// Agregar un canal nuevo (WhatsApp, LinkedIn...) = añadir UN objeto a este
// array. Contact.tsx renderiza lo que haya aquí, sin cambios en su JSX.
export const contactChannels: ContactChannel[] = [
  {
    id: 'email',
    buildHref: (t) =>
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t('contact.channels.email.subject'))}`,
    icon: (
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-10 h-10 md:w-12 md:h-12"
      >
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
      </svg>
    ),
    external: false,
    i18nKey: 'contact.channels.email',
    detail: CONTACT_EMAIL,
  },
];
