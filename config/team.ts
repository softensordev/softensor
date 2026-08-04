// Equipo fundador de Softensor. Mismo patrón que config/contactChannels.tsx:
// interface exportada + array exportado. Agregar un integrante = añadir UN
// objeto a `team`; la sección de Confianza renderiza lo que haya aquí sin
// tocar su JSX ni el layout.
//
// i18n — NINGÚN campo contiene texto literal visible. Todo campo visible es
// una CLAVE de i18n; el resto son datos no traducibles:
//   - discipline → clave sufijo del bloque EXISTENTE `team.roles`
//     (consumir con t(`team.roles.${member.discipline}`)). Reutiliza las
//     traducciones ya presentes; NO se duplican.
//   - role       → clave i18n compartida (misma para ambos), `team.founderRole`.
//   - tagline/bio → claves i18n bajo `team.members.<id>.{tagline,bio}`.
//   - id, name (nombre propio), stack, photo, avatar → datos no traducibles.
// Traducciones en public/locales/{es,en}/common.json.

export interface TeamMember {
  id: string;              // 'luis' | 'david' — no traducible
  name: string;            // nombre propio — no traducible
  discipline: string;      // clave sufijo de `team.roles` ('mathematician' | 'physicist')
  role: string;            // clave i18n compartida ('team.founderRole')
  tagline: string;         // clave i18n — 1 línea, card colapsada
  bio: string;             // clave i18n — bio extendida, card expandida
  stack: string[];         // chips en la expansión — tecnologías, no traducibles
  photo?: {                // OPCIONAL — sin foto, avatar en grande
    src: string;
    width: number;         // 320
    height: number;        // 400
    blurDataURL: string;   // <1KB
  };
  avatar: {                // variantes del SVG por tokens
    skin: string;
    hair: string;
    accent: string;
  };
  portfolioUrl?: string;   // OPCIONAL — portafolio personal, no traducible.
                           // Si está undefined/vacío, la tarjeta NO renderiza
                           // el enlace "Ver portafolio" (nada, ni deshabilitado).
                           // Cuando exista, abre en pestaña nueva
                           // (target="_blank" rel="noopener noreferrer").
}

// Sin `photo` por ahora: la landing debe poder salir a producción sin sesión
// de fotos. Cuando exista, es añadir el objeto `photo` a cada integrante.
export const team: TeamMember[] = [
  {
    id: 'luis',
    name: 'Luis',
    discipline: 'mathematician',
    role: 'team.founderRole',
    tagline: 'team.members.luis.tagline',
    bio: 'team.members.luis.bio',
    stack: ['TypeScript', 'React', 'Next.js', 'Tailwind', 'framer-motion'],
    // Luis ya tiene AVATAR ILUSTRADO (3.3c-3), no el placeholder geométrico:
    // estos valores son piel y pelo reales, no tokens grises de la paleta. Un
    // `var(--color-surface-raised)` como piel funcionaba en una silueta
    // abstracta; en una cara pintaría un rostro gris. `accent` sí sigue siendo
    // token: es el aro decorativo, no parte de la persona.
    avatar: {
      skin: '#cf9c78',
      hair: '#241a14',
      accent: 'var(--color-accent)',
    },
  },
  {
    id: 'david',
    name: 'David',
    discipline: 'physicist',
    role: 'team.founderRole',
    tagline: 'team.members.david.tagline',
    bio: 'team.members.david.bio',
    stack: ['Python', 'PostgreSQL', 'Docker', 'FastAPI', 'Cloud'],
    avatar: {
      skin: 'var(--color-surface-raised)',
      hair: 'var(--color-text)',
      accent: 'var(--color-atmo-3)',
    },
  },
];
