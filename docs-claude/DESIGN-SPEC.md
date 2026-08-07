# Design Spec — Dirección "Señal" (insumo de Fase 3)

Estado: APROBADO por Luis (Fase 2 cerrada, 2026-07-24).
Este documento es la especificación técnica que **Fase 3 (implementación) consume**.
Los tokens ya viven en `styles/globals.css` (bloque `DIRECCIÓN SEÑAL`, aditivo).
Esta spec NO implementa componentes: describe el contrato que deben cumplir.

Fuente del design system: el repo. Insumo previo: `docs-claude/DESIGN-BRIEF.md`
(Fase 1). Ante conflicto, manda la entrada más reciente de `BITACORA.md`.

---

## 1. Dirección visual

**Señal**: dark-tech sobre grid suizo. Jerarquía por tipografía y retícula,
no por ornamento. Fondo oscuro (`--color-bg #07090A`), superficies elevadas
sutiles, bordes de bajísimo contraste (`--color-border` 8%).

**Acento teal `#00C2A8` fijo, como señalizador de acción.** El acento
funcional **nunca rota**: aparece solo donde hay una acción (CTA, foco, enlace
activo, chip interactivo). Su reconocimiento sostenido es lo que convierte —
si el color de "esto es clicable" cambiara, se degradaría el señalizador.

**La atmósfera cicla solo en lo decorativo.** El color que respira
(teal → cian → azul, `--color-atmo-1/2/3`) vive únicamente en capas
decorativas: paths SVG de fondo y halo global del spotlight. Nunca toca un
elemento accionable. Separación deliberada: **acento = acción (fijo),
atmósfera = ambiente (ciclo)**.

Ámbar descartado en Fase 2 por proximidad a la identidad de Anthropic
(ver BITACORA). Dark/light mode diferido.

---

## 2. Tabla de micro-interacciones

| # | Animación | Trigger | Propiedad animada | Duración | Easing | GPU-puro |
|---|-----------|---------|-------------------|----------|--------|----------|
| 1 | Atmósfera (cross-fade 3 capas) | montaje / loop | `opacity` | `--dur-atmo` (24s) | linear | ✅ |
| 2 | Reveal de sección | scroll (in-view) | `opacity`, `transform` | `--dur-slow` (400ms) | `--ease-out` | ✅ |
| 3 | CTA hover (glow) | hover | **`box-shadow`** | `--dur-base` (200ms) | `--ease-standard` | ❌ **no-compositada** |
| 4 | CTA press | active | `transform: scale` | `--dur-fast` (120ms) | `--ease-standard` | ✅ |
| 5 | Expansión Confianza | tap/clic | **`grid-template-rows` 0fr→1fr** | 300ms | `--ease-signal` | ❌ **no-compositada** |
| 6 | Tarjetas traseras (apiladas) | expansión | `transform: translateY + scale` | 300ms | `--ease-signal` | ✅ |
| 7 | Spotlight global (halo) | pointermove | `transform: translate3d` | spring blando | — | ✅ |
| 8 | Spotlight tarjeta | pointermove (dentro) | `transform: translate3d` | spring rápido | — | ✅ |
| 9 | Pupilas avatar (seguimiento/errante) | pointermove / timer | `transform` de `g.pupil` | spring | — | ✅ |
| 10 | Parpadeo avatar | timer 4–7s | `transform: scaleY` 1→.08→1 | 140ms | `--ease-standard` | ✅ |
| 11 | Reacción al tap (pupilas) | tap tarjeta | `transform` de `g.pupil` | 300ms | `--ease-signal` | ✅ |
| 12 | LED dot (chips/estado) | loop | `opacity` | `--dur-slower` | `--ease-standard` | ✅ |

**No-compositadas, explícitas y aceptadas** (nunca en loop, siempre puntuales):
- **#3 CTA hover (`box-shadow`)**: repinta, pero es un elemento pequeño y la
  interacción es puntual. Aceptada.
