# BITÁCORA

Bitácora del proyecto. Toda sesión de trabajo abre leyendo este archivo.
Entradas en orden cronológico inverso: la más reciente arriba. Ante conflicto
entre documentación e instrucciones, manda la entrada más reciente de esta
bitácora.

---

# Entrada 10 — Fase 3, sub-etapa 3.3a: rediseño de Hero y Footer

Fecha: 2026-07-27. Fase: 3 — implementación, sub-etapa 3.3a.
Rama: fase3/secciones-hero-footer (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel.

Primeras dos **secciones de contenido** migradas a Señal. Son las más simples
del sitio a propósito: fijan el patrón que consumen 3.3b (Servicios +
Contacto) y 3.3c (Confianza). No se tocó `Services`, `Team`, `TeamMemberCard`
ni `Contact`. No se implementó spotlight, atmósfera de fondo ni avatares
(eso es 3.4).

## Qué se hizo

**1. Hero: de tres campos de texto a dos.** El hero tenía título + subtítulo +
descripción, y los tres competían. Con el copy aprobado (DESIGN-SPEC §10) el
H1 ya carga la propuesta de valor completa ("del brief al deploy" dice el
alcance) y el subtítulo dice a quién sirve; la descripción vieja ("físicos,
matemáticos, ingenieros y estadísticos... IA, ML y Cloud") era jerga de
capacidades, no beneficio para pyme. **Se eliminó `hero.description`** del
componente y de ambos locales. Verificado antes de borrarla que ningún otro
componente la referenciaba.

**2. H1 tipográfico, sin ornamento.** Fuera `bg-neon-gradient` +
`animate-glow`. Ahora `text-[clamp(2rem,7vw,3.25rem)]` con `--text-display`
(3.25rem) como techo, peso 700, `--color-text`. Nota de implementación para
las siguientes etapas: **la utilidad arbitraria `text-[clamp(...)]` no hereda
los modificadores del token** (`--text-display--line-height/-letter-spacing`),
así que `leading-[1.06]` y `tracking-[-.03em]` van explícitos. `text-balance`
en el H1 y `text-pretty` en el subtítulo.

**3. Subtítulo sin acento.** Era `text-neon-cyan` a `text-3xl/4xl`, es decir,
un segundo titular de color. Ahora `--color-text-muted`, `--text-lg/xl`, peso
medio: texto de apoyo. Coherente con DESIGN-SPEC §1 — el acento solo marca
acción, y en el hero la única acción es el CTA.

**4. CTA.** `variant="primary"` (era `neon`), sin `animate-float`. El float
era un loop permanente sobre el único elemento de conversión de la página:
ruido que compite con la interacción real (#3/#4 de la tabla §2, que sí son
puntuales). Sigue haciendo scroll a `#contact`.

**5. Eliminados los elementos decorativos del hero** (tres círculos
`blur-xl animate-pulse` en neon-pink/purple/cyan). No están en la dirección
y `animate-pulse` es un loop no especificado en §2. El hero queda sobre
`--color-bg` limpio; el fondo atmosférico (paths + halo) entra en 3.4.

**6. `background="gradient"` → `"default"`** en `Section`. El alias legacy ya
no tiene consumidores en el hero.

**7. Footer.** `bg-sunset-deep` + `border-sunset-light` → `bg-bg` +
`border-t border-border`. La separación visual con Contacto (que es
`bg-surface`) la da el contraste de superficies, no un borde grueso. Wordmark
tipográfico con **el mismo guion bajo en acento que el nav** (`aria-hidden`),
para que la marca lea igual arriba y abajo. Slogan sin `italic` ni acento
(`--color-text-muted`); copyright en `--color-text-subtle`. Eliminada la línea
decorativa con gradiente neon-purple/pink/orange.

Detalle a11y: el wordmark del footer era un `<h3>` — un encabezado de nivel 3
colgando sin h2 padre, y además no es un encabezado de sección. Pasa a `<p>`.
No se hizo interactivo: el nav ya ofrece el ancla al hero.

**8. Copy i18n del hero** (DESIGN-SPEC §10, literal). CTA nuevo: ES
"Hablemos" / EN "Let's talk". Se cambió el viejo "Conoce más"/"Learn more"
porque no nombraba la acción real (abrir conversación, no leer más), y se
eligió distinto del CTA del nav ("Escríbenos"/"Get in touch") para no repetir
la misma etiqueta dos veces en el mismo viewport.

## Verificación del fold móvil (medida, no estimada)
Servida la build de producción y medido con `getBoundingClientRect()` sobre el
DOM real, viewport 360×640:

| Locale | H1 | Líneas | CTA (top–bottom) | Holgura bajo el fold |
|--------|-----|--------|------------------|----------------------|
| ES | 32px | 3 | 427–487 | 153px |
| EN | 32px | 3 | 441–501 | 139px |

Caso más duro, 360×**560** (barra de navegador móvil real comiendo viewport):
CTA termina en 447, holgura **113px**. El CTA primario queda visible sin
scroll en ambos idiomas con margen; no hizo falta ajustar el clamp.

## Verificación de build
- `npx tsc --noEmit`: pasa, sin salida.
- `npm run build`: pasa. 8 páginas estáticas.
- Advertencia `Invalid literal value, expected false at
  "i18n.localeDetection"`: **sigue igual** (preexistente). **Ninguna
  advertencia nueva.**
- Copy nuevo renderizado en el HTML estático (no clave cruda):
  `grep -o 'del brief al deploy' .next/server/pages/es.html` → 2 (1 renderizado
  + 1 del payload `__NEXT_DATA__`); `'que mueve tu pyme'` → 2; `>Hablemos<` → 1.
  En `en.html`: `'brief to deploy'` → 2, `'runs your small business'` → 2,
  `>Let&#x27;s talk<` → 1.
- `grep -oE 'hero\.[a-zA-Z]+'` sobre ambos HTML: **sin resultados**.
- Copy viejo: sin rastro de "Innovación en Software", "físicos, matemáticos",
  "Conoce más"/"Learn more" en el marcado. **Único match residual: el `<title>`
  de `pages/index.tsx`** — ver pendientes.
- `<h1>` en la página: sigue siendo **1**.

## Pendientes
- **`<title>` del documento sigue siendo copy de Fase 0**: `pages/index.tsx`
  tiene hardcodeado `"Softensor - Software Innovation"`, en inglés en **ambos**
  locales y con el posicionamiento viejo. Es lo que ve Google y la pestaña.
  Fuera del alcance de 3.3a (no se tocó `pages/`), pero debe entrar en 3.3b o
  en una sub-etapa de metadatos junto con `<meta name="description">`, que
  tampoco existe. **Es el pendiente de mayor impacto comercial de la lista.**
- **`footer.slogan` sin cambiar, anotado a propósito**: "Innovación impulsada
  por la ciencia" / "Science-driven innovation" es de Fase 0 y roza con el
  posicionamiento nuevo, que ya no vende ciencia sino ejecución ("ingeniería
  precisa", "el software que mueve tu pyme"). No es contradictorio, pero es el
  último sitio de la página donde sobrevive el encuadre viejo. Alternativas
  alineadas si se decide cambiarlo: ES "Del brief al deploy" / EN "From brief
  to deploy" (eco del H1), o ES "Software que sostiene tu negocio" / EN
  "Software that keeps your business running". Decisión del arquitecto.
- Servicios + Contacto en **3.3b**; Confianza (Team/TeamMemberCard) con
  reescritura estructural en **3.3c**.
- Spotlight de dos niveles + avatares SVG + atmósfera de fondo en **3.4**.
- `aria-label="Toggle menu"` del nav **sigue hardcodeado en inglés** en ambos
  locales (heredado de 3.2). Esta etapa tocó i18n pero solo el bloque `hero`;
  no se añadieron claves fuera de alcance. Sigue pendiente.
- Retiro de Neon Sunset en **3.5**: tokens de `globals.css`, alias legacy
  `Button variant="neon"` y `Section background="gradient"|"dark"`, y el
  **scrollbar** (`::-webkit-scrollbar-thumb` sigue con el gradiente
  purple→pink; se ve como una franja magenta al borde derecho en las capturas
  de este trabajo). Los alias siguen en uso por las secciones sin migrar, así
  que no se pueden borrar hasta cerrar 3.3c.
- Animación de aparición-al-scroll del nav: **ya se puede decidir**. El
  criterio que la Entrada 9 dejó abierto era si el CTA del nav compite con el
  del hero; con el hero rediseñado, ambos son ahora `variant="primary"` con el
  mismo acento sólido y quedan a ~350px de distancia vertical en móvil. Hay
  material para que el arquitecto decida en el preview. Si se implementa,
  **especificar antes en DESIGN-SPEC §2**, no improvisar.

## Archivos tocados
`components/sections/Hero.tsx`, `components/sections/Footer.tsx`,
`public/locales/es/common.json`, `public/locales/en/common.json`,
esta entrada.

---

# Entrada 9 — Fase 3, sub-etapa 3.2: rediseño de Navigation

Fecha: 2026-07-26. Fase: 3 — implementación, sub-etapa 3.2.
Rama: fase3/chrome (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel.

Cierra el `// TODO fase3.2` que la Entrada 8 dejó en `Navigation`: en 3.0 el
componente quedó funcional y con tokens Señal, pero sin jerarquía trabajada y
sin la acción de conversión. No se tocaron secciones de contenido.

## Qué se hizo

**1. CTA de contacto persistente (lo central de la etapa).** `Button
variant="primary"` (acento sólido + `--shadow-glow-sm` en hover, interacción
#3 de DESIGN-SPEC §2) que hace `scrollToSection('contact')`. Visible en
desktop al cierre de la barra y en el menú móvil como acción destacada al
final del panel. Texto por i18n, `t('nav.cta')`.

**2. Jerarquía visual en tres pesos.** El problema real no era añadir el CTA
sino que el selector de idioma competía con él: el locale activo era una
píldora `bg-accent text-accent-contrast`, es decir, un bloque de acento sólido
del mismo peso que tendría el CTA. Con dos acentos sólidos en la barra, el
señalizador de acción (DESIGN-SPEC §1) deja de señalar. Resuelto:
- Navegación de sección — peso medio: `--color-text-muted` → hover
  `--color-accent`.
- Idioma — peso bajo: `es / en` en mono, minúsculas (`uppercase` visual),
  activo en `--color-text`, inactivo en `--color-text-subtle`. Sin fondo.
- CTA — peso alto: **único elemento con acento sólido** de la barra.
- Divisor `w-px bg-border` entre navegación e idioma para separar grupos sin
  añadir peso.
- Wordmark como ancla a la izquierda.

**3. Wordmark.** Sigue siendo tipográfico (Space Grotesk 700, `tracking-tight`),
con el guion bajo de terminal de los mockups en `--color-accent` y `font-mono`
como único detalle, `aria-hidden` (es ornamento, no texto). Estático: no
parpadea; en 3.2 no entra ninguna animación.

**4. Accesibilidad.**
- Hamburguesa: `aria-expanded={isMenuOpen}` y `aria-controls` apuntando al
  `id` del panel (`nav-mobile-menu`); el `svg` pasa a `aria-hidden`.
- Locale activo: `aria-current="true"`, más `lang="es"`/`lang="en"` en cada
  botón para que el lector pronuncie el código en su idioma.
- El wordmark era un `<h1>` con `onClick`: inalcanzable por teclado y, además,
  un segundo `h1` en la página. Ahora es `<button>`. Verificado sobre el HTML
  emitido: la página pasa de dos `h1` a uno solo (el del hero).
- Sin `outline` manual: lo cubre el `:focus-visible` global.

**5. i18n.** Clave nueva `nav.cta` en `public/locales/{es,en}/common.json`
(ES "Escríbenos", EN "Get in touch"). Es la única clave añadida.

## Decisión: sin animación de scroll en el nav
El nav de 3.2 es sticky y siempre visible. No se implementa aparición/
ocultamiento al hacer scroll: DESIGN-SPEC no la especifica y el criterio para
decidirla no existe todavía — depende de si el CTA del nav compite con el CTA
del hero, y el hero se rediseña en 3.3. `backdrop-blur` y borde inferior
quedan como estaban.

## Verificación
- `npx tsc --noEmit`: pasa, sin salida.
- `npm run build`: pasa. 8 páginas estáticas.
- Advertencia `Invalid literal value, expected false at "i18n.localeDetection"`:
  **sigue igual** (preexistente). **No aparece ninguna advertencia nueva**; no
  reaparece `NO_I18NEXT_INSTANCE`.
- CTA por i18n en el HTML estático, no clave cruda:
  `grep -o 'Escríbenos' .next/server/pages/es.html` → 4 líneas `Escríbenos`;
  `grep -o 'Get in touch' .next/server/pages/en.html` → 2 líneas
  `Get in touch`. Del conteo de `es`: 1 es el CTA renderizado del nav, 1 el
  h3 preexistente "Escríbenos por correo" de Contacto y 2 son el payload JSON
  de `__NEXT_DATA__` (en `en` son 1 renderizada + 1 del payload). El CTA del
  menú móvil no aparece porque el panel solo se monta abierto.
  `grep -oE 'nav\.[a-zA-Z.]+'` sobre ambos HTML no devuelve nada.

## Archivos tocados
`components/common/Navigation.tsx`,
`public/locales/es/common.json`, `public/locales/en/common.json`,
esta entrada.

## Pendientes
- **Animación de aparición-al-scroll del nav: diferida.** Se evalúa después
  del rediseño del hero (3.3), con el criterio de si el CTA del nav compite
  con el del hero. Si se decide implementarla, **especificar antes la
  mini-animación con Claude Design** (trigger, propiedad, duración, easing,
  comportamiento bajo `prefers-reduced-motion`) y añadirla a la tabla de
  DESIGN-SPEC §2; no improvisarla en código.
- Colisión leve de copy: el CTA del nav ("Escríbenos") repite el h3
  "Escríbenos por correo" de Contacto, que sigue siendo copy de Fase 0.
  Revisar al migrar el copy aprobado (DESIGN-SPEC §10) en 3.3.
- `aria-label="Toggle menu"` de la hamburguesa sigue hardcodeado en inglés en
  ambos locales. No se tradujo para no añadir claves fuera del alcance de esta
  etapa; corregir cuando se toque i18n de nuevo.
- Sin cambios en los demás pendientes de la Entrada 8 (secciones + spotlight +
  avatares en 3.3; retiro de Neon Sunset y de las claves de variante legacy y
  scrollbar en 3.5; y los heredados de la Entrada 7).

---

# Entrada 8 — Fase 3, sub-etapa 3.0: fundaciones + componentes comunes

Fecha: 2026-07-26. Fase: 3 — implementación, sub-etapa 3.0.
Rama: fase3/fundaciones-comunes (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel.

## Decisión: el sitio es dark-only en este rediseño
Dark/light quedó diferido en Fase 2 (Entrada 7). Se formaliza aquí: no hay
clase `.dark`, no hay toggle, no hay `dark:` en los componentes comunes. El
estilo oscuro es incondicional y sale de los tokens Señal. Reintroducir light
mode sería una fase propia (contraste, glows y spotlight sobre fondo claro).

## Qué se hizo

**1. Eliminado `contexts/ThemeContext.tsx` (bug de SSG).**
El contexto hacía `if (!mounted) return null`: el árbol completo no se
renderizaba hasta que el JS hidrataba en cliente. Verificado en el build: el
HTML estático **no contenía marcado de la app**. Eso anulaba el SSG y con él
el LCP, que es la métrica central del proyecto (objetivo < 2.5s en Android
gama media 4G). Sumado a que dark/light está diferido, era código muerto que
además rompía lo único que la landing tiene que hacer bien. Tras eliminarlo,
`.next/server/pages/es.html` pasa a contener ~16KB de marcado renderizado en
servidor.

**2. Fuentes reales con `next/font/google`** (presupuesto de DESIGN-SPEC §8),
cargadas en `pages/_app.tsx` — en pages router no pueden ir en `_document`:
- Space Grotesk, pesos 500 y 700, subset `latin`, `display: swap`,
  `preload: true`, variable `--font-space-grotesk`.
- JetBrains Mono, **un solo peso: 500**, subset `latin`, `display: swap`,
  `preload: false` (nunca es el hero), variable `--font-jetbrains-mono`.
  La spec pedía "1 peso" sin fijar cuál; se eligió 500 para que labels,
  eyebrows y badges casen con el peso de texto de Space Grotesk.
Las variables se exponen en un `<div>` raíz que envuelve la app, con
`font-sans`. En `globals.css`, `--font-sans`/`--font-mono` las consumen con
fallback dentro del propio `var()` (si la variable faltara, `font-family`
quedaría inválida en tiempo de cómputo y se perdería toda la cascada, no solo
la primera familia). Verificado en el CSS emitido: `@font-face` con
weights 500/700 (Grotesk) y 500 (Mono), y `<link rel="preload">` del woff2 de
Grotesk en el HTML estático.

**3. Fondo y texto base unificados a tokens Señal.** `html`/`body` toman
`--color-bg`, `--color-text` y `--font-sans`, más `color-scheme: dark`. Se
quitó de `pages/index.tsx` el `bg-white dark:bg-sunset-deep` que fijaba el
fondo por fuera de los tokens. Se eliminaron el `* { transition:
background-color, border-color }` global y `.no-transition` (artefactos del
toggle de tema, sin uso).

**4. Componentes comunes migrados a tokens Señal**, sin `dark:`, sin `neon-*`,
`sunset-*`, `animate-glow` ni `bg-neon-gradient`:
- `Button`: `primary` = acento teal sobre `--color-accent-contrast`, hover
  `--color-accent-hover` + `--shadow-glow-sm` (interacción puntual, no loop);
  `secondary`/`outline` = borde `--color-border-strong`. Se quitó el
  `focus:ring-*` propio: el `:focus-visible` global ya lo cubre y el
  `focus:outline-none` lo habría anulado por especificidad.
- `Card`: superficies `--color-surface`/`--color-surface-raised`, borde
  `--color-border`. Fuera el `hover:scale-105` genérico; el hover-lift real va
  con el spotlight de tarjeta en 3.3.
- `Section`: fondos `--color-bg` / `--color-surface`.
- `SectionTitle`: fuera `neonEffect` y `animate-glow`; escala
  `text-3xl md:text-display`, texto `--color-text`, subtítulo
  `--color-text-muted`.

**5. `Navigation` neutralizado** (su rediseño es 3.2): fuera `useTheme` y el
botón toggle ☀️/🌙 en desktop y móvil, `dark:` reemplazado por tokens, misma
estructura y disposición.

## Concesión explícita de esta sub-etapa
`Button`, `Card` y `Section` **conservan las claves de variante legacy**
(`neon`, `gradient`, `dark`) como **alias mapeados a Señal**, porque
`components/sections/*` todavía las pasa y esta sub-etapa no toca las
secciones. No queda estilo Neon en los comunes — solo la clave. Se eliminan
del tipo en 3.3, cuando migren las secciones.

## Hallazgo bloqueante: SSG emite las claves i18n, no las traducciones
Al restaurarse el SSG quedó a la vista un defecto que hasta ahora estaba
enmascarado (con el árbol sin renderizar en servidor no había nada que
traducir): el HTML estático sale con `hero.title`, `services.title`, etc.,
literalmente. El build avisa
`react-i18next:: useTranslation: ... NO_I18NEXT_INSTANCE`.

Causa verificada: los componentes importan `useTranslation` de
`'react-i18next'` (build ESM), mientras `appWithTranslation` monta el
`I18nextProvider` de la **copia CJS** que trae `next-i18next`. Son dos
instancias del módulo → dos contextos de React → `t()` devuelve la clave. No
es duplicación de versiones (`npm ls` da 16.3.5 deduplicado) ni init asíncrono
del i18next de servidor (probado: inicializa síncrono y traduce). En cliente
el bundle resuelve a una sola copia, por eso el sitio "se veía bien" en el
navegador.

Confirmado por experimento: cambiar **solo** el import de `Navigation` a
`from 'next-i18next'` hace que el HTML estático pase de `nav.home` a
`Inicio`, mientras las secciones siguen emitiendo claves. Ese cambio queda
aplicado en `Navigation`; el resto son secciones y esta sub-etapa no las toca.

Impacto: el primer paint del HTML estático muestra claves y los crawlers
indexan claves — con el LCP como métrica central, esto invalida el preview
como gate visual hasta corregirlo. **Arreglo: una línea de import por
archivo** en `Hero`, `Services`, `Team`, `TeamMemberCard`, `Contact`,
`Footer`. Debe ser lo primero de 3.3, o un fix aparte antes del preview.

**RESUELTO (2026-07-26, misma rama).** Aplicado el cambio de import a las 6
secciones (solo esa línea; el rediseño visual sigue siendo 3.3). Verificado
sobre el HTML emitido, no solo sobre el build:
`grep -oE '(hero|services|team|contact|footer|nav|values)\.[a-zA-Z.]+'
.next/server/pages/es.html` no devuelve nada, y el marcado estático de `es`
trae "Innovación en Software / Transformamos ideas en soluciones
tecnológicas" y el de `en` "Software Innovation / We transform ideas into
technological solutions". La advertencia `NO_I18NEXT_INSTANCE` desapareció del
build. El SSG ya es validable en el preview. (El copy sigue siendo el de Fase
0; el aprobado en DESIGN-SPEC §10 entra en 3.3.)

## Verificación
- `npx tsc --noEmit`: pasa, sin salida.
- `npm run build`: pasa. 8 páginas estáticas generadas.
- Advertencia `Invalid literal value, expected false at "i18n.localeDetection"`:
  **sigue igual** (preexistente, no introducida ni resuelta aquí). No aparecen
  advertencias nuevas más allá del `NO_I18NEXT_INSTANCE` descrito arriba, que
  no es nueva en el código sino recién visible.

## Archivos tocados
`pages/_app.tsx`, `pages/index.tsx`, `styles/globals.css`,
`components/common/{Button,Card,Section,SectionTitle,Navigation}.tsx`,
eliminado `contexts/ThemeContext.tsx` (y el directorio `contexts/`, ya vacío),
esta entrada.

## Pendientes
- ~~Corregir el import de i18n en las 6 secciones~~ — hecho y verificado sobre
  el HTML emitido (ver arriba). Ya no bloquea el preview.
- Rediseño completo de `Navigation` a Señal → **3.2**.
- Secciones (Hero, Servicios, Confianza, Proceso, Contacto), spotlight de dos
  niveles y avatares SVG → **3.3**.
- Retiro de la paleta Neon Sunset de `globals.css` (tokens, `@keyframes glow`,
  `.bg-neon-gradient`, `.bg-sunset-gradient`) y de las claves de variante
  legacy → **3.5**.
- Scrollbar personalizado sigue en gradiente Neon (magenta/púrpura) sobre el
  fondo `#07090A`: chirría visualmente, se retoca en 3.5.
- Sin cambios en los pendientes heredados de la Entrada 7 (curaduría de
  proyectos con David, sesión de fotos, animación de capas del avatar,
  `softensor.com` sin conectar a Vercel).

---

# Entrada 7 — Fase 2: diseño (cierre de compuerta)

Fecha: 2026-07-24. Fase: 2 — diseño. Rama: fase2/diseno.
Estado de compuerta: **CERRADA**.

## Dirección elegida
**Señal** (dark-tech sobre grid suizo), de tres exploraciones evaluadas en
Fase 2: **Rejilla / Señal / Halo**. Acento teal `#00C2A8` como señalizador
funcional fijo; atmósfera (teal→cian→azul) ciclando solo en decorativo.

## Decisiones tomadas
- **Acento ámbar descartado** por proximidad a la identidad de Anthropic →
  se adopta **teal `#00C2A8`**.
- **Acento funcional fijo + atmósfera decorativa ciclando**: separación
  deliberada. El acento marca "esto es acción" y su reconocimiento sostenido
  sostiene la conversión; si rotara, se degradaría el señalizador. La
  atmósfera respira solo en paths de fondo y halo global.
- **Spotlight extendido a dos niveles** (global ~600px, tarjeta ~300px),
  diferenciados por **escala y nitidez, no por color**. El halo es un div con
  gradiente estático movido por `transform`; nunca se repinta el viewport.
- **Confianza resuelta como híbrido**: card colapsada → expansión apilada
  (`grid-template-rows` 0fr→1fr, tarjetas traseras por `translateY+scale`) con
  **foto opcional** (la landing sale a producción sin sesión de fotos).
- **Copy corregido** de "ingenieros" a **matemático + físico full-stack**, por
  precisión factual y por fricción de confianza en el mercado colombiano.
- **Avatares diferenciados por dispositivo**: seguimiento de cursor en
  desktop, **mirada errante por timer (`setTimeout` encadenado)** en táctil,
  más reacción al tap en ambos. Motivo: en móvil el avatar quedaba reducido a
  un parpadeo aislado, que **lee como fallo antes que como vida**. El rango
  (`clamp ±2.5`) y el mecanismo (`motionValue` + spring sobre `transform`) son
  idénticos; solo cambia la **fuente del valor**, así que no añade superficie
  de implementación.

## Decisiones diferidas
- **Demos interactivas de producto** → fase posterior. Enfoque preferido:
  secuencia de imágenes con drag/scroll; alternativa: video en loop. Ambas
  evitan runtime 3D, así que la decisión de Fase 1 (cero 3D) queda intacta.
- **Pantalla de carga descartada** para la landing (SSG: no hay espera real
  que cubrir y competiría con el LCP). Reconsiderable como loader dentro de la
  sección interactiva cuando exista una espera genuina.
- **Dark/light mode diferido**: duplicaría la superficie de verificación de
  contraste y exigiría rediseñar glows y spotlight sobre fondo claro.

## Nota técnica
Tokens de la dirección Señal añadidos de forma **aditiva** a
`styles/globals.css` (bloque delimitado por comentarios). La paleta **Neon
Sunset sigue viva**: 88 referencias en 12 archivos de `components/` y `pages/`
aún dependen de ella. Se retira en un **commit de limpieza al cerrar Fase 3**,
cuando ningún componente la use. Ver `docs-claude/DESIGN-SPEC.md` (insumo de
Fase 3) para el contrato completo.

Corrección aplicada dentro de esta fase: **todos los campos de texto visible
en `config/team.ts` y `config/projects.ts` van por i18n**, ninguno queda como
literal (habrían quedado en español dentro de la versión EN). `discipline`
**reutiliza el bloque `team.roles` preexistente** en lugar de duplicar
traducciones; `role` pasa a la clave compartida `team.founderRole`; `sector`
usa el nuevo bloque `projects.sectors`. `year` y `metric.value` se mantienen
literales (números/símbolos, no prosa traducible).

## Qué se hizo (esta rama)
- `styles/globals.css`: bloque aditivo de tokens Señal (superficies, texto,
  acento fijo, atmósfera, tipografía, escala, radios, easings, glows),
  duraciones en `:root`, mecanismo de atmósfera (cross-fade opacity), foco
  `:focus-visible` y `prefers-reduced-motion`.
- `config/team.ts` y `config/projects.ts`: nuevos, mismo patrón array-de-
  configuración que `contactChannels.tsx`; `tagline`/`bio`/`title`/`summary`
  como claves i18n, no literales.
- Traducciones ES/EN en `public/locales/{es,en}/common.json`
  (`team.members.*`, `projects.*`).
- `docs-claude/DESIGN-SPEC.md`: especificación técnica que consume Fase 3.
- Esta entrada de bitácora.

## Pendientes (se agregan a la lista global)
- Implementación de componentes (**Fase 3**).
- Curaduría de proyectos reales con David (los casos en `projects.ts` son
  placeholder).
- Sesión de fotos opcional (interface `photo?` ya declarada).
- Animación de capas del avatar más allá de los ojos (cejas, boca, pelo),
  pendiente del asset ilustrado final. La estructura SVG ya las declara como
  grupos separados, así que añadirlas después no requiere rediseñar el asset.
- `softensor.com` aún sin conectar a la cuenta Vercel de marca (Entrada 4/5).

---

# Entrada 6 — Limpieza: documentación obsoleta de CONTACT_EMAIL

Fecha: 2026-07-23. Fase: ninguna (limpieza de documentación).
Rama: docs/limpieza-contact-email.

## Qué se hizo
Eliminadas las referencias a CONTACT_EMAIL como variable de entorno en
.env.example y docs-claude/DOCKER.md. Ambas mostraban además el
placeholder obsoleto info@softensor.com, ya reemplazado en código por la
Entrada 5.

## Por qué (decisión)
El código no lee CONTACT_EMAIL de process.env: es un literal en la
constante de config/contactChannels.tsx. La documentación describía un
mecanismo de configuración inexistente — trampa para quien la siguiera.
Se optó por ELIMINAR en vez de alinear, y explícitamente por NO
implementar lectura desde entorno: un correo de contacto público no es
secreto, no varía por entorno, y moverlo a env agregaría un modo de fallo
(variable ausente en Vercel → correo vacío en producción) sin beneficio.
El literal en constante única se mantiene como decisión de diseño.

## Estado de compuertas
Ninguna se altera. Fase 0 sigue CERRADA (Entrada 5). Fase 1 CERRADA
(Entrada 3). Fase 2 aún no comienza. Esta entrada es housekeeping.

---

# Entrada 5 — Fase 0: cierre de compuerta (correo de contacto real)

Fecha: 2026-07-23. Fase: 0 — infraestructura de conversión.
Rama: fase0/contact-email.

## Qué se hizo
- Reemplazado el placeholder `info@softensor.com` por el correo real y
  funcional `softensordev@gmail.com` en la constante CONTACT_EMAIL de
  config/contactChannels.tsx. El canal de contacto directo (mailto)
  queda operativo end-to-end por primera vez.
- Verificado: tsc --noEmit y build en verde; textos visibles siguen
  pasando por i18n ES/EN; el correo vive en config, no en los JSON de
  locales.

## Decisión y su carácter transitorio
`softensordev@gmail.com` es el mismo correo de identidad de servicios
creado en la Entrada 4 (login de GitHub y Vercel de marca). Se adopta
TAMBIÉN como correo de contacto público para desbloquear la compuerta de
Fase 0, que llevaba abierta desde la Entrada 1 por falta de un buzón real.

Limitación declarada y aceptada: un Gmail gratuito como canal de contacto
público resta credibilidad frente a un correo del dominio propio
(`info@softensor.com` o similar) ante decisores de pyme — precisamente el
público al que la landing debe proyectar solvencia. Se acepta como
solución transitoria porque un buzón real que funciona es estrictamente
mejor que un placeholder que rebota, y porque el costo de migrar después
es trivial: el correo está centralizado en una única constante.

PENDIENTE derivado: migrar a correo del dominio cuando se centralice
Hostinger (ver Entrada 4: la centralización se difirió a la renovación
del dominio). Al hacerlo, el cambio es de una sola línea en
config/contactChannels.tsx.

## Estado de compuerta de Fase 0
CERRADA. El bloqueante único que quedaba (correo real en CONTACT_EMAIL,
registrado en Entradas 1, 2 y 4) queda resuelto. Fase 0 completa.

## Qué NO cambia
- Fase 1 sigue cerrada (Entrada 3). Fase 2 aún no comienza.
- El pendiente de infraestructura de la Entrada 4 sigue abierto:
  `softensor.com` NO está conectado a la cuenta Vercel de marca (bloqueado
  por el Remove que debe hacer David). Consecuencia vigente: este cambio,
  al llegar a main, NO se refleja en el dominio público hasta que ese
  bloqueo se destrabe. La producción real la sigue sirviendo el proyecto
  Vercel de David.

---

# Entrada 4 — Infraestructura: migración y centralización a cuentas de marca

Fecha: 2026-07-18. Fase: ninguna (infraestructura, ortogonal a las Fases
0/1/2/3). Rama: develop.

Entrada puramente de infraestructura (cuentas y hosting). NO altera ninguna
fase ni el estado de ninguna compuerta.

## Qué se hizo (verificado)
- Cuentas de marca creadas bajo el correo `softensordev@gmail.com` (Gmail
  gratuito como identidad de servicios; NO es aún el correo de contacto
  público — ese sigue pendiente, ver abajo):
  - GitHub: cuenta `softensordev`.
  - Vercel: cuenta `softensordev`, plan Hobby.
- Repositorio migrado de `DavidOlmos03/softensor` a `softensordev/softensor`
  por clonación espejo (`git clone --mirror` + `git push --mirror`). Se
  migraron todas las ramas (main, develop, luis, fase0/contacto-directo,
  fase1/design-brief) y el historial completo de commits. NO se migraron
  los objetos de Pull Request de GitHub (`refs/pull/*`): los PRs históricos
  (incluido el #3 del fix CVE) quedan referenciados por número en los
  mensajes de commit, no como objetos navegables.
- Proyecto nuevo en la cuenta Vercel de marca importando
  `softensordev/softensor`. Deploy de main verde y preview de develop verde:
  pipeline completo validado en la infraestructura de marca (GitHub de marca
  → Vercel de marca).

## Corrección explícita de la Entrada 2
El plan de la Entrada 2 ("David transferirá el proyecto desde su cuenta
personal" vía Transfer Project de Vercel) NO se ejecutó: David descartó la
transferencia. En su lugar se hizo la migración por clonación descrita
arriba. Por la regla "manda la entrada más reciente", esta entrada anula ese
plan de transferencia. El pendiente de Entrada 2 "configurar previews sobre
develop en la cuenta nueva" queda RESUELTO (previews ya funcionan en la
cuenta de marca).

## Decisiones de infraestructura tomadas en esta migración
- Correo de marca: `softensordev@gmail.com` es la identidad para login de
  servicios (Vercel, GitHub). El correo de contacto público
  (`info@softensor.com` o el que se defina) sigue PENDIENTE y se resolverá
  cuando se centralice Hostinger. El placeholder `CONTACT_EMAIL` en el
  código sigue sin correo real válido: sigue siendo bloqueante para el
  cierre total de Fase 0 (no se ha tocado).
- Hostinger: se decidió NO migrar la cuenta de Hostinger por ahora; se
  centralizará más adelante (candidato: en la renovación del dominio, para
  no operar bajo presión de fecha). Luis no tiene acceso a Hostinger: las
  configuraciones de DNS las ejecuta David.
- DNS del dominio: se detectó configuración de nameservers inválida (mezcla
  de 2 de Hostinger `dns-parking` + 2 de Vercel `vercel-dns`, condición de
  carrera que probablemente explica la desincronización histórica del
  dominio mencionada en Entrada 0). NO CORREGIDA AÚN. El dominio
  `softensor.com` sigue apuntando al proyecto Vercel viejo de la cuenta de
  David y NO está conectado a la cuenta de marca. Bloqueante: requiere que
  David haga Remove del dominio en su proyecto Vercel, paso que a la fecha
  de esta entrada no se ha ejecutado. Método acordado cuando se destrabe
  (preferencia de David): delegación DNS completa a nameservers de Vercel —
  David hace Remove, Luis hace "Move to team", Vercel asigna los nameservers
  definitivos y David los configura en Hostinger. Camino alternativo
  evaluado y descartado por falta de acceso: registros A + TXT de
  verificación con la zona DNS en Hostinger (recomendación del arquitecto
  por mantenibilidad y correo futuro, pero requiere acceso a Hostinger que
  Luis no tiene).
- Acceso al repo de marca: la cuenta personal de GitHub de Luis se mantiene
  como colaborador con permisos de escritura del repo `softensordev/softensor`,
  para continuidad de su flujo de trabajo y para que el Project de claude.ai
  (que lee de su cuenta personal) siga funcionando.
- Data Preferences de Vercel: el toggle "Improve models with this project's
  data" (compartía código con proveedores de IA para entrenamiento) fue
  desactivado a nivel de proyecto y de team. Hecho.

## Pendientes (se agregan a la lista global)
- Conectar `softensor.com` a la cuenta Vercel de marca (bloqueado por el
  Remove de David). Consecuencia mientras tanto: lo que se despliegue a main
  desde la cuenta de marca NO llega al dominio público; producción real
  sigue servida por el proyecto Vercel de David.
- Correo de contacto público real (sigue bloqueando el cierre total de
  Fase 0).

## Qué NO cambia
Ninguna fase se altera. Fase 0 sigue con su compuerta pendiente por el
correo real. Fase 1 sigue cerrada (Entrada 3). Fase 2 aún no ha comenzado.
El flujo de ramas (develop como integración, PR semanal a main) sigue igual,
solo que ahora sobre el repo y el Vercel de marca.

# Entrada 3 — Fase 1: design brief (cierre)

Fecha: 2026-07-17. Fase: 1 — design brief. Rama: fase1/design-brief.

## Decisiones tomadas (sesión de arquitectura)
- 3D: DESCARTADO todo runtime 3D (Spline, Rive, three.js custom). Razones:
  Spline ~2MB de runtime opaco para un efecto desktop-only; three.js custom
  = días de trabajo sin evidencia de mejora de conversión B2B; Rive viola
  la regla de framer-motion como único sistema 2D. La regla "máximo un
  runtime 3D" queda como techo, no como cuota. Un hero que carga
  instantáneo es mejor señal de competencia técnica que un 3D lagueando
  en móvil de gama media.
- Rama luis (evaluación conceptual, código verificado clonando la rama):
  venom-beam y particles descartados (three.js / canvas+rAF persistente);
  spotlightcard y background-paths aprobados como concepto (ya son
  framer-motion/SVG puros); expandable-cards anotado como patrón candidato.
  Nada se mergea de la rama (decisión previa sin cambios).
- Herramienta de Fase 2: ratificado Claude Design. Evaluadas y descartadas
  como herramienta principal: Replit y Manus (generan código/hosting
  propios, incompatible con el flujo diseño→Claude Code sobre stack fijo);
  Awwwards/Dribbble quedan solo como fuente de referencias; Aceternity/
  uiverse descartadas (copy-paste de componentes, y Aceternity es el
  cliché del que se busca diferenciación).
- Dirección visual: minimalismo funcional + tipografía fuerte (suizo) +
  capa dark tech sutil + bento grid en servicios. Descartados como
  sistema: glassmorphism, liquid glass, claymorphism, maximalismo,
  brutalismo, neumorphism, UI espacial.
- Identidad: internacional neutra (mercado incluye exterior, de ahí el
  EN). Lo colombiano queda como dato de confianza, no como tema visual.
- Elemento distintivo: avatares ilustrados 2D interactivos (SVG +
  framer-motion) en vez de avatar 3D. La referencia 3D evaluada
  (portfolio davidhckh 2025: three.js+GSAP+GLSL+Lenis+Howler) se descartó
  por costo estructural de performance. Decisión avatar vs foto vs
  híbrido queda abierta para Fase 2.
- Proyectos/casos: se diseña la sección con datos extensibles por array y
  placeholder realista. Curaduría de casos reales pendiente con David
  (candidatos: proyectos de Luis, página de divulgación científica de
  David, y softensor.com mismo).

## Qué se hizo (esta rama)
- Creado docs-claude/DESIGN-BRIEF.md: brief aprobado por Luis, insumo
  único para Fase 2 (Claude Design).
- Esta entrada de bitácora.

## Estado de compuerta de Fase 1
CERRADA en decisión: brief aprobado por Luis + decisión 3D asentada
(2026-07-17). Pendiente mecánico: merge --no-ff de esta rama a develop
por Luis. Nota de riesgo: la regla temporal "máximo UNA fase sin deploy
verde en develop" (Entrada 2) se refiere a fases con código; esta rama
es solo docs y no cambia el build, se considera fuera de esa cuenta.

## Pendientes (se agregan a la lista global)
- Curaduría con David de qué proyectos mostrar en la sección confianza.
- Decisión avatar vs foto vs híbrido (se toma en Fase 2 viendo las
  exploraciones de Claude Design).
- Asset SVG de los avatares (encargar / generar+vectorizar / explorar
  con Claude Design).

# Entrada 2 — Fase 0: cierre parcial / transición de flujo

Fecha: 2026-07-16. Fase: 0 — cierre parcial / transición de flujo.
Rama: develop.

## Hallazgo crítico: pipeline de deploy de Vercel roto (RESUELTO el mismo día)
- Registro histórico: el pipeline estaba roto desde el 2025-12-22
  (commit "application with docker", único deploy a Production fallido).
  Todos los deployments posteriores, incluidos los previews, fallaban.
- Producción servía la versión del 2025-11-30.
- RESUELTO (2026-07-16, mismo día del hallazgo): David mergeó el PR #3
  ("Fix React Server Components CVE vulnerabilities", commit 7d36edc),
  que actualiza dependencias afectadas por CVEs de React Server
  Components. Con eso el deploy a Production volvió a verde y producción
  quedó actualizada por primera vez desde el 2025-11-30.
- Causa raíz de los builds fallidos: las dependencias vulnerables que el
  pipeline de Vercel rechazaba. Inferencia fuerte a partir del nombre y
  contenido del PR #3, NO verificada contra build logs.
- Diagnóstico con build logs: resuelto por el PR #3; los build logs ya
  no son necesarios para esto.
- El fallo del preview de fase0/contacto-directo era señal del mismo
  problema, NO un error introducido por la Fase 0.

## Decisión de infraestructura (pendiente de ejecutar en reunión del fin de semana)
- Se creará un correo de la marca. Verificar primero en Hostinger si
  existe buzón o forwarding para softensor.com (el `info@softensor.com`
  del código es placeholder no verificado).
- Con ese correo se creará una cuenta de Vercel del proyecto, a la que
  David transferirá el proyecto desde su cuenta personal.
- Descartados: compartir credenciales personales y transferir a la
  cuenta personal de Luis.

## Nuevo flujo de ramas
- Se crea la rama `develop` como línea de integración permanente.
- Entre semana: ramas de fase (`faseN/...`) desde develop, aprobación en
  local, `merge --no-ff` a develop.
- Cada fin de semana (reunión Luis+David): PR de develop a main,
  revisión conjunta, merge = deploy a producción.
- La rama luis permanece congelada como archivo de referencia (decisión
  previa sin cambios, ver Entrada 0).
- Las ramas de fase NO se borran hasta que su contenido llegue a main.

## Regla temporal de riesgo
Mientras no haya cuenta de Vercel operativa: máximo UNA fase sin deploy
verde acumulada en develop. Al existir la cuenta, se activarán preview
deployments sobre develop como validación continua y esta regla se
reemplaza.

## Estado de compuerta de Fase 0
Código aprobado por arquitecto, tsc y build local en verde, mergeado a
develop. PENDIENTE para cierre total: deploy verde en Vercel y merge a
main, bloqueado únicamente por la reunión del fin de semana (el
pipeline quedó resuelto el mismo día, ver hallazgo).

## Pendientes (se agregan a la lista global)
- ~~Diagnóstico del pipeline con build logs de Vercel~~ — RESUELTO el
  mismo día por el PR #3 (ver hallazgo arriba).
- Ratificar en reunión el protocolo de corrección post-PR: fix desde
  develop, merge a main apenas esté verde, sin esperar al siguiente
  domingo.
- Configurar previews sobre develop en la cuenta nueva.

Nota (mismo día): develop ya contiene tanto la Fase 0 como el fix del
PR #3 (verificado en el grafo de git: el merge 7c66f41 tiene ambos como
ancestros), por lo que la regla temporal de riesgo parte de una base
sincronizada con main.

---

# Entrada 1 — Fase 0: contacto directo

Fecha: 2026-07-15. Fase: 0 — contacto directo. Rama: fase0/contacto-directo.

## Qué se hizo
- Creado `config/contactChannels.tsx`: constante `CONTACT_EMAIL`
  (placeholder `info@softensor.com`), interfaz `ContactChannel` y array
  `contactChannels` con el canal email (mailto con subject prellenado vía
  `encodeURIComponent` sobre la clave i18n). Se añadió un campo opcional
  `detail?: string` a la interfaz para mostrar el dato copiable (correo,
  y en el futuro teléfono de WhatsApp) sin lógica por-canal en el JSX.
- Reescrito `components/sections/Contact.tsx`: eliminados el `<form>`
  (submit era console.log + alert), `useState`, handlers y el bloque de
  links muertos (github.com/linkedin.com genéricos). Ahora renderiza
  `contactChannels.map()` como tarjetas `<a>` nativas (Card gradient
  envuelto en `<a>`), sin JS de navegación. Grid 1 col mobile / 2 cols md+;
  la variante Tailwind `only:` centra la tarjeta cuando hay un solo canal.
  El correo se muestra visible y seleccionable (`select-all`) dentro de la
  tarjeta.
- Locales ES/EN (`public/locales/{es,en}/common.json`):
  - Eliminadas: `contact.email`, `contact.message`, `contact.send`
    (verificado por grep que solo las usaba el Contact.tsx viejo).
  - Añadidas: `contact.channels.email.{label,description,aria,subject}`.
    Subject sin pre-encodear en el JSON.

## Decisiones
- Canal único email con correo placeholder `info@softensor.com` (cambiar
  cuando exista el correo real de la marca).
- Estructura extensible por array de configuración: agregar WhatsApp o
  LinkedIn = añadir UN objeto a `contactChannels`, cero cambios en el JSX
  de Contact.tsx (verificado: el JSX solo itera el array).
- Tracking de clicks por canal: diferido a la decisión de analytics en
  Fase 1 (ver Entrada 0).

## Decisiones posteriores a la implementación (misma sesión, 2026-07-15)
- Analytics: decidido Umami Cloud plan Hobby (open source MIT, tier
  gratuito con eventos personalizados, sin cookies → sin banner de
  consentimiento, script ~2KB). Implementación en fase corta posterior
  vía atributos `data-umami-event` en las tarjetas de canal. PENDIENTE:
  consulta con David antes de crear la cuenta. Alternativa documentada
  si algún día se quiere data en casa: Umami self-hosted (Vercel +
  Postgres Neon free), mismo producto, migración por export. Descartados:
  Vercel Analytics free (no incluye eventos custom, solo pageviews) y
  GA4 (no open source, script ~70KB, banner de consentimiento).
- Flujo de aprobación oficial: rama corta por fase con patrón
  `faseN/descripcion` (ej. fase0/contacto-directo) → pruebas locales de
  Luis → push → preview deployment automático de Vercel → aprobación
  conjunta Luis+David sobre la URL del preview → PR a main → merge
  (= deploy a producción) → borrar rama. La rama luis NO se usa como
  rama de integración: queda congelada como archivo de referencia.
- Git: los commits y push los ejecuta siempre Luis; Claude Code deja
  los cambios en working tree y propone mensajes. Regla persistida en
  ~/.claude/CLAUDE.md global.

## Verificación
- `npx tsc --noEmit`: cero errores. `npm run build`: exitoso; se generan
  `/es` y `/en` (SSG). Warning de Next preexistente: `i18n.localeDetection`
  inválido en next.config.js para Next 16 (espera `false`); no introducido
  por esta fase.
- Nota: el HTML prerenderizado sigue llegando casi vacío porque
  `ThemeContext` no renderiza hijos hasta `mounted` (CSR puro, problema
  conocido de Entrada 0, fuera del alcance de Fase 0). Verificado en
  navegador (producción local): mailto correcto con subject codificado en
  ES y EN, tarjeta centrada, correo visible.

## Estado de compuerta
PENDIENTE: pruebas manuales de Luis (mailto móvil ES/EN, correo copiable
en desktop), revisión de código del arquitecto, aprobación de David sobre
preview de Vercel. La fase se cierra solo con el merge a main.

## Pendientes
- Correo real de la marca (reemplazar placeholder en contactChannels.tsx).
- Número de WhatsApp de negocio.
- Consultar Umami Cloud con David.
- Verificar con David el plan de la cuenta Vercel (Hobby es solo uso no
  comercial según sus términos — riesgo de política para una landing
  comercial).
- Cambiar localeDetection a false en next.config.js y
  next-i18next.config.js (Next 16 solo acepta false; hoy true genera
  warning en build).
- Problema CSR/SEO por ThemeContext.tsx:45 (HTML prerenderizado llega
  vacío).

---

# Entrada 0 — Contexto de decisiones (origen: sesión de planeación, jul 2026)

Fecha: 2026-07-15

## Diagnóstico inicial del sitio/repo (branch luis)
- Contact.tsx: el submit era console.log + alert. El form NUNCA envió nada.
  El dato "casi nadie usa el form" se confirmó luego con abandono real, y se
  decidió eliminarlo — pero el bug explica por qué nunca llegó un lead.
- Ya hay 3 sistemas de animación cargados: three.js (venom-beam),
  framer-motion, embla-carousel. Los componentes de components/ui
  (particles, spotlight, venom-beam, background-paths) son estilo
  21st.dev/Aceternity. Regla acordada: framer-motion único sistema 2D,
  máximo UN runtime 3D en producción.
- SEO casi nulo: el HTML de softensor.com llega vacío (CSR puro). Pendiente
  aprovechar SSG/SSR de Next en el rediseño.
- El dominio en producción está desincronizado de la branch luis (sin PR aún).

## Decisiones de herramientas
- Claude Design (beta, claude.ai/design) para la Fase 2: se le dará el repo
  como fuente del design system. Advertencia: comparte límites de uso con
  chat y Claude Code → llegar siempre con brief cerrado, no iterar a ciegas.
- Spline: candidato para la escena 3D del hero, PERO su runtime es un
  renderer WebGL adicional e independiente del three.js existente. Si se
  elige: máximo 1 escena, lazy load con next/dynamic ssr:false, fallback
  estático en móvil, gate Lighthouse mobile ≥ 80. Alternativas en evaluación:
  Rive (runtime ~100KB, vectorial) o escena three.js custom (cero deps nuevas).
  Decisión pendiente → se toma en Fase 1.

## Historia del plan de contacto (para no repetir el ciclo)
1. Plan original: form real con API route + Resend + Cloudflare Turnstile.
2. Descartado: David reportó abandono alto del form; se prefirió contacto
   directo de baja fricción.
3. Estado actual: solo mailto al correo de la marca. WhatsApp se consideró
   y quedó aplazado (definir número de negocio). Redes sociales no existen
   aún; crear LinkedIn de empresa es el candidato natural para B2B pymes.
4. Cal.com (agendar llamada) quedó como opción futura de conversión.

## Reparto de accesos
- Vercel y Hostinger: David. Luis pide cambios puntuales (ej. registros DNS)
  en vez de credenciales.
- Repo: ambos. Ramas cortas por fase desde main, merge solo tras compuerta.

## Decisión: destino de la rama luis (2026-07-15)
- Descarte funcional: NO se mergea a main ni se cherry-pickea. La rama queda
  intacta en el remoto como archivo de referencia.
- Razones: (a) su único commit introduce en producción los 3 sistemas de
  animación que la regla de arquitectura elimina (three.js/venom-beam,
  embla-carousel, componentes Aceternity); (b) todo su contenido es visual y
  la Fase 2 (rediseño) lo redefine; (c) es un commit monolítico sin
  granularidad para cherry-pick útil; (d) toca Contact.tsx, en conflicto con
  la Fase 0.
- Sus componentes ui/ (venom-beam, particles, spotlight) quedan como
  candidatos evaluables en Fase 1 para la dirección visual. La rama se borra
  solo cuando Fase 3 esté mergeada y nada de ahí se haya necesitado.
- Tracking de clicks por canal: DIFERIDO. El diseño sendBeacon + API route
  con logs a stdout no sirve en Vercel (retención de runtime logs ~1h en
  plan hobby). La medición requiere decisión de analytics en Fase 1.
