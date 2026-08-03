// Casos/proyectos de la sección de Confianza. Mismo patrón que
// config/contactChannels.tsx y config/team.ts: interface exportada + array
// exportado. Agregar un caso = añadir UN objeto a `projects`; el layout no
// cambia (la grilla centra el caso único y crece sola con varios).
//
// Los tres placeholder de relleno (retail/salud/logística) se eliminaron en
// 3.3c-2: aquí solo van casos REALES y verificables.
//
// i18n — todo campo de texto visible guarda CLAVES de i18n (mismo criterio
// que team.ts). Traducciones en public/locales/{es,en}/common.json:
//   - sector → clave sufijo de `projects.sectors`
//     (consumir con t(`projects.sectors.${project.sector}`)).
//   - title/summary → `projects.<id>.{title,summary}`.
//   - metric.label → `projects.<id>.metric.label`.
// NO traducibles: id, year, tags (tecnología/dominio), metric.value (número
// o símbolo), image, href.

export interface Project {
  id: string;
  sector: string;          // clave sufijo de `projects.sectors` ('moda')
  year: number;            // número — no traducible
  title: string;           // clave i18n
  summary: string;         // clave i18n
  tags: string[];          // chips de tecnología/dominio — no traducibles
  metric?: {               // OPCIONAL — dato de impacto destacable
    label: string;         // clave i18n
    value: string;         // número o símbolo — no traducible
  };
  image?: {                // OPCIONAL — captura del caso
    src: string;
    width: number;
    height: number;
    blurDataURL: string;
  };
  href?: string;           // OPCIONAL — enlace al caso público, si existe
}

export const projects: Project[] = [
  {
    id: 'atelier-commerce',
    sector: 'moda',
    year: 2025,
    title: 'projects.atelier-commerce.title',
    summary: 'projects.atelier-commerce.summary',
    tags: ['Next.js', 'TypeScript', 'Stripe', 'PostgreSQL', 'Prisma'],
    href: 'https://atelier-commerce.vercel.app/',
    // Sin `metric` ni `image` por ahora: la tarjeta no reserva espacio para
    // lo que falta — si no hay métrica, no se pinta nada.
  },
];