- **#5 Expansión Confianza (`grid-template-rows`)**: dispara reflow del
  contenido que se despliega, una sola vez por interacción. Aceptada por ser
  el patrón de expansión correcto (ver §7); la alternativa `height: auto` no
  es animable.

Todo lo demás es `transform`/`opacity` puro.

---

## 3. Spotlight de dos niveles

Diferenciados por **escala y nitidez, nunca por color** (decisión de Fase 2).

**Global**
- Radio ~600px.
- Opacidad pico **12%** (el valle del cross-fade de atmósfera la baja a **~9%**
  en las transiciones de color; ver nota abajo).
- Sin borde.
- Lag perceptible: spring **blando** (el halo "persigue" al cursor).
- Color **hereda la atmósfera** (`--color-atmo-*` según el ciclo).
- `pointer-events: none` **obligatorio**.
- `z-index` por **debajo** del contenido interactivo.

**Tarjeta**
- Radio ~300px.
- Opacidad pico **14–18%**.
- Borde **perceptible**.
- Spring **rápido** (sigue al cursor de cerca).
- **Teal fijo** (`--color-accent`), no atmósfera.
- Contenido dentro de `overflow: hidden`.

**Prohibición explícita.** El halo es un `<div>` con **gradiente radial
estático** movido por `transform: translate3d(x, y, 0)`. **Nunca** se
recalcula `background-image` ni `background-position` por evento: eso repinta
el viewport completo en cada `pointermove`. Solo se mueve el compositor.

**Nota — el pico del halo global se amplió en 3.5a.** El valor aprobado en
Fase 2 era **4–6%**. Luis lo subió a **12%** (`PEAK_OPACITY = 0.12` en
`components/common/GlobalSpotlight.tsx`) tras validar en pantalla que a 5% —y
hasta 10%— el halo global resultaba imperceptible **frente al halo de tarjeta**,
que sigue en 14–18%: dos niveles cuya diferencia es tan grande que el nivel
global no se ve dejan de ser dos niveles. A 12% el global conserva presencia
propia sin invertir la jerarquía (sigue por debajo del de tarjeta), y la
diferenciación entre ambos sigue siendo **por escala y nitidez, nunca por
color**, que es la decisión de Fase 2 que encabeza esta sección.

El cross-fade de tres capas de atmósfera compone alfa como `1 − Π(1 − aᵢ)`, no
como suma: en mitad de un cruce de colores el alfa del grupo cae a 0,75 y el
halo compuesto baja a **~9%**. A 9% sigue siendo visible, que era justamente el
problema con el valor anterior (su valle caía a 3,75%).

El rango de tarjeta (**14–18%**) **no cambió**. Tampoco cambia el principio de
§1: esto es *atmósfera* —ambiente, decorativo, ciclando— y el acento funcional
teal sigue fijo y reservado a la acción. Registro completo en BITACORA.md,
Entrada 20.

---

## 4. Listener compartido de puntero

- **Un único** `pointermove` a nivel de **window**, con `{ passive: true }`.
- **Compartido** entre el halo global (§3) y las pupilas de los avatares (§6).
- Valores propagados por **`useMotionValue` + `useTransform`**. **Cero
  `setState` por evento** — nada que dispare re-render de React en `pointermove`.
- Montaje **condicionado** a `matchMedia('(hover:hover) and (pointer:fine)')`.
- Bajo `prefers-reduced-motion: reduce` **o** `pointer: coarse`:
  **desmontaje completo** con `removeEventListener` en el cleanup del
  `useEffect`. **No es desactivación**: el listener no se suscribe.

---

## 5. Estructura del asset SVG del avatar

- `viewBox="0 0 120 120"`, peso objetivo ~3KB.
- Los avatares actuales son **placeholders geométricos**; el asset ilustrado
  final llega después.
