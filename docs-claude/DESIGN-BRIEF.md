# Design Brief — Rediseño softensor.com (para Claude Design, Fase 2)

Estado: APROBADO por Luis (2026-07-17, sesión de Fase 1).
Este documento es el insumo único para la Fase 2 (Claude Design).

## 1. Qué es y para qué
Landing comercial de Softensor: dupla de desarrolladores full-stack colombianos
que vende servicios de desarrollo de software a pymes. Objetivo único de la
página: convertir visitantes en leads mediante contacto directo de baja fricción
(email hoy, WhatsApp futuro). No hay formulario: fue eliminado deliberadamente
por abandono (Fase 0). Todo el diseño se subordina a llevar al visitante al CTA
de contacto.

## 2. Audiencia
Decisores de pyme (gerentes, dueños), no técnicos, evaluando contratar
desarrollo. Mercado: Colombia como base, con oferta internacional (de ahí el
i18n ES/EN). Navegación mayoritaria esperada: móvil Android de gama media sobre
4G. Implicaciones: mobile-first real, jerarquía clara, señalizadores de
confianza por encima de espectáculo visual. El visitante debe poder responder
en <10 segundos: qué hacen, para quién, y cómo los contacto.

## 3. Dirección visual
Base: minimalismo funcional con sistema tipográfico fuerte (tradición
suiza/editorial: jerarquía por tipografía y grid, no por ornamento). Capa de
carácter: dark tech sutil — fondo oscuro, glows y acentos de luz discretos,
micro-interacciones precisas. La página debe sentirse rápida y precisa: ese es
el argumento de venta implícito de una empresa de ingeniería.
Identidad: internacional neutra. "Dupla colombiana" aparece como dato en la
sección de confianza, pero el lenguaje visual NO se tematiza como regional.

Elementos aprobados como concepto (referencia: components/ui/ de la rama
`luis`, congelada; se rescata el concepto, NUNCA se mergea código de ahí):
- Spotlight en cards: gradiente radial que sigue el cursor (desktop only,
  enhancement progresivo). Patrón ya compatible con framer-motion.
- Background paths: líneas SVG animadas como textura de fondo.
- Expandable cards: patrón candidato para servicios.
- Bento grid como patrón de layout para servicios/capacidades.
- Elemento distintivo nuevo: AVATARES ILUSTRADOS 2D INTERACTIVOS de los dos
  fundadores (SVG + framer-motion): ojos que siguen el cursor, parpadeo,
  reacción al hover. Cero canvas, cero 3D. Decisión abierta para Fase 2:
  avatar vs foto real vs híbrido (avatar en card, foto al expandir) — Claude
  Design explora las opciones y Luis+David deciden viendo.

Anti-objetivos explícitos: NO 3D (decisión de Fase 1: cero runtime 3D — ni
Spline, ni Rive, ni three.js), NO partículas en canvas ni rAF persistente,
NO glassmorphism como sistema (máx. acento puntual), NO claymorphism, NO
maximalismo, NO clon de Linear/Vercel ni template Aceternity genérico.
Diferenciación por tipografía con carácter + avatares ilustrados.

## 4. Estructura de secciones (orden de scroll)
1. Hero: propuesta de valor en una frase + CTA primario de contacto visible
   sin scroll en móvil. Fondo con vida sutil (paths/gradiente), sin canvas.
2. Servicios: qué hacen, en lenguaje de beneficio para pyme (sin jerga).
   Bento grid o expandable cards.
3. Confianza: quiénes son (avatares/fotos, nombres, experiencia) + proyectos.
   Jerarquía alta deliberada: para pyme, la confianza convierte más que el
   efecto. Proyectos con estructura de datos extensible (mismo patrón
   array-de-configuración que config/contactChannels.tsx) y contenido
   placeholder realista: la curaduría de casos reales está pendiente con
   David; anexarlos debe ser agregar objetos, no rediseñar.
4. Proceso: cómo es trabajar con ellos, 3–4 pasos simples.
5. Contacto: tarjetas de canal de Fase 0 (email hoy, WhatsApp futuro),
   asumiendo la estructura extensible por array ya implementada.
El CTA de contacto se repite: hero, nav o flotante, y sección final.

## 5. Restricciones técnicas (no negociables)
- Stack: Next.js 16 (pages router), TypeScript estricto, Tailwind CSS 4.
  El repo es la fuente del design system existente.
- framer-motion es el ÚNICO sistema de animación. Cero librerías nuevas de
  UI/animación.
- Presupuesto: Lighthouse mobile ≥ 80, LCP < 2.5s. Nada pesado above the
  fold; backdrop-filter solo como acento aislado; animaciones
  GPU-composited (transform/opacity).
- i18n ES/EN vía next-i18next: cero texto hardcodeado. El diseño debe
  tolerar longitudes de copy distintas por idioma (EN ~15% más corto).
- Accesibilidad: contraste AA sobre fondo oscuro; prefers-reduced-motion
  respetado en toda animación.
- SSG: contenido principal prerenderizado, nada crítico solo-cliente.

## 6. Qué se le pide a Claude Design (Fase 2)
Con el repo como contexto de design system:
(a) 2–3 exploraciones de dirección DENTRO de los límites de la sección 3
    (variaciones, no estilos distintos);
(b) diseño completo de las 5 secciones, mobile y desktop;
(c) tokens: paleta, escala tipográfica, espaciado, radios — compatibles
    con Tailwind 4;
(d) especificación de micro-interacciones (qué se anima, trigger,
    duración) implementable en framer-motion;
(e) exploración avatar ilustrado vs foto real vs híbrido para la sección
    de confianza, incluyendo propuesta del asset SVG de los avatares.
Entregable: diseño + tokens implementables por Claude Code sin ambigüedad.
NO se le pide código de producción.
