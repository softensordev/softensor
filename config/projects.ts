// Casos/proyectos de la sección de Confianza. Mismo patrón que
// config/contactChannels.tsx y config/team.ts: interface exportada + array
// exportado. Agregar un caso = añadir UN objeto a `projects`; el layout no
// cambia.
//
// PLACEHDER: los tres casos de abajo son de relleno realista. Los casos
// REALES están pendientes de curaduría con David (ver BITACORA). Anexarlos
// es agregar objetos a este array, sin tocar el componente ni el layout.
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
  sector: string;          // clave sufijo de `projects.sectors` ('retail' | 'salud' | 'logistica')
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
    id: 'retail-inventario',
    sector: 'retail',
    year: 2025,
    title: 'projects.retail-inventario.title',
    summary: 'projects.retail-inventario.summary',
    tags: ['Inventario', 'Next.js', 'PostgreSQL', 'Tiempo real'],
    metric: { label: 'projects.retail-inventario.metric.label', value: '−40%' },
  },
  {
    id: 'salud-agenda',
    sector: 'salud',
    year: 2025,
    title: 'projects.salud-agenda.title',
    summary: 'projects.salud-agenda.summary',
    tags: ['Agenda clínica', 'React', 'FastAPI', 'Recordatorios'],
    metric: { label: 'projects.salud-agenda.metric.label', value: '−60%' },
  },
  {
    id: 'logistica-despachos',
    sector: 'logistica',
    year: 2024,
    title: 'projects.logistica-despachos.title',
    summary: 'projects.logistica-despachos.summary',
    tags: ['Portal despachos', 'Next.js', 'Docker', 'Tracking'],
    metric: { label: 'projects.logistica-despachos.metric.label', value: '3×' },
  },
];