- Capas (grupos deliberadamente separados):
  - `g#bg`
  - `g#hair`
  - `g#face`
  - `g#brows`
  - `g#eyes` — contiene un `g.pupil` **por ojo**
  - `g#mouth`
  - `g#accessory` (opcional)
- **Solo `g#eyes` se anima en esta fase.** El resto es estático → SSR-friendly.
- Las demás capas están separadas **a propósito**, para poder animarlas
  (cejas, boca, pelo) cuando exista el asset ilustrado final, sin rediseñar
  el SVG (ver BITACORA, pendiente de animación de capas).
- Variantes por tokens vía `config/team.ts` → `avatar: { skin, hair, accent }`.

---

## 6. Comportamiento de las pupilas según dispositivo

**Invariante en todos los casos**: rango de desplazamiento `clamp(±2.5)`,
aplicado sobre `transform` de `g.pupil` vía `useMotionValue` + `useTransform`
con spring. **Lo único que cambia es la fuente del valor.**

**Desktop** (`hover:hover` y `pointer:fine`):
- Fuente = el **listener global compartido** con el halo (§4).
- Seguimiento del cursor, spring suave.

**Táctil** (`pointer:coarse`):
- El seguimiento de cursor **no se monta** (no hay cursor que seguir).
- Se monta **mirada errante**: las pupilas se desplazan a una posición
  **aleatoria dentro del mismo rango** cada **2–4 s**, con **intervalo
  aleatorio por avatar** (los dos no se sincronizan).
- Implementación **obligatoria con `setTimeout` encadenado**, nunca `rAF`.
  El movimiento entre posiciones lo produce el **spring de framer-motion sobre
  `transform`** (compositado). El cleanup del `useEffect` hace `clearTimeout`.

**Parpadeo** (ambos casos, independiente de la fuente de posición):
- `scaleY` 1→.08→1, 140ms, timer aleatorio **4–7 s**.

**Reacción al tap** (táctil y desktop):
- Al tap/clic sobre la tarjeta de Confianza para expandirla, las pupilas se
  **orientan hacia el contenido que se despliega** (desplazamiento hacia abajo
  dentro del rango) durante la transición de expansión, y luego retoman su
  comportamiento normal.
- Duración alineada con la expansión: **300ms, `--ease-signal`**.
- Es un **motionValue puntual**, no un listener nuevo.

**Justificación del comportamiento móvil.** Sin la mirada errante, en táctil el
avatar queda reducido a un parpadeo cada 4–7 s sobre una tarjeta estática: eso
**lee como fallo antes que como vida**. La mirada errante recupera la sensación
de presencia sin introducir listeners de puntero que en táctil no tendrían
fuente.

**Bajo `prefers-reduced-motion: reduce`**: ni seguimiento, ni mirada errante,
ni parpadeo, ni reacción al tap. **Desmontaje completo** del efecto (con
`clearTimeout` y `removeEventListener` en el cleanup), pupilas **centradas en
reposo**. No es desactivación: el efecto no se suscribe.

---

## 7. Patrón de expansión apilada (Confianza)

- Contenedor con **`grid-template-rows: 0fr → 1fr`** (nunca `height: auto`).
- Tarjetas traseras con **`translateY + scale`** (nunca animar su altura).
- Foto con **`next/image`**: `lazy`, `priority={false}`, **320×400**,
  AVIF/WebP, `placeholder="blur"`, **montada solo al expandir**.
- La foto es opcional (ver `config/team.ts`, `photo?`): la sección funciona
  sin sesión de fotos, con el avatar SVG en grande.

Híbrido resuelto en Fase 2: card colapsada con avatar/tagline → expansión
apilada con bio, stack y foto opcional.

**Contrato i18n de los config** (`config/team.ts`, `config/projects.ts`):
ningún campo de texto visible es literal. Todos son claves i18n o datos no
traducibles (id, name, stack, tags, year, metric.value, photo, avatar).
- `TeamMember.discipline` reutiliza el bloque **preexistente** `team.roles`
  (`t('team.roles.${discipline}')`), sin duplicar traducciones;
  `TeamMember.role` es la clave compartida `team.founderRole`;
  `tagline`/`bio` → `team.members.<id>.*`.
- `Project.sector` reutiliza `projects.sectors` (`t('projects.sectors.${sector}')`);
  `title`/`summary`/`metric.label` → `projects.<id>.*`.

---

## 8. Presupuesto tipográfico

| Fuente | Pesos | Uso | Peso aprox. | Carga |
|--------|-------|-----|-------------|-------|
| Space Grotesk (variable) | 500 / 700 | Todo el texto, hero incluido | ~28KB | `next/font/google`, subset `latin`, `display: swap`, **preload**. Única fuente que bloquea render. |
| JetBrains Mono | 1 peso | Labels, eyebrows, badges, números. **Nunca el hero.** | ~26KB | `next/font/google`. |

Total **~54KB**.

**Alternativa de ahorro documentada**: mono del sistema (`ui-monospace`,
`--font-mono` ya lo lista como fallback), **0KB**, sin impacto en LCP. Se
adopta si el presupuesto de LCP aprieta.

---

## 9. Contraste WCAG (verificado por cálculo independiente)

Sobre fondo `#07090A`:

| Token | Color | Ratio | Nivel |
|-------|-------|-------|-------|
| `--color-text` | `#ECEEEE` | 17.1:1 | AAA |
| `--color-text-muted` | `#9BA1A2` | 7.6:1 | AA |
| `--color-text-subtle` | `#777D7F` | 4.8:1 | AA |
| `--color-accent` | `#00C2A8` | 8.8:1 | AAA |
| `--color-accent-hover` | `#26D6BC` | 10.9:1 | AAA |
| `--color-accent-press` | `#00A08B` | 6.1:1 | AA |
| CTA crítico (texto `#0A0A0B` sobre acento) | — | 8.8:1 | AA |

---

## 10. Copy aprobado (ES / EN)

**Hero H1** *(revisado en 3.3-meta — ver Entrada 11 de la bitácora)*
- ES: "Ingeniería de software precisa, hecha para tu negocio."
- EN: "Precise software engineering, built for your business."

> Versión original de Fase 2, reemplazada: ES "Ingeniería de software precisa,
> del brief al deploy." / EN "Precise software engineering, brief to deploy."
> Motivo: "brief"/"deploy" es jerga técnica que el segmento pyme no comparte.
> La cola nueva nombra al destinatario en vez del alcance.

**Hero subtítulo**
- ES: "Desarrollo full-stack a la medida: construimos y sostenemos el software
  que mueve tu pyme."
- EN: "Made-to-measure full-stack development: we build and maintain the
  software that runs your small business." *(no se usa "SME")*

**Confianza título**: "Un matemático y un físico construyendo software."
- EN: "A mathematician and a physicist building software."

**Confianza subtítulo** *(revisado en 3.3c-1 — ver Entrada 13 de la bitácora)*
- ES: "Dos socios full-stack. Nos encargamos de todo el proceso, sin
  intermediarios: hablas con quien construye."
- EN: "Two full-stack partners. We handle the whole process, no middlemen: you
  talk straight to the people who build it."

> Versión original de Fase 2, reemplazada: "Dos socios full-stack. Del brief al
> deploy, sin intermediarios: hablas con quien construye." Mismo motivo que el
> H1: "brief/deploy" es jerga que el segmento pyme no comparte.

> Nota Fase 3: este copy es texto visible → va por i18n (`common.json`), no
> hardcodeado. Aquí queda como fuente aprobada.

---

## 11. Alcance

**5 secciones**: Hero, Servicios, Confianza, Proceso, Contacto.
**Sin demos 3D ni secciones adicionales.** (Demos interactivas diferidas a
fase posterior; runtime 3D descartado desde Fase 1.)
