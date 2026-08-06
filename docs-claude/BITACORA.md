# BITÁCORA

Bitácora del proyecto. Toda sesión de trabajo abre leyendo este archivo.
Entradas en orden cronológico inverso: la más reciente arriba. Ante conflicto
entre documentación e instrucciones, manda la entrada más reciente de esta
bitácora.

---

# Entrada 20 — Fase 3, sub-etapa 3.5a: apilamiento de fondo, presencia y scrollbar

Fecha: 2026-08-05. Fase: 3 — implementación, sub-etapa 3.5a (primera parte del
cierre). Rama: `fase3/limpieza-cierre` (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel. Local:
`tsc --noEmit` y `next build` verdes, Lighthouse mobile 98–99 / LCP 2,2–2,3 s
(tres corridas), y verificación en Chrome headless por muestreo de píxel y CDP.

Sub-etapa puramente visual: apilamiento de las capas de fondo, presencia de la
textura y estilo de la barra de scroll. **La limpieza de Neon Sunset, los alias
legacy, el SEO y el resto de pendientes NO entran aquí**: son 3.5b.

Incluye una **reapertura de DESIGN-SPEC §3**: el halo global sube de 4–6 % a
12 % de opacidad pico. Ver el punto 4 de "Qué se hizo".

## Lo primero: el bug reportado no se reproduce

El encargo partía de que los background-paths **no se ven en absoluto**, ni
siquiera con `PRESENCE = 1`, y de que la causa era que las capas de z-index
negativo quedaban por detrás del lienzo que pinta
`html { background-color: var(--color-bg) }`. **Esa causa no se sostiene, y el
síntoma no se reproduce en este entorno.** Lo medido, sobre el build de
producción servido con `next start`:

- Con `PRESENCE = 1`, `-z-10`: las ocho líneas se ven. Muestreo en la columna
  x = 640 (1280×800, `--force-prefers-reduced-motion` para congelar `.atmo-1`):
  la línea fuerte da `rgb(0,175,153)` contra un fondo de `rgb(7,9,10)`.
- Con `PRESENCE = 1`, `-z-20`: **los mismos píxeles, exactamente**. Se
  reconstruyó y se volvió a medir; `(5,61,55)`, `(2,119,105)`, `(0,175,153)`,
  `(4,76,68)` en los cuatro puntos de control, idénticos en las dos variantes.
  Es decir: subir de `-z-20` a `-z-10` no cambió nada porque no había nada que
  cambiar, no porque el lienzo siguiera tapando.
- El motivo es de spec: el `background-color` del elemento raíz **se propaga al
  lienzo del documento**, y el lienzo se pinta SIEMPRE por debajo de todo,
  incluidas las capas de z negativo. Un fondo en `html` no puede tapar un
  `-z-20`. Lo que sí tapa son los fondos de bloque de elementos en flujo — y eso
  es exactamente lo que había pasado dos veces antes (el `background` duplicado
  de `body` en 3.4b, el `bg-bg` de `Section` y del `Footer`).
- También se descartó la otra hipótesis obvia, que `stroke="var(--color-atmo-1)"`
  como atributo de presentación no resolviera la variable: se probó aislado y
  Chrome la resuelve igual en atributo que en `style`.
- Se recorrió la página entera a 1280×2400: las ocho líneas presentes, ninguna
  sección tapándolas.

**Hipótesis de por qué Luis no las veía** (especulación, no verificada): un
contenedor Docker de `scripts/dev.sh` sirviendo un build anterior a 3.4c, o
haber mirado antes de reconstruir. No hay forma de confirmarlo desde aquí. Si
tras este cambio siguen sin verse en tu máquina, el problema es de entorno, no
de CSS, y lo siguiente que hay que mirar es qué build está sirviendo el puerto.

**El arreglo se hizo igual**, porque el diagnóstico de fondo —"el orden depende
de que nadie pinte un fondo opaco"— sí es correcto y es lo que ha roto esta capa
tres veces. Lo que cambia no es el render (ver abajo: diff de 0 píxeles) sino la
fragilidad.

## Qué se hizo

**1. `pages/index.tsx` — raíz de apilamiento explícita.**
Nuevo div raíz `relative isolate min-h-screen bg-bg`. `isolation: isolate` abre
un stacking context propio y `bg-bg` pinta el color base como fondo de un
elemento **real en flujo**. Dentro, una escalera de z-index **no negativos**:

```
color base            fondo del div raíz (bg-bg)
  → background-paths  fixed, z-0,  sin JS, también en táctil
  → halo global       fixed, z-10, solo en modo pointer
  → contenido         relative, z-20
  → navegación        fixed, z-50, opaca a propósito
```

Por qué es más robusto: un z-index negativo no se apila "contra el fondo de la
página", se apila **por debajo de los fondos de bloque de todo el árbol**.
Funciona mientras nadie pinte un fondo opaco, y el día que alguien lo pinta la
capa desaparece sin que nada falle ni avise — el efecto se sostenía por
*ausencia* de fondos, y por eso hubo que ir quitándolos uno a uno (`body`,
`Section`, `Footer`). Ahora el orden está escrito: quien añada un fondo opaco lo
hace en un escalón concreto de la escalera y ve qué tapa.

`isolation: isolate` **no** crea containing block para `position: fixed` (eso
solo lo hacen `transform`, `filter`, `perspective`, `will-change: transform` y
`contain`), así que las tres capas `fixed` —paths, halo y nav— siguen
posicionándose contra el viewport. Verificado en el navegador.

**2. `html { background-color }` se queda, pero cambia de papel.** Ya no es "el
fondo de la página" sino **el lienzo del documento**: lo que se ve en el
overscroll y en cualquier área que el div raíz no cubra. Al pintarse siempre por
debajo de todo, no participa del orden ni puede tapar nada. `body` sigue sin
fondo.

**3. `BackgroundPaths` `-z-20 → z-0` y `GlobalSpotlight` `-z-10 → z-10`.**
Con z no negativo, `pointer-events: none` deja de ser un "por si acaso" y pasa a
ser **estructural**: es lo único que impide que esas capas intercepten un clic
donde no hay contenido encima. Documentado en ambos archivos. Comentarios de
`Section.tsx` actualizados (los de `Card.tsx` siguen siendo correctos: el
`-z-10` del halo de tarjeta vive dentro del `isolate` de la propia `Card` y ahí
sí es el mecanismo correcto).

**4. `PRESENCE` 0,16 → 0,32, y `PEAK_OPACITY` del halo global 0,05 → 0,12.**
Los dos valores los fijó **Luis validando en pantalla**, después de la entrega
inicial de esta sub-etapa (que los había dejado en 0,24 y 0,05). Los dos superan
lo que traía la documentación previa, y conviene que quede escrito por qué.

- **`PRESENCE = 0,32`** (`BackgroundPaths.tsx`). El encargo de 3.4c era
  "presencia media" y a 0,16 —y luego a 0,24— la textura seguía leyéndose
  demasiado sutil. §1 **no fija banda dura** para los paths: solo pide que la
  atmósfera cicle en lo decorativo, así que aquí no hay spec que reabrir. La
  línea fuerte (`strokeOpacity` 1,0) compone ahora al 32 % sobre `--color-bg`
  → ≈ `rgb(5,68,61)`, y la más tenue al 14,4 %. Con el valle del cross-fade
  (alfa de grupo 0,75) el rango real de la línea fuerte es **24–32 %**. Sigue
  muy por debajo del texto (`#ECEEEE`), que es la única cota que importa.

- **`PEAK_OPACITY = 0,12`** (`GlobalSpotlight.tsx`). **Esto sí reabre el
  DESIGN-SPEC**: §3 acotaba la opacidad pico del halo global a **4–6 %**, y 0,12
  la **duplica**. Motivo, validado en pantalla: a 0,05 —y hasta 0,10— el halo
  global era imperceptible **frente al halo de tarjeta**, que §3 fija en 14–18 %.
  Dos niveles de spotlight cuya diferencia es tan grande que el nivel global no
  se ve no son dos niveles: son uno. Subirlo a 0,12 devuelve al halo global
  presencia propia manteniendo la jerarquía (sigue por debajo del de tarjeta) y
  la diferenciación que pide §3, que es **por escala y nitidez, nunca por
  color**: 600 px difusos contra 300 px con borde perceptible.

  El valle del cross-fade lo baja a **≈ 0,09** en los cruces de color
  (`0,12 × 0,75`), y a 9 % **sigue siendo visible** — que es justo el problema
  que había antes, cuando el valle caía a 3,75 %.

  **Reapertura documentada del spec**, con el mismo criterio que la corrección
  del H1 en 3.3-meta (Entrada 11): el spec no se contradice en silencio, se
  actualiza y se anota el valor viejo con su motivo. **DESIGN-SPEC §3 quedó
  actualizado**: halo global a 12 % pico (≈ 9 % en el valle), con el 4–6 %
  original anotado como ampliado en 3.5a. El halo de **tarjeta** (14–18 %) **no
  se tocó**, ni el principio "acento = acción (fijo), atmósfera = ambiente
  (ciclo)": esto es ambiente y sigue ciclando.

**Nota de deuda para 3.5b:** los docstrings de `PEAK_OPACITY` en
`GlobalSpotlight.tsx` siguen citando "§3: 4–6 %" y calculando el pico al 5,0 %
y el valle al 3,75 %. **Están desactualizados respecto al código.** No se
tocaron en esta pasada por acotación del encargo (solo documentación); hay que
recalcularlos junto con el resto de la limpieza.

**5. Barra de scroll (`styles/globals.css`).** Se reemplaza la scrollbar Neon
Sunset —track morado `#1A0B2E`, thumb en degradado morado→magenta y
magenta→naranja en hover— por una acorde a Señal. Era el último resto de la
paleta vieja con presencia **permanente** en pantalla y contradecía §1 (el color
fuerte solo donde hay acción).

- Track transparente.
- Thumb en `--color-border-strong` (blanco al 14 %), el mismo gris de los bordes
  de tarjeta: la barra se lee como parte de la retícula, no como adorno.
- Hover en `--color-accent-glow` (teal al 25 %): un indicio de que responde, muy
  por debajo del teal sólido que marca las acciones reales.
- Canal de 10 px con `border: 3px solid transparent` + `background-clip:
  padding-box` → thumb de ~4 px visibles, en píldora.
- Firefox por `scrollbar-width: thin` + `scrollbar-color` en `html` (no admite
  hover; se queda en el gris base). Chrome/Edge/Safari por los pseudo-elementos.

Los demás usos de `#1A0B2E` (`--color-sunset-deep` y `.bg-sunset-gradient`)
**siguen ahí a propósito**: son la paleta Neon completa, que es 3.5b.

## Verificación

**El cambio de apilamiento no mueve un solo píxel.** Se construyó el árbol nuevo
con `PRESENCE = 1` y se comparó contra la captura del árbol viejo (también
`PRESENCE = 1`, `-z-10`), 1280×800, mismo flag de reduced-motion:
**0 píxeles distintos de 1 024 000, diferencia máxima por canal 0.** Es una
mejora de robustez pura, sin delta visual.

**Presencia (muestreo de píxel, `reduce`, fondo limpio `rgb(7,9,10)`).** Medido
con `PRESENCE = 0,24`, que era el valor de la entrega inicial: la línea fuerte
(`strokeOpacity` 1,0) predecía `rgb(5,53,48)` y midió **`rgb(5,52,47)`**, a 1
punto. Las ocho líneas detectadas en el barrido vertical a 1280×2400. Contraste
con el texto (`#ECEEEE` = `rgb(236,238,238)`) intacto.

Con el valor final de Luis, **`PRESENCE = 0,32`**, la misma aritmética predice
`rgb(5,68,61)` para la línea fuerte y `rgb(6,36,33)` para la más tenue. **No se
volvió a medir** (el ajuste es posterior a la corrida de verificación y el
modelo lineal ya quedó validado a 1 punto en dos valores distintos); la
validación real es la de pantalla, que es lo que motivó el cambio.

**El contenido sigue por encima.** Los píxeles del texto del hero son idénticos
antes y después del cambio: `rgb(236,238,238)` en las dos capturas. La nav
también, píxel a píxel.

**Estado real de las capas en el navegador** (CDP, con `pointer: fine` forzado
para que el halo se monte):

| Hijo del div raíz | z-index | position | pointer-events |
|---|---|---|---|
| `.bg-paths` | 0 | fixed | none |
| halo global | 10 | fixed | none |
| contenido | 20 | relative | auto |

Raíz: `isolation: isolate`, `background-color: rgb(7,9,10)`. Nav: `z-index: 50`,
`fixed`.

**Clics intactos.** Rejilla de `elementFromPoint` de 32×23 puntos sobre el
viewport: **0 impactos** en las capas decorativas. Además, uno a uno:

- CTA del hero ("Hablemos"): el hit cae en el `BUTTON`. ✅
- Los 2 `<a href>` de la página (proyecto Atelier y el `mailto:`): alcanzables. ✅
- Botón de idioma de la nav: alcanzable. ✅
- Tarjeta expandible de Confianza: el hit cae dentro del `<button>`, el clic
  conmuta `aria-expanded` de `false` a `true` y el panel pasa a
  `grid-template-rows: 203px`. ✅

**Scrollbar, medida en captura sin `--hide-scrollbars`:** thumb en
`rgb(42,43,44)` = `#FFFFFF24` compuesto sobre `#07090A` (0,14·255 + 0,86·7 =
41,7 → 42), track a `rgb(7,9,10)`. Sin rastro de morado. En el CSS compilado
solo quedan los dos usos Neon que son de 3.5b.

**SSR sin mismatch.** El HTML estático trae el div raíz, `.bg-paths`, el
contenido a `z-20` y el `opacity` de `PRESENCE` (`0.24` en la corrida medida,
hoy `0.32`), y **no** trae el halo (que sigue montándose
solo en cliente, por diseño). Consola tras la hidratación: **0 errores de
hidratación**; la única entrada es un 404 de `/favicon.ico`, preexistente.

**Lighthouse mobile local** (`lighthouse@12`, headless, tres corridas contra
`next start`):

| Corrida | Performance | LCP | FCP | TBT | CLS |
|---|---|---|---|---|---|
| 1 | 99 | 2,3 s | 0,8 s | 40 ms | 0 |
| 2 | 98 | 2,3 s | 0,8 s | 40 ms | 0 |
| 3 | 99 | 2,2 s | 0,8 s | 60 ms | 0 |

Idéntico a 3.4c (98–99 / 2,3 s), como se esperaba: son cambios de CSS y de
apilamiento, sin JS nuevo.

**Warning de `i18n.localeDetection`: sin cambios.** Sigue apareciendo
`Invalid literal value, expected false at "i18n.localeDetection"` en cada build.
Nada de esta etapa lo toca.

## Pendientes

**3.5b (siguiente sub-etapa, cierre):**
- Limpieza completa de Neon Sunset: `--color-neon-*`, `--color-sunset-*`,
  `--shadow-neon-*`, `--animate-glow`/`--animate-float`, los `@keyframes
  glow`/`float` y las utilidades `.bg-neon-gradient`/`.bg-sunset-gradient`.
- Alias legacy de `Card` (`neon`, `gradient`) y de `Section` (`gradient`,
  `dark`), que la Entrada 19 ya daba por retirables.
- SEO 60 en Vercel.
- `npm audit`: 11 vulnerabilidades.
- Copy de Services.
- `next lint`.
- Gate de performance final y merge a `main`.

**Fuera de fase:**
- Avatar de David.
- Carrusel móvil como mejora post-lanzamiento.

**Abierto de esta etapa:** validar contra el preview de Vercel los dos valores
que Luis fijó en pantalla —`PRESENCE = 0.32` y `PEAK_OPACITY = 0.12`—, que es
donde se comprueba si el halo global ya se distingue del de tarjeta sin comerse
la lectura. Si la textura sigue sin verse en tu entorno local, revisar qué build
sirve el puerto antes de tocar el valor.

**Deuda de esta etapa (a 3.5b):** recalcular los docstrings de `PEAK_OPACITY` en
`GlobalSpotlight.tsx`, que siguen escritos para 0,05 y citan el 4–6 % de §3.

---

# Entrada 19 — Fase 3, sub-etapa 3.4c: atmósfera de fondo (cierra 3.4)

Fecha: 2026-08-05. Fase: 3 — implementación, sub-etapa 3.4c.
Rama: fase3/atmosfera (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel + Lighthouse
contra él. Local: `tsc --noEmit` y `next build` verdes, Lighthouse mobile 98–99
/ LCP 2,3 s, y verificación en Chrome headless con muestreo de píxel (abajo).

**Cierra la capa de movimiento (3.4).** Entra la última pieza de §1: el color de
la atmósfera empieza a ciclar de verdad. Dos frentes: el **halo global** deja de
estar clavado en `--color-atmo-1` y pasa al cross-fade teal→cian→azul, y nacen
los **background-paths**, la textura de fondo que el brief pedía y que hasta hoy
no existía. Los `@keyframes atmo-a/b/c` y las clases `.atmo-1/2/3` estaban en
`styles/globals.css` desde 3.0 **sin un solo consumidor**; esta etapa los pone a
trabajar y **no añade ni una regla de CSS**: `styles/globals.css` no se tocó.

## Qué se hizo

**1. `components/common/GlobalSpotlight.tsx` — el halo ya cicla de color.**
El halo pasa de ser un `<div>` con un gradiente a ser un **contenedor con tres
capas superpuestas** (`absolute inset-0`), cada una con su `radial-gradient`
estático en `--color-atmo-1/2/3` y su clase `.atmo-1/2/3`. El color **no se
interpola** —eso exigiría `@property`, descartado en Fase 2—: se cruzan capas de
color fijo por `opacity`.

El `transform` sigue viviendo **en el contenedor**: una suscripción, un par de
springs, un `will-change`. Las tres capas heredan el movimiento del padre, así
que el halo persigue al cursor **como un solo objeto** y lo único que cambia
entre ellas es cuál está visible. Todo lo demás de 3.4b queda intacto: radio
600, spring blando `{45, 22, 1}`, `pointer-events: none`, `-z-10`, montaje solo
en modo `pointer`, y los gradientes escritos una vez en el montaje.

**2. Cómo se componen las dos opacidades (y el valle que aparece).**
La opacidad pico sigue en el contenedor (`PEAK_OPACITY = 0.05`) y la del
cross-fade en las capas. `opacity` en el contenedor las **agrupa**: se mezclan
entre sí primero, sobre fondo transparente, y el resultado se multiplica por
0,05. El alfa que sale de N capas apiladas es `1 − Π(1 − aᵢ)`, **no** `Σ aᵢ`:

| Momento del ciclo | Opacidades de capa | Alfa del grupo | Halo compuesto |
|---|---|---|---|
| Pico de cada color (t = 0, ⅓, ⅔) | 1 / 0 / 0 | 1,00 | **5,0 %** |
| Mitad de un cruce | 0,5 / 0,5 / 0 | 0,75 | **3,75 %** |

En el pico —que es lo que acota §3 (4–6 %)— el halo es **idéntico píxel a píxel
al de 3.4b**. El valle de 3,75 % es estructural al cross-fade por alfa
(source-over no conserva la suma de opacidades), dura un instante de un ciclo de
24 s y **no se corrige subiendo `PEAK_OPACITY`**: eso sacaría el pico del rango
del spec. Medido en el navegador: con las capas a 0,554 / 0,446 / 0 el alfa del
grupo da **0,752**, contra los 0,75 predichos.

**3. `components/common/BackgroundPaths.tsx` — la textura de fondo (§1).**
Ocho curvas Bézier (`C` + `S`, tangente continua en cada empalme) casi
horizontales que cruzan el viewport, tipo curvas de nivel o traza de señal.
`viewBox` 1440×900 con `preserveAspectRatio="xMidYMid slice"`: cubre sin
deformar. Con `none` las curvas se aplastarían en móvil (390×844 contra
1440×900) hasta parecer otra cosa. Todas van de x = −100 a x = 1540, fuera del
viewBox: los extremos se recortan y nunca se ve dónde nace o muere una línea.

Mismo cross-fade de tres capas que el halo. Los ocho `<path>` se declaran **una
vez** dentro de `<defs>` y se instancian tres veces con `<use>`; cada `<g>`
impone su `stroke` por herencia. El HTML lleva ocho `d`, no veinticuatro.

**Cero JavaScript.** Ni framer-motion, ni `rAF`, ni estado, ni `matchMedia`.
Todo el movimiento son los `@keyframes` que ya existían.

**4. Presencia media: cómo se calibró y qué se midió.**
El encargo explícito era corregir que el fondo (solo el halo al 5 %) se veía
muerto. `PRESENCE = 0.16` en el contenedor, multiplicado por una
`stroke-opacity` por línea de 0,45 a 1,0 y anchos de 1 a 2,25 px. La variación
por línea es deliberada: un juego de líneas idénticas se lee como un gráfico;
variarlas se lee como profundidad.

Medido por **muestreo de píxel** sobre el build de producción, bajo
`reduce` (una sola capa a opacidad 1 y sin halo → fondo limpio `rgb(7,9,10)`),
con barrido de ±5 px para coger el pico del trazo antialiaseado:

| Línea | Ancho | `stroke-opacity` | Compuesto esperado | Píxel medido |
|---|---|---|---|---|
| #4 | 2,25 px | 1,00 | 16,0 % → `rgb(6,39,35)` | **`rgb(5,38,35)`** |
| #2 | 2,00 px | 0,90 | 14,4 % | `rgb(5,35,32)` |
| #5 | 1,50 px | 0,75 | 12,0 % | `rgb(6,30,28)` |
| #1 | 1,50 px | 0,60 |  9,6 % | `rgb(6,26,24)` |
| #3 | 1,25 px | 0,70 | 11,2 % | `rgb(6,21,20)` |
| #0 | 1,00 px | 0,45 |  7,2 % | `rgb(6,17,16)` |

La línea fuerte cae **a 1 punto de la predicción**; las finas quedan por debajo
porque un trazo de 1–1,25 px se reparte entre dos filas de píxeles y ningún
píxel recibe cobertura completa. Contra el fondo (`rgb(7,9,10)`) y contra el
halo (que compone a `rgb(7,18,18)`), las líneas son claramente más presentes que
la capa de 3.4b sin acercarse al texto (`#ECEEEE`).

**5. La barra de navegación se estaba comiendo la primera línea.**
La versión inicial arrancaba en y = 60 del viewBox. A 1280×800 la escala del
`slice` es 0,889 y el desplazamiento vertical es 0, así que esa línea caía en
y ≈ 53 px de pantalla — **debajo de la navegación**, que es `fixed`, mide ~72 px
y va con `bg-bg/90` + `backdrop-blur`. El muestreo lo cazó: Δ = (0, −1, 0)
respecto al fondo, es decir invisible. Movida a y = 115 (→ y ≈ 102 px de
pantalla) el mismo punto da Δ = (−1, +8, +6). Una de las ocho líneas estaba
tirada a la basura y no se habría visto revisando el código.

**6. Global, no por sección.** Una sola instancia, montada en `pages/index.tsx`
junto al halo. Es `fixed`: "global" no depende de dónde cuelgue del árbol. Por
sección habría N copias del mismo SVG y N juegos de tres capas compositadas a
cambio de nada visible, y el ciclo de color de cada sección arrancaría en un
instante distinto. El montaje va en `index.tsx` y **no en `_app.tsx`** por la
razón de la Entrada 18 (Turbopack duplicaría el chunk de framer-motion); aquí no
aplicaría —los paths no lo importan— pero mantenerlos juntos deja el orden de
apilamiento legible en un solo sitio.

**7. Se ven también en táctil, y eso es a propósito.** El halo depende del modo
puntero porque sin cursor no tiene qué perseguir. Los paths no persiguen nada.
Como además no consultan el modo, **el markup es idéntico en servidor y en
cliente**: el SVG sale entero en el HTML estático y la hidratación no puede
desalinearse. Verificado en emulación móvil (390×844, `pointer: coarse`): tres
animaciones vivas, cero halos, cero listeners nuestros.

**8. `components/sections/Footer.tsx` — se quitó el `bg-bg`.**
Era el último fondo de bloque opaco de la página y tapaba las capas de z
negativo justo sobre el pie: la costura que la Entrada 18 dejó documentada y sin
corregir. Mismo caso que `Section` en 3.4b — el lienzo del documento ya pinta
`--color-bg`, así que quitarlo es idéntico píxel a píxel salvo por el halo y los
paths, que ahora sí se ven ahí. Es el único archivo de `components/sections/`
que se tocó.

## Orden de apilamiento final

```
lienzo del documento   html { background-color: --color-bg }
  → background-paths   fixed, -z-20, sin JS, también en táctil
  → halo global        fixed, -z-10, solo en modo pointer
  → contenido          z auto  (Section/Footer sin fondo opaco)
  → navegación         fixed,  z-50, opaca a propósito
```

Verificado en el navegador: paths a `z-index: -20` / `pointer-events: none` /
`aria-hidden`, halo a `-10`, y `elementFromPoint` sobre el CTA del hero devuelve
`BUTTON "Hablemos"` con las dos capas encima. Los clics siguen intactos.

La única capa que tapa deliberadamente es la navegación (`z-50`,
`bg-bg/90` + `backdrop-blur`), y por eso hubo que bajar la primera línea. La
variante `surface` de `Section` sigue siendo opaca, y ahí la atmósfera no se
verá: hoy ninguna sección la usa.

## GPU-puro: el inventario de animaciones

`document.getAnimations()` sobre el build de producción, recorriendo los
keyframes de cada una para ver **qué propiedades** tocan:

| Escenario | Animaciones vivas | Propiedades animadas |
|---|---|---|
| Desktop (`pointer`) | 6 — `atmo-a/b/c` ×2 (paths + halo) | **solo `opacity`** |
| Móvil táctil | 3 — `atmo-a/b/c` (solo paths) | **solo `opacity`** |
| `prefers-reduced-motion: reduce` | **0** | — |

Ni una animación de color, `background-image`, `background-position` o `stroke`.
Ni un `requestAnimationFrame`. El `transform` del halo lo escriben los springs
de framer-motion, que es la capa de 3.4b y no cambió.

**Listeners `pointermove`**: la instrumentación de esta etapa parchea
`EventTarget.prototype` (no solo `window`) y por eso cuenta más que la Entrada
18. Desktop: **5**; táctil y `reduce`: **4**. Los 4 de base son infraestructura
de React/Next —delegación de eventos sobre el div raíz y el
`next-route-announcer`, dos cada uno— y no son nuestros. El **quinto, sobre
`window`, es el listener compartido de `usePointerTracker`**, y es exactamente
1: partir el halo en tres capas **no añadió ninguno**. La cifra "1" de la
Entrada 18 sigue siendo correcta para lo que ella medía (listeners de la app).

## Reduced-motion

Sin una sola regla nueva; se reutiliza el bloque que ya estaba en
`globals.css`. Verificado con `--force-prefers-reduced-motion`:

- `.atmo-1` a `opacity: 1`, `.atmo-2` y `.atmo-3` a `0`, las tres con
  `animation: none` → la atmósfera queda **congelada en teal**.
- `document.getAnimations()` → **0**.
- Los paths **siguen renderizados y visibles** (líneas quietas en teal), que es
  lo correcto: reducir movimiento no es apagar la decoración.
- El halo, como en 3.4b, ni se monta.
- `.bg-paths` (la clase que estaba reservada desde 3.0 y que este componente por
  fin usa) anula `animation`/`transform` en el contenedor. Hoy es un marcador
  —el contenedor no anima nada por sí mismo— y así queda el gancho para
  cualquier deriva futura.

## Bundle

Misma metodología de siempre (chunks JS referenciados por el HTML
prerenderizado de `/`, locale `es`), con la **línea base remedida en esta
máquina** sobre el árbol de `HEAD` en la misma sesión: la cuenta de chunks de
esta medición es 8, no los 10 de la Entrada 18, así que los absolutos no son
comparables entre entradas — el delta sí.

| Métrica | Base (3.4b) | Con 3.4c | Delta |
|---|---|---|---|
| First Load JS `/` raw | 584 063 B | 585 805 B | **+1 742 B (+0,30 %)** |
| First Load JS `/` gzip | 185 538 B | 186 153 B | **+615 B (+0,33 %)** |
| Chunks de entrada | 8 | 8 | 0 |
| CSS | 32 613 B | 32 663 B | **+50 B** |
| HTML de `/es` gzip | 6 536 B | 6 954 B | **+418 B** |

**Cero framer-motion nuevo**, como se predijo: el JS que entra son los dos
componentes (el array de paths y el `map` de capas), y el SVG completo cuesta
418 B comprimidos en el HTML. Los +50 B de CSS son las clases de utilidad
nuevas (`-z-20`, `inset-0`) que Tailwind ahora emite; **`globals.css` no se
tocó**.

## Lighthouse

`npm run build && npm start`, Lighthouse 12 vía `npx` efímero. **No se instaló
nada en el proyecto**; `package.json` no cambió.

| Perfil | Score | LCP | FCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|
| Mobile ×3 (secuenciales) | **98 / 99 / 98** | **2,3 s** | 0,8 s | 100 / 30 / 110 ms | 0 | 0,8 s |
| Desktop | 100 | 0,5 s | 0,2 s | 0 ms | 0 | — |

Objetivos cumplidos: ≥80 ✅, LCP <2,5 s ✅. Otras categorías: accesibilidad
**100**, best-practices **96**, **SEO 100**. Elemento LCP: el `<h1>` del hero,
igual que en 3.4a/3.4b.

Contra 3.4b (98 / 2,2 s / TBT 90–100 ms): **dentro del ruido entre corridas**.
El LCP sube 0,1 s y el TBT cae al rango 30–110 ms. Los paths son fondo estático
animado por opacidad y no tocan el hilo principal después de la primera
composición, así que no había motivo para que costaran LCP y no lo hicieron.

**Aviso de método**: una primera corrida con Lighthouse mobile y desktop **en
paralelo** dio TBT 240 ms y perf 94. Es contención de CPU de la propia medición,
no de la página: repetido en serie vuelve a 30–110 ms. Cualquier TBT medido en
esta máquina con otra cosa corriendo al lado no vale.

## Advertencias de build

Sin cambios respecto a las Entradas 16–18: sigue el warning
`Invalid literal value, expected false at "i18n.localeDetection"` y el aviso de
`baseline-browser-mapping`. Ninguno es de esta etapa.

## SSR

El SVG sale **entero en el HTML estático**: `.bg-paths`, los 8 `<path>` dentro
de `<defs>`, los 3 `<use href="#atmo-signal-paths">` y las 3 clases
`.atmo-1/2/3`. `radial-gradient` aparece **0 veces** en el HTML: el halo sigue
montándose solo tras resolver el modo, ya en cliente. Consola durante la carga:
solo el 404 preexistente de `favicon.ico` → **sin mismatch de hidratación**.

## Nota de sesión: node_modules quedó roto un rato

Para medir la línea base intenté construir una copia del árbol de `HEAD` en un
directorio aparte. Un `cp` resolvió a través de un symlink y **copió 1,3 GB
dentro de `node_modules/node_modules`**, lo que rompió la resolución de módulos
y tumbó el build con `Cannot read properties of null (reading 'useContext')` —
en `HEAD` también, o sea que por un momento pareció un problema del repo y no
lo era. Borrado el directorio anidado, el build vuelve verde. `node_modules`
está en `.gitignore`, así que nada de esto llegó al repo, y no quedan
directorios temporales. La línea base acabó midiéndose **en el propio proyecto**
restaurando los archivos de `HEAD` con `git show`, construyendo, y volviendo a
poner los de la rama.

## Pendientes

- **Avatar de David**: sigue geométrico. Hereda el movimiento sin código nuevo.
- **3.5 — limpieza y cierre de Fase 3**: retirar la paleta Neon Sunset + los
  alias legacy (`variant` de `Card`, `background` de `Section`) + el scrollbar
  morado; `npm audit` de las 11 vulnerabilidades preexistentes (1 crítica, 8
  altas); diagnóstico del **SEO 60** que aparece en Vercel y **no** en local
  (aquí da 100, tercera etapa seguida); copy de Servicios aún de Fase 0;
  `next lint` roto; evaluación de `LazyMotion` si el bundle aprieta; y el
  **gate de performance final** antes del merge a `main`.

---

# Entrada 18 — Fase 3, sub-etapa 3.4b: spotlight de dos niveles

Fecha: 2026-08-05. Fase: 3 — implementación, sub-etapa 3.4b.
Rama: fase3/spotlight (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel + Lighthouse
contra él. Local: `tsc --noEmit` y `next build` verdes, Lighthouse mobile 98–99
/ LCP 1,5–2,2 s, y verificación de comportamiento en Chrome headless (abajo).

Entra el spotlight de §3 completo: **halo global** (atmósfera que persigue al
cursor) y **halo de tarjeta** (teal, dentro de la Card). Segundo consumidor del
listener compartido de 3.4a: `hooks/usePointerTracker.ts` **no se tocó**. Más
un ajuste heredado de 3.4a (rango de pupilas). **No** entra la atmósfera de
fondo con ciclo de color (→ 3.4c).

## Qué se hizo

**1. `components/common/GlobalSpotlight.tsx` — halo global (§3).**
Un `<div>` `fixed` de 1200×1200 px con `radial-gradient` **estático**
(`circle closest-side`, `--color-atmo-1` → `transparent`), opacidad **5 %**,
sin borde. El gradiente se escribe **una vez** en el montaje; lo único que
cambia por evento es el `transform`. `marginLeft/-Top: -600px` centra el div en
su propio origen, así que el punto del transform ES el centro del gradiente:
cero aritmética por evento.

Spring **blando**: `{stiffness: 45, damping: 22, mass: 1}` → ω ≈ 6,7 rad/s
frente a los ≈19,3 de las pupilas (casi 3× más lento) y ζ ≈ 1,6,
sobreamortiguado. Persigue con retraso claro y **sin rebote** — un rebote en
una masa de 1200 px se leería como fallo. Medido: con el cursor en (400, 300),
el halo va en (370,9, 278,2) 1,2 s después; llega, pero tarde.

El color queda fijo en `--color-atmo-1` (el teal, primer paso del ciclo).
**3.4c lo conectará al cross-fade** teal→cian→azul de §1; el patrón ya está
preparado: la opacidad vive en el elemento y no en el color, igual que
`.atmo-1/2/3` de `globals.css`, así que apilar capas y cruzarlas por `opacity`
no obliga a tocar el gradiente.

**2. `components/common/CardSpotlight.tsx` — halo de tarjeta (§3).**
600×600 px, teal **fijo** (`--color-accent`, no atmósfera), opacidad **16 %**,
borde perceptible (el color se sostiene hasta el 30 % del radio antes de caer,
frente al desvanecido plano del global). Spring **rápido**
(`{420, 40, 0.6}`, ω ≈ 26 rad/s, ~4× el global): el contraste entre los dos
lags es lo que hace legibles los dos niveles.

**No añade listeners.** Deriva la posición relativa restando el origen
**cacheado** de la caja a los MotionValues globales; `getBoundingClientRect()`
se invalida con `scroll`/`resize`, nunca se llama por evento (mismo patrón que
el centro del avatar en `useAvatarEyes`).

**3. Dos decisiones de este componente que no son obvias.**

- **El `overflow: hidden` va en una capa de recorte, no en la `Card`.** §3 pide
  que el halo no se derrame del borde redondeado, pero poner `overflow-hidden`
  en la tarjeta **recorta también el anillo de `:focus-visible`** de su botón
  (`outline-offset: 2px`): una regresión de accesibilidad a cambio de nada. El
  halo vive dentro de un `absolute inset-0 overflow-hidden rounded-lg` propio.
- **La compuerta de proximidad es CSS, no estado de React.** La capa está a
  `opacity: 0` y sube a 1 con `group-hover`. Sin ella, un halo de 300 px de
  radio se derramaría desde la tarjeta vecina cuando el cursor pasa entre las
  dos. Se anima `opacity` (compositada) y no hay ni un `useState` por hover.

**4. Dónde se aplica el halo de tarjeta: solo Confianza (socios). 2 instancias.**
`Card` recibe un prop `spotlight` opt-in; `TeamMemberCard` es el único que lo
pasa. En Servicios, Proyectos y Contacto las tarjetas son bloques de lectura y
el halo ahí es ruido que se paga en cada celda de la grilla (una suscripción
aritmética y una capa promovida en GPU por tarjeta). En Confianza la tarjeta
**es** el objeto interactivo —se expande al clic y su avatar ya sigue al
cursor—, así que el halo refuerza una affordance que ya existe.

**5. `RANGE` de las pupilas: 2.5 → 2.0** (`hooks/useAvatarEyes.ts`).
Único punto donde 3.4b se aparta del spec (§6 dice ±2.5), y en la dirección
conservadora. Motivo: el avatar **ilustrado** de Luis llegó después del spec y
tiene los ojos bastante más pequeños que el placeholder geométrico; con el
cursor lejos, el clamp llevaba la pupila justo al borde del ojo. ±2.0 cabe con
margen en los dos assets. El clamp y el mapeo no cambian: `deflect()` sigue
siendo `clamp(d/400, −1, 1) × RANGE`, así que la saturación pasa a ocurrir en
±2.0 exactos y la mirada es proporcionalmente idéntica, solo más corta.

## El halo no se veía: dos capas opacas por delante

Lo primero que dio la verificación por **muestreo de píxel** fue que el halo
existía, se movía y **no se veía**: el píxel bajo el cursor era exactamente el
fondo (`rgb(7,9,10)`). El halo se pinta con **z-index negativo** porque §3 lo
quiere por debajo del contenido, y el orden de pintado de CSS coloca las capas
de z negativo **justo encima del lienzo del documento y por debajo de todos los
fondos de bloque**. Había dos fondos de bloque opacos del mismo color tapándolo:

- **`body { background-color }`** en `globals.css`. Estaba **duplicado**: `html`
  ya pinta `--color-bg`, y de `html` sale el lienzo. Se quitó del `body`. El
  render es idéntico píxel a píxel; lo único que cambia es que ahora cabe una
  capa decorativa entre el lienzo y el contenido.
- **`bg-bg` de cada `<Section>`**. Mismo caso: `default` y `gradient` pintaban
  `--color-bg` sobre el mismo `--color-bg`. Pasan a no pintar fondo. `surface`
  se mantiene, y ahí el halo no se verá — hoy ninguna sección lo usa.

La alternativa —subir el halo por encima del contenido— es exactamente lo que
§3 prohíbe. **Esto lo hereda 3.4c**: la atmósfera de fondo se habría estrellado
contra el mismo muro.

**Límite conocido y no corregido**: `Footer.tsx` lleva `bg-bg` hardcodeado (no
usa `Section`) y **tapa el halo sobre el pie de página**. Verificado por píxel:
`rgb(7,9,10)` bajo el cursor en el footer, contra `rgb(6,17,17)` en el resto.
A 5 % de opacidad la costura es muy tenue. Se arregla en 3.4c quitando esa
clase, igual que en `Section`.

## Dónde se monta el halo global: NO en `_app.tsx`

Montarlo en `_app.tsx` es lo natural (envuelve toda la app) y es lo que costó
**+192 802 B raw / +63 005 B gzip**: Turbopack construye `_app` y cada página
como **entradas separadas y no comparte el chunk de framer-motion entre ellas**,
así que importarlo desde `_app` metió **framer-motion duplicado** en el bundle
inicial (dos chunks idénticos de 187 261 B). Medido, no supuesto.

Montado en `pages/index.tsx` el costo marginal es cero y el halo cubre lo mismo:
es `fixed`, así que "global" no depende de dónde cuelgue del árbol. Efecto
lateral aceptado: la página 404 no lleva halo. `_app.tsx` queda con el
comentario que explica por qué no está ahí, para que nadie lo "arregle".

## Bundle — el delta de 3.4b es cero, como se predijo en 3.4a

Misma metodología que las Entradas 16 y 17 (chunks JS referenciados por el HTML
prerenderizado de `/`). Línea base medida en esta máquina con `.next` limpio:
coincide **exactamente** con la Entrada 17.

| Métrica | Base (3.4a) | Con 3.4b | Delta |
|---|---|---|---|
| First Load JS `/` raw | 582 756 B | 584 493 B | **+1 737 B (+0,30 %)** |
| First Load JS `/` gzip | 186 547 B | 186 550 B | **+3 B (+0,002 %)** |
| Chunks de entrada | 10 | 10 | 0 |

El chunk de framer-motion ya estaba pagado en 3.4a y 3.4b lo reutiliza: el
código nuevo son tres componentes pequeños que comprimen contra patrones que ya
existían en el bundle. **La predicción de 3.4a se cumple.** (El CSS va aparte de
esta métrica: 32 613 B tras la etapa.)

## Verificación en Chrome headless, contra el build de producción

Headless reporta `hover:none / pointer:none`, y eso apaga **tanto el JS como
los variantes `hover:`/`group-hover:` de Tailwind** (que van dentro de
`@media (hover: hover)`). En 3.4a se parcheó `matchMedia`; aquí no habría
bastado —el CSS no lo ve— así que se forzó en Blink:
`--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4`.
La página ve entonces `(hover:hover) and (pointer:fine)` de verdad, en JS y en
CSS. El resto es tal cual.

| Qué | Resultado |
|---|---|
| Listeners `pointermove` con halo global + 2 halos de tarjeta + 2 avatares | **1** (`adds:1, removes:0`, antes y después de recorrer la página) |
| `background-image` / `background-position` tras dos movimientos de cursor | **idénticos** en los 3 halos → el gradiente nunca se recalcula |
| Transform del halo global | `none` → `matrix(…, 370.9, 278.2)` → `matrix(…, 954.3, 669.4)` (lag del spring blando, visible) |
| Halo global visible (muestreo de píxel) | `rgb(6,17,17)` bajo el cursor vs `rgb(7,9,10)` lejos. Predicho 0,05×teal + 0,95×fondo = `rgb(7,18,18)` |
| `pointer-events` / z-index del halo global | `none` / `-10` |
| CTA del hero con el halo encima | `elementFromPoint` → `BUTTON "Hablemos"`; el clic real llega al botón y la página **hace scroll a Contacto** |
| Halo de tarjeta al hacer hover | capa a `opacity: 1`, halo centrado en el cursor (311,0, 153,9 para un cursor en el centro de una tarjeta de 624×310) |
| Tarjeta vecina en ese mismo instante | `opacity: 0` → no hay derrame entre tarjetas |
| Al salir de la tarjeta | ambas capas vuelven a `opacity: 0` |
| `prefers-reduced-motion: reduce` | **0** listeners, **0** halos montados |
| Táctil (390×844, emulación móvil: `pointer:coarse`) | **0** listeners, **0** halos montados |
| Consola durante la carga | solo el 404 preexistente de `favicon.ico` → **sin mismatch de hidratación** |

**SSR**: el HTML prerenderizado no contiene ningún `radial-gradient` (0
ocurrencias). Los tres halos se montan solo tras resolver el modo en efecto, ya
en cliente, así que servidor y primer render de cliente coinciden. Las clases
`relative isolate group` de la Card sí salen en SSR y no cambian nada visual.

**Nota de apilamiento**: el halo de tarjeta va a `-z-10` **dentro de un
`isolate`** en la Card. Sin ese contexto de apilamiento, el z negativo se
resolvería contra la raíz del documento y el halo quedaría escondido tras el
`bg-surface` de la propia tarjeta. Verificado: `parentZ: -10`,
`parentOverflow: hidden`.

## Lighthouse

`npm run build && npm start`, Lighthouse 12 vía `npx` efímero (Chrome del
sistema). **No se instaló nada en el proyecto**; `package.json` no cambió.

| Perfil | Score | LCP | FCP | TBT | CLS |
|---|---|---|---|---|---|
| Mobile, corrida completa | **98** | **2,2 s** | 0,8 s | 90 ms | 0 |
| Mobile, `--preset=perf` ×3 | 99 / 99 / 99 | 1,5–1,6 s | 1,5–1,6 s | 90–100 ms | 0 |

Objetivos cumplidos: ≥80 ✅, LCP <2,5 s ✅. Elemento LCP: el `<h1>` del hero,
igual que en 3.4a. Contra 3.4a (99 / 2,1 s / TBT 40 ms): el score y el LCP están
dentro del ruido entre corridas, pero **el TBT sube de 40 a 90–100 ms**. Es un
número honesto y sin diagnóstico cerrado: puede ser el trabajo de hidratación de
tres componentes más y sus springs, o carga de la máquina (esta sesión corrió
builds y Chrome en paralelo). Sigue siendo un décimo del umbral de 200 ms de
Lighthouse. **Vale la pena volver a mirarlo en el preview de Vercel**, que es
parte de la compuerta.

Otras categorías en esta corrida local: accesibilidad **100**, best-practices
**96**, **SEO 100** — el pendiente "SEO 60" arrastrado desde etapas anteriores
**no se reproduce en local**; hay que comprobar si era específico del preview.

Los 60 fps en Android de gama media siguen **sin medir** (no hay dispositivo).
Lo estructural sí se puede afirmar: solo se anima `transform` (y `opacity` en la
compuerta de hover), el gradiente está rasterizado una vez, y en táctil no hay
ni listener ni halos montados.

## Advertencias de build

Sin cambios respecto a las Entradas 16 y 17: sigue el warning
`Invalid literal value, expected false at "i18n.localeDetection"` y el aviso de
`baseline-browser-mapping`. Ninguno es de esta etapa.

## Pendientes

- **3.4c**: atmósfera de fondo con ciclo de color. **Conecta el color del halo
  global al cross-fade** `--color-atmo-1/2/3` (hoy fijo en `atmo-1`). Aprovecha
  el trabajo de apilamiento de esta entrada, y debería **quitar el `bg-bg` de
  `Footer.tsx`** para cerrar la costura del pie de página.
- **Avatar de David**: sigue geométrico. Hereda el movimiento sin código nuevo.
- **3.5**: limpieza de la paleta Neon Sunset + alias legacy (`variant` de `Card`
  y `background` de `Section`) + scrollbar, `npm audit` de las 11
  vulnerabilidades preexistentes (1 crítica, 8 altas), copy de Servicios
  pendiente de Fase 0, `next lint` roto, y evaluación de `LazyMotion` si el
  presupuesto de bundle aprieta.
- **SEO 60**: no se reproduce en local (100). Verificar contra el preview antes
  de gastar tiempo en diagnosticarlo.

---

# Entrada 17 — Fase 3, sub-etapa 3.4a: listener de puntero + pupilas

Fecha: 2026-08-04. Fase: 3 — implementación, sub-etapa 3.4a.
Rama: fase3/movimiento-pupilas (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel. Local:
`tsc --noEmit` y `next build` verdes, Lighthouse mobile 99 / LCP 2,1 s, y
verificación de comportamiento en Chrome headless (abajo).

Primer código del proyecto que usa framer-motion. Entra la **primera capa de
movimiento**: el listener compartido de puntero (§4) y su primer consumidor,
las pupilas de los avatares (§6). **No** entra el spotlight (§3 → 3.4b) ni la
atmósfera (→ 3.4c).

## Qué se hizo

**1. `hooks/usePointerTracker.ts` — listener compartido (§4).**
Un único `pointermove` sobre `window` con `{ passive: true }`. El handler solo
hace `pointerX.set(e.clientX)` / `pointerY.set(e.clientY)` sobre dos
MotionValues: **cero `setState` por evento**, cero lectura de layout.

Los MotionValues son **singletons de módulo**, no un Context. Un Provider en
`_app.tsx` habría dado lo mismo a cambio de obligar a todo consumidor a colgar
del árbol correcto; el singleton funciona desde cualquier componente. La
compartición real la garantiza un **refcount**: el listener se crea con el
primer consumidor y se destruye con el último. Verificado: con los dos avatares
montados, `addEventListener('pointermove')` se llamó **exactamente 1 vez**.
El spotlight de 3.4b solo tiene que llamar a `usePointerTracker()` — incrementa
el refcount y no añade listener. No hay que reescribir nada.

`usePointerMode()` resuelve tres modos vía `matchMedia`: `off` (reduce),
`pointer` (`hover:hover` + `pointer:fine`), `wander` (el resto). Devuelve `off`
en el primer render de servidor **y** de cliente a propósito — el modo real
entra en un efecto, así que el HTML estático no puede desalinearse. Reacciona a
`change` de ambas media queries, sin recargar.

**2. `hooks/useAvatarEyes.ts` — pupilas, parpadeo y reacción al tap (§6).**
Un solo par de MotionValues de destino (`targetX`/`targetY`) y un solo par de
springs. **Todas** las fuentes escriben en el mismo destino, así que el spring
nunca se recablea al cambiar de modo:

- *Desktop*: se suscribe a los MotionValues del tracker y mapea
  `(cursor − centro del avatar) / 400 px` al rango, con `clamp(±2.5)`.
- *Táctil*: mirada errante con **`setTimeout` encadenado** (no `rAF`, no
  `setInterval`): el intervalo se re-sortea en cada salto (2–4 s), así que dos
  avatares montados en el mismo frame divergen desde el primer tick.
- *Parpadeo*: efecto y MotionValue propios (`scaleY` 1→.08→1, 140 ms, timer
  4–7 s encadenado), independiente de la fuente de posición.
- *Reacción al tap*: `expanded` baja de `TeamMemberCard` → `Avatar` como prop.
  Anima el destino a `y = +2.5` en 300 ms con `--ease-signal`. Un flag
  `holdRef` le da propiedad exclusiva del destino durante esos 300 ms; sin él,
  en desktop el siguiente `pointermove` pisaría la reacción de inmediato.
- *`reduce`*: ningún efecto se monta. Ni seguimiento, ni errante, ni parpadeo,
  ni tap. Todos los cleanups hacen `clearTimeout` + `unsubscribe` + reset a 0.

**`getBoundingClientRect()` NO se llama por evento** — sería exactamente el
error de performance que §4 quiere evitar. El centro del avatar se cachea y se
marca sucio con `scroll`/`resize` (ambos `passive`); se recalcula, como mucho,
en el primer `pointermove` posterior a ese cambio.

**Los easings se LEEN de los tokens, no se redefinen.** framer-motion no acepta
el string `cubic-bezier(...)`, así que `cssEase()` lee `--ease-signal` /
`--ease-standard` de `document.documentElement` y parsea los cuatro números.
**Una lectura por token y por sesión** (cache de módulo), nunca dentro de un
timer ni de un handler. `styles/globals.css` no se tocó.

**3. Dónde vive el movimiento — la decisión de arquitectura.**
`Avatar` era un despachador presentacional puro. Ahora es el **único** que
llama a `useAvatarEyes()`, y pasa los estilos ya calculados a los assets, que
siguen siendo presentacionales y solo se los cuelgan a sus `motion.g`.
Descartadas:
- *Movimiento dentro de cada asset*: duplica timers y springs, y obliga a
  reimplementarlo en el avatar de David cuando llegue.
- *Wrapper `<AnimatedAvatar>` sobre el `<svg>`*: no alcanza. Lo que se anima
  son nodos **internos** (`g#eyes`, `g.pupil`); un wrapper externo solo llega
  con `querySelector`, que es justo lo que un componente de React no debe hacer.
- *Sub-componente `<AnimatedPupils>`*: tendría que conocer la geometría de cada
  asset (los ojos de Luis y los del placeholder están en coordenadas
  distintas). Mismo acoplamiento, un componente más.

El resultado cumple lo que se pedía: el **placeholder geométrico de David
hereda el movimiento sin una línea propia** (sus `g.pupil` ya existían), el SSR
no cambia, y `TeamMemberCard` solo pasa `expanded`.

**Las dos pupilas de un avatar comparten `x`/`y`.** Los ojos humanos son
conjugados; moverlos por separado lee como estrabismo. §6 pide desincronizar los
**avatares** entre sí, y eso sale gratis de que cada instancia del hook tenga
sus propios timers y springs.

## Corrección a lo que se creía del asset

Se asumía que los `g.pupil` de **ambos** avatares ya traían
`transform-box: fill-box; transform-origin: center`. **Falso**: solo los traía
la ilustración de Luis. Los del placeholder de David no, y sin `fill-box` el
`translate` se habría referido al origen del `viewBox` y las pupilas habrían
salido de la cara. Ahora esas propiedades viajan en `pupilStyle`/`eyesStyle`
desde el hook, pegadas al `transform` que las necesita, para los dos assets.
De paso, los `g.pupil` de David reciben id prefijado (`david-pupil-left/right`)
como el resto de capas; antes no tenían ninguno.

## Verificación

`npx tsc --noEmit` y `npm run build`: **verdes**. Next.js 16.0.10.

**SSR.** Sobre `.next/server/pages/es.html`, los 6 grupos (2 × `g.eyes`,
4 × `g.pupil`) salen así:

```
<g id="luis-pupil-left" class="pupil"
   style="transform-box:fill-box;transform-origin:50% 50%;transform:none">
```

Pupilas presentes, centradas y con `transform: none` — framer-motion emite
`none` cuando todos los valores están en su default (x=0, y=0, scaleY=1). El
primer render de cliente es idéntico (el modo se resuelve en un efecto), así
que **no hay salto visual ni mismatch de hidratación**: la auditoría
`errors-in-console` de Lighthouse solo reporta el 404 preexistente de
`favicon.ico`. `transform-origin: center` sale normalizado a `50% 50%` — es el
mismo valor.

**Comportamiento, en Chrome headless contra el build de producción.** Headless
reporta `hover:none, pointer:none`, así que la rama desktop se verificó con un
init-script que fuerza `(pointer: fine)`; el resto es tal cual:

| Qué | Resultado |
|---|---|
| Listeners `pointermove` con 2 avatares montados | **1** (`adds:1, removes:0`) |
| Seguimiento desktop, cursor en 4 esquinas | pupila sigue la dirección; con el cursor lejos el valor satura **exacto en 2.5** → el clamp aplica |
| Mapeo, centro del ojo en (161,289), cursor (10,10) | esperado `−151/400×2.5 = −0.944`; medido **−0.944** |
| Mirada errante (táctil) | 12 y 21 posiciones distintas en 9 s, máx. \|Δ\| 2.35 |
| Desincronización de los dos avatares | 31/31 muestras con valores distintos |
| Parpadeo | capturado `scaleY 0.670` a mitad de transición |
| Reacción al tap | `translateY` sube monótono a **2.478** en ~600 ms |
| `prefers-reduced-motion: reduce` | `transform: none` en las 37 muestras de 9 s, **incluso tras un tap** |
| Cambio de `reduce` en vivo, sin recargar | el movimiento cesa y vuelve a `none` |

`useState` aparece **una sola vez** en todo el código nuevo: el modo de
`usePointerMode`, que solo escribe el handler de `matchMedia`. Ningún
`setState` en un `pointermove` ni en un timer. Ningún `requestAnimationFrame`
escrito a mano.

## Bundle — el costo real de usar framer-motion

Misma metodología que la Entrada 16 (chunks referenciados por el HTML
prerenderizado de `/`). **La línea base se volvió a medir en esta máquina**
revirtiendo los archivos, para que el delta no arrastre ruido de gzip: da
450 568 B raw / 142 202 B gzip, ~500 B por encima de lo anotado en la Entrada
16 (diferencia de nivel de compresión, no de código).

| Métrica | Base (3.4a revertido) | Con 3.4a | Delta |
|---|---|---|---|
| First Load JS `/` raw | 450 568 B | 582 756 B | **+132 188 B (+129,1 KB, +29 %)** |
| First Load JS `/` gzip | 142 202 B | 186 547 B | **+44 345 B (+43,3 KB, +31 %)** |
| Total `.next/static/chunks` | 489 732 B | 622 001 B | +132 269 B |

**+43,3 KB gzip.** Está dentro de la banda que se había fijado (40–50 KB) pero
en su borde alto, así que conviene ser explícito sobre de dónde sale. Los
imports **ya son específicos** (`{ motion, animate, useMotionValue, useSpring,
motionValue, ... }`, más los `type`), y todo framer-motion cae en un único
chunk. El peso no es de imports de más: es que **usar cualquier componente
`motion.*` arrastra la capa de render DOM/SVG completa**, que no es
tree-shakeable una vez que hay un `motion.g` en el árbol.

Dos cosas que enmarcan el número:
- Es un **costo único, ya amortizado**. 3.4b (spotlight) y 3.4c (atmósfera)
  consumen el mismo chunk: su delta marginal será cercano a cero.
- Si el presupuesto aprieta más adelante, la palanca disponible **sin instalar
  nada** es `LazyMotion` + `m.*` con las features cargadas por `import()`
  dinámico. No se hizo ahora porque cambia el contrato de SSR de los componentes
  y esta etapa quería el camino auditable. **Evaluarlo en 3.5, no antes.**

## Lighthouse

`npm run build && npm start`, Lighthouse 12 vía `npx` efímero (Chrome del
sistema). **No se instaló nada en el proyecto**; `package.json` no cambió.

| Perfil | Score | LCP | FCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|
| **Mobile** (throttling por defecto, CPU ×4) | **99** | **2,1 s** | 0,8 s | 40 ms | 0 | 0,8 s |
| Desktop | 100 | 0,5 s | — | 0 ms | 0 | — |

Objetivos cumplidos: score ≥80 ✅, LCP <2,5 s ✅. Elemento LCP: el `<h1>` del
hero. **Salvedad honesta**: es `localhost`, sin latencia de red real; el
throttling de Lighthouse la simula (RTT 150 ms, 1,6 Mbps, CPU ×4) pero no
sustituye una medición contra el preview de Vercel. Los 2,1 s dejan **400 ms de
margen** sobre el objetivo — poco. La medición contra el preview es parte de la
compuerta de esta etapa, no un extra.

Los 60 fps en Android de gama media **no se midieron**: no hay dispositivo. Lo
que sí se puede afirmar es estructural — solo se anima `transform` (pupilas por
`x`/`y`, ojos por `scaleY`), sin layout ni paint, y en táctil no hay listener
de puntero montado en absoluto.

## Advertencias de build

Sin cambios respecto a la Entrada 16: sigue el warning
`Invalid literal value, expected false at "i18n.localeDetection"` y el aviso de
`baseline-browser-mapping`. Ninguno es de esta etapa.

## Pendientes

- **3.4b**: spotlight de dos niveles (§3), **segundo consumidor del mismo
  listener** — `usePointerTracker()` y ya; no se toca `usePointerTracker.ts`.
- **3.4c**: atmósfera de fondo.
- **Avatar de David**: sigue geométrico. Cuando llegue su ilustración, hereda el
  movimiento sin código nuevo (solo entrada en `AVATAR_SHAPES`).
- **3.5**: limpieza de la paleta Neon Sunset, `npm audit` de las 11
  vulnerabilidades preexistentes (1 crítica, 8 altas) y, si el presupuesto de
  bundle aprieta, evaluación de `LazyMotion`.

---

# Entrada 16 — Fase 3, dependencia: instalación aislada de framer-motion

Fecha: 2026-08-04. Fase: 3 — implementación, paso de dependencia previo a 3.4.
Rama: fase3/dep-framer-motion (desde develop).
Estado de compuerta: **CERRADA** (tsc + build verdes, sin cambios de UI).

Paso aislado y auditable: entra `framer-motion@12.43.0` en `dependencies`
(runtime, no dev). **Ningún componente la usa todavía** — no se tocó ni un
`.tsx`. El diff es exactamente `package.json` + `package-lock.json`. El primer
consumidor será **3.4a** (pupilas / spotlight, DESIGN-SPEC §6).

Se usa el paquete `framer-motion`, no `motion`, para no desalinear la
documentación del proyecto, que lo referencia con ese nombre.

**Sin advertencias de peerDependencies.** framer-motion 12 declara
`react: ^18.0.0 || ^19.0.0` (y react-dom igual), ambos *optional* en
`peerDependenciesMeta`; el proyecto tiene React 19.2.0. El tercer peer,
`@emotion/is-prop-valid`, también es opcional y no se instaló. Arrastra tres
paquetes nuevos: `framer-motion`, `motion-dom@12.43.0`, `motion-utils@12.39.0`.

## Línea base de bundle (para medir 3.4a)

Medida sobre los chunks que referencia el HTML prerenderizado de `/`
(`.next/server/pages/en.html`), porque `next build` con Turbopack ya no imprime
la columna de tamaños:

| Métrica | Antes de instalar | Después de instalar |
|---|---|---|
| First Load JS `/` (raw) | 450 137 B (439,6 KB) | 450 138 B (439,6 KB) |
| First Load JS `/` (gzip) | 141 663 B (138,3 KB) | 141 664 B (138,3 KB) |
| Total `.next/static/chunks` | 489 731 B | 489 732 B |

**Delta ≈ 0 (1 byte).** Es el resultado esperado: sin `import`, la librería no
entra al bundle. Ese +1 B viene del bump de Next, no de framer-motion. Grep
sobre los chunks solo encuentra la cadena `"framer-motion"` dentro del stack de
Luis en los datos del equipo — dato, no código.

**Todo lo que 3.4a mida por encima de 439,6 KB raw / 138,3 KB gzip es costo
real del uso**, no de tener la dependencia instalada.

## Corrección al reporte de 3.3c-2

Ese reporte dijo que el lockfile estaba desfasado (build reportaba Next 16.0.6
con `package.json` pidiendo 16.0.10). **El lockfile estaba bien**: ya resolvía
16.0.10. Lo desfasado era `node_modules`, congelado en 16.0.6 (`npm ls` lo
marcaba `invalid`). El `npm install` de framer-motion resincronizó el árbol
solo, sin tocar la entrada de Next en el lock: el diff del lockfile son 43
líneas, todas altas de los tres paquetes nuevos, cero borrados. El build ahora
imprime **Next.js 16.0.10**. No queda nada pendiente de esto para 3.5.

## Pendientes que esta etapa NO toca

- `next.config.js`: sigue el warning `Invalid literal value, expected false at
  "i18n.localeDetection"` (preexistente, no es de esta etapa).
- `npm audit` reporta 11 vulnerabilidades (1 crítica, 8 altas) en el árbol
  transitivo. Preexistente, sin relación con framer-motion. Auditarlo aparte.
- `baseline-browser-mapping` pide actualización de datos. Ruido de build.

---

# Entrada 15 — Fase 3, sub-etapa 3.3c-3: avatar ilustrado de Luis

Fecha: 2026-08-04. Fase: 3 — implementación, sub-etapa 3.3c-3.
Rama: fase3/avatar-luis (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel.

Entra el **asset ilustrado real de Luis** (diseñado en Claude Design) y
reemplaza su placeholder geométrico. Cierra el pendiente de la Entrada 14
("el asset definitivo entra *antes* de animarlo, no después").

**Sigue sin haber movimiento.** El avatar integrado es tan estático como el
placeholder que sustituye: sin `framer-motion`, sin listeners, sin timers,
render en el HTML estático. Pupilas y parpadeo siguen siendo **3.4**.

**Estado transitorio deliberado**: la sección de Confianza queda con **un
avatar ilustrado (Luis) y uno geométrico (David)** hasta que David aporte foto
y visto bueno. No es un olvido; es la razón de que el componente despache por
socio.

## Qué se hizo

**1. `Avatar.tsx` pasa de asset único a despachador.** Antes renderizaba un
solo SVG inline. Ahora hay un mapa `AVATAR_SHAPES: Record<string, AvatarShape>`
(`{ luis: IllustratedLuis }`) y **`GeometricAvatar` como fallback**: quien no
tenga ilustración cae al placeholder. Añadir el avatar de David = añadir su
componente y una entrada al mapa, sin reescribir nada. **La interfaz pública no
cambió**: sigue siendo `{ avatar, uid, className }`, así que `TeamMemberCard`
no se tocó. La clave de despacho es el `uid` que ya se pasaba (`member.id`),
no un prop nuevo.

**2. El SVG va INLINE, no en un `<img>`.** No es preferencia de estilo: la
ilustración está parametrizada con `var(--avatar-*)`, y una custom property del
documento **no cruza la frontera de un documento SVG externo** — en `<img>` los
colores caerían siempre al fallback y no habría variantes por socio. Inline es
además lo que da SSR y lo que permite que 3.4 alcance los nodos.

**3. Ids prefijados por socio, capa en `className`.** El asset venía con ids
crudos (`bg`, `eyes`, `pupil-left`, `hair-front`…). La página monta dos
avatares: ids duplicados serían HTML inválido y **romperían cualquier
`querySelector` de 3.4**. Todos van a `${uid}-<capa>` (`luis-hair-front`,
`luis-pupil-left`…) y el nombre de capa se conserva **además** en `className`,
que sí puede repetirse — que es exactamente lo que el spec pide con `g.pupil`
por ojo (§5). El asset ilustrado añade dos capas que el placeholder no tenía:
`hair-back`/`hair-front` (el pelo va delante y detrás de la cara) y
`facial-hair`. Se conserva `g#accessory` vacío (§5).

**4. Colores: a `config/team.ts`, solo los de Luis.** Sus valores anteriores
(`skin: var(--color-surface-raised)`, `hair: var(--color-text)`) eran **grises
del placeholder**: aceptables en una silueta abstracta, pero en una cara
ilustrada pintan un rostro gris. Pasan a piel y pelo reales (`#cf9c78`,
`#241a14`). `accent` **sí sigue siendo token** (`var(--color-accent)`): es el
aro decorativo, no parte de la persona. **David no se tocó.**
Se descartó dejar actuar los fallback del propio SVG: habría dejado dos fuentes
de verdad de color (una por socio) y roto lo que dice §5, que las variantes van
por `config/team.ts`.
Los valores se inyectan **una sola vez en el `<svg>`** como
`--avatar-{skin,hair,accent}` y heredan; pintarlos por atributo `fill` habría
obligado a rociar props por todo el árbol.
`--avatar-skin-shadow` (sombra del tabique) **no** viene de `team.ts` a
propósito: es una derivada de la piel, no un token de identidad; se deja caer
al fallback `#b98461` del SVG. Queda anotado en el código que si cambia la piel
de un socio hay que darle su sombra, no dejarla desincronizada.

**5. Accesibilidad: el avatar es decorativo.** El asset venía con
`role="img"` + `aria-label="Avatar socio 1"`; se cambian a
`role="presentation"` + `aria-hidden="true"` + `focusable="false"`, igual que
el placeholder. En la tarjeta el nombre del socio **ya está en texto**:
anunciar el avatar sería ruido duplicado para un lector de pantalla.

**6. Se conserva el `transform-box: fill-box; transform-origin: center`** de
`g#eyes` y de ambas pupilas, que viene del diseño y es **requisito de 3.4**:
sin él un `transform` de framer-motion se referiría al origen del `viewBox` y
las pupilas saldrían disparadas fuera de la cara. `viewBox="0 0 120 120"`
intacto.

**7. Corrección de un `d` roto del asset.** La perilla venía como
`M56,83 Q60,82.4 64,83 Q62.5,89 60,91 Q57.5,89 60,91 Q56,83 Z`: el último `Q`
lleva **un solo par de coordenadas** cuando necesita dos, y `60,91` está
repetido. Un segmento inválido **corta el render del path en ese punto**
(SVG 1.1 §8.3.1), así que la perilla salía como medio triángulo abierto.
Corregido al cierre simétrico evidente (`… Q57.5,89 56,83 Z`). Es el **único**
cambio de geometría respecto al asset entregado y está marcado en el código: si
el diseño quería otra cosa, se regenera y se reemplaza solo ese `d`.

## Verificación de build
- `npx tsc --noEmit`: pasa, sin salida.
- `npm run build`: pasa. 8 páginas estáticas.
- Advertencia `Invalid literal value, expected false at "i18n.localeDetection"`:
  **sigue igual** (preexistente). **Ninguna advertencia nueva.** (La de
  `baseline-browser-mapping` también es preexistente y ajena al cambio.)
- **Sin ids duplicados**:
  `grep -oE 'id="[^"]*"' .next/server/pages/es.html | sort | uniq -d` →
  **salida vacía**. Ídem en `en.html`.
- Avatar de Luis **inline y por SSR** (no depende de JS): `class="facial-hair"`
  → 1 en `es.html`; `id="luis-hair-front"` → 1. Los 11 ids del asset salen
  prefijados (`luis-bg`, `luis-hair-back`, `luis-face`, `luis-brows`,
  `luis-eyes`, `luis-pupil-left`, `luis-pupil-right`, `luis-mouth`,
  `luis-facial-hair`, `luis-hair-front`, `luis-accessory`). Búsqueda de ids
  **sin** prefijar (`id="bg"`, `id="eyes"`, `id="pupil-left"`…) → sin
  resultados.
- Variables en el markup de Luis:
  `style="--avatar-skin:#cf9c78;--avatar-hair:#241a14;--avatar-accent:var(--color-accent)"`.
- **David sigue en placeholder geométrico**: conserva `id="david-hair"` y
  `id="david-avatar-clip"`, y **no** tiene `facial-hair`, `hair-back` ni
  `hair-front` (`class="facial-hair"` aparece 1 sola vez en todo el HTML).
- **`git diff package.json` vacío. Cero dependencias nuevas.**

## Pendientes
- **Avatar de David**: pendiente de su **foto + visto bueno**. Hasta entonces
  la sección queda con un ilustrado y un geométrico, a sabiendas. Al integrarlo,
  revisar también sus colores en `config/team.ts` (hoy siguen siendo los grises
  del placeholder, correctos solo mientras use el placeholder).
- **Discrepancia visual del estado transitorio**: el disco del ilustrado es
  `r=58` y el del geométrico `r=54` (~7% más grande), y el ilustrado no lleva
  los hombros del placeholder. Verificar en el preview si canta lado a lado;
  si canta, se normaliza al integrar a David, no antes.
- **3.4**: movimiento de **ambos** avatares — pupilas (seguimiento en desktop,
  mirada errante en táctil), parpadeo 4–7 s, reacción al tap — más spotlight de
  dos niveles y atmósfera de fondo. El asset de Luis ya expone `g.pupil` por
  ojo, con ids prefijados y `fill-box` puesto.
- **3.5**: retiro de Neon Sunset (tokens de `globals.css`), **alias legacy** de
  `Section`/`Card`/`Button` —siguen sin un solo consumidor— y el **scrollbar**
  (`::-webkit-scrollbar-thumb`, aún en gradiente morado/rosa).
- Copy de **Servicios sigue siendo el de Fase 0** (`services.title` "Nuestros
  Servicios" / `services.subtitle` "Soluciones completas para tu negocio"),
  pendiente heredado de la Entrada 12.
- Claves i18n `team.roles.engineer` y `team.roles.statistician`: **sin
  consumidor** desde 3.3c-1. Si no entra un tercer integrante, van en 3.5.
- `hover:border-accent` en los chips del stack de **Servicios**: chips no
  clicables, mismo criterio ya corregido en Valores. Queda para 3.5.
- Animación de aparición-al-scroll del nav: sigue abierta (Entrada 10).
- `DESIGN-SPEC §5` dice "los avatares actuales son placeholders geométricos".
  Ya no es cierto para Luis. No se tocó el spec (fuera de alcance); actualizarlo
  cuando entre el avatar de David y el estado deje de ser transitorio.

## Archivos tocados
`components/sections/Avatar.tsx`, `config/team.ts`, esta entrada.

---

# Entrada 14 — Fase 3, sub-etapa 3.3c-2: expansión apilada y grilla de proyectos

Fecha: 2026-08-03. Fase: 3 — implementación, sub-etapa 3.3c-2.
Rama: fase3/confianza-expansion (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel.

Segunda mitad de Confianza y **cierre del contenido de la Fase 3**. Alcance
cerrado igual que en 3.3c-1: **ningún movimiento de avatar** — ni pupilas, ni
parpadeo, ni mirada errante. `Avatar.tsx` no se tocó; sigue siendo SVG puro y
estático. La expansión sí es interacción, pero es `grid-template-rows`, no
animación del asset. **No se tocó** `Hero`, `Services`, `Contact`, `Footer`,
`components/common/*`, `Avatar.tsx`, `config/{contactChannels,services,team}`
ni `styles/globals.css`.

## Qué se hizo

**1. Expansión apilada de las tarjetas de socio (DESIGN-SPEC §7, fila #5 de §2).**
`TeamMemberCard` deja de ser estática. Clic/tap → revela `bio` + chips de
`stack`, que hasta ahora estaban en `config/team.ts` sin renderizarse.

- **Disparador por clic, no hover**, y explícitamente: el tráfico es
  mayormente móvil, en táctil el hover no existe (o peor, queda pegado tras
  el tap). El disparador es un **`<button type="button">` real** que envuelve
  el bloque colapsado — no un `div` con `onClick`: Enter/Space, rol y foco
  vienen de fábrica, y el anillo lo pinta el `:focus-visible` global de
  `globals.css`. `aria-expanded` + `aria-controls` → `id="<socio>-bio-panel"`.
- **Mecánica exacta del spec**: el panel es `grid` y anima
  `grid-template-rows: 0fr → 1fr`, **300 ms**, `--ease-signal`
  (`transition-[grid-template-rows] duration-300 ease-signal`). El contenido
  va dentro de un hijo con `overflow: hidden`, que es lo que recorta durante
  la transición. **Ni `height: auto`** (no animable) **ni `max-height`** (el
  easing se reparte sobre una altura ficticia y llega irregular).
- **Sin framer-motion.** La transición es CSS pura: no hay estado de animación
  que gestionar en JS, solo un `useState` booleano por tarjeta. Meter
  framer-motion aquí habría añadido runtime para reimplementar lo que el
  navegador ya hace, y habría exigido su propio guard de reduced-motion.
- **`prefers-reduced-motion: reduce`**: el panel y el chevron llevan
  `data-expand`, y `globals.css` ya tenía la regla
  `[data-reveal],[data-expand] { transition-duration: 0ms !important }`
  (Entrada 11). El toggle pasa a instantáneo; **no se desactiva la función**.
  Cero CSS nuevo: se reusó el hook que ya existía.
- **Affordance de estado**: chevron SVG inline que rota 180° según el estado,
  `--dur-base` / `--ease-standard`. **Va en `--color-accent`** y aquí sí
  corresponde: es el único elemento clicable de la tarjeta, que es
  exactamente lo que §1 dice que el acento señaliza. Lleva `aria-hidden`
  porque el estado ya lo comunica `aria-expanded`.
- **`inert` en el panel cerrado.** El contenido colapsado **sí está en el
  HTML** (es la condición para que la apertura sea animable), pero un panel a
  0fr es invisible y aun así lo leería un lector de pantalla. `inert={!expanded}`
  lo saca del árbol de accesibilidad y del orden de tabulación mientras está
  cerrado. React 19.2 lo soporta como booleano nativo.
- **Chips de `stack`**: misma familia visual que los del stack tecnológico de
  Servicios (pill, `bg-surface-raised`, borde de token) **pero sin el
  `hover:border-accent hover:text-accent`**. Desviación deliberada de la
  instrucción, misma lógica que la corrección del punto 3: los chips no son
  clicables. Revertir es copiar las dos clases del chip de Servicios.
  Van en `<ul>/<li>`: es una lista, no prosa.
- **Layout**: se quitó el `space-y-4` del contenedor de la tarjeta. Un panel
  colapsado sigue siendo una caja (de altura 0) y el gap del stack le dejaba
  **16 px de hueco muerto al pie de la tarjeta cerrada**. El espaciado se
  movió dentro de cada bloque (`pt-4` en el contenido expandido).

**2. Foto opcional: preparada, inactiva (Tarea 1b).** Si `member.photo` existe
se renderiza con `next/image` — `loading="lazy"`, `priority={false}`,
dimensiones del propio `photo` (320×400), `placeholder="blur"` con su
`blurDataURL` — y **solo con la tarjeta abierta** (`expanded && member.photo`):
`lazy` no bastaba, porque dentro del panel colapsado el `<img>` igual entra al
DOM. **Hoy `photo` es `undefined` para los dos socios**, así que no se monta
nada. Sin foto **no se repite el avatar en grande**: ya está arriba a tamaño
legible (80–96 px) y duplicarlo solo empujaría la bio hacia abajo sin aportar
información. La sección funciona sin sesión de fotos, que es el caso real.

**3. Grilla de proyectos con el caso real.** `config/projects.ts` no tenía
consumidor: existía desde 3.3a con **tres placeholder ficticios** (retail /
salud / logística, con métricas inventadas tipo "−40%"). Se eliminaron los
tres y queda **un solo proyecto real**: `atelier-commerce` (moda, 2025, Next.js
· TypeScript · Stripe · PostgreSQL · Prisma, `href` a
`atelier-commerce.vercel.app`). Sin `metric` y sin `image` — y la tarjeta **no
pinta nada** cuando faltan: ni label vacío, ni guion, ni espacio reservado.

- **Ubicación: antes de Valores**, después de las tarjetas de socio. Orden de
  lectura: quién somos → qué hemos hecho → cómo trabajamos. La prueba concreta
  pesa más que la declaración de principios, así que se lee primero.
- **Caso de un solo elemento.** Una tarjeta suelta en una fila de tres huecos
  se ve rota. Se resolvió con el **mismo recurso que Contact usa para el canal
  único** (`md:only:*`, Entrada 12): con un solo hijo, la tarjeta pasa a
  `col-span-full`, `max-w-xl` y `justify-self-center`; con dos o más, la regla
  `:only-child` no aplica y vuelve la grilla `md:2 / lg:3` normal. **Cero
  ramas en JS**: es CSS condicional, no `projects.length === 1`.
- El bloque **entero** (encabezado incluido) está bajo `projects.length > 0`:
  si el array se vacía no queda un `SectionTitle` "Proyectos" huérfano.
- Sector + año en mono (`text-eyebrow`, §8), como el resto de labels/metadatos.
  Enlace "Ver proyecto" en acento, `target="_blank" rel="noopener noreferrer"`
  — único elemento accionable de la tarjeta, único en acento.

**4. Corrección heredada: hover de Valores.** `hover:border-accent` →
`hover:border-border-strong`. Cierra la **objeción abierta de la Entrada 13**:
el acento es el señalizador de "esto se puede tocar" (§1) y las tarjetas de
Valores no lo son, igual que se decidió en Servicios (Entrada 12).

**5. Claves i18n.** Se eliminaron de ambos locales las de los tres placeholder
(`projects.{retail-inventario,salud-agenda,logistica-despachos}.*`, incluidas
sus `metric.label`) y los sectores muertos (`retail`, `salud`, `logistica`).
Nuevas: `projects.title` (Proyectos / Projects), `projects.viewProject` (Ver
proyecto / View project), `projects.sectors.moda` (Moda / Fashion) y
`projects.atelier-commerce.{title,summary}`. El EN no es traducción literal:
"A brand's own online store… with no third-party platform in the middle".

## Verificación de build
- `npx tsc --noEmit`: pasa, sin salida.
- `npm run build`: pasa. 8 páginas estáticas.
- Advertencia `Invalid literal value, expected false at "i18n.localeDetection"`:
  **sigue igual** (preexistente). **Ninguna advertencia nueva.** (La de
  `baseline-browser-mapping` también es preexistente y ajena al cambio.)
- Proyecto real en el HTML: `Tienda en línea a la medida` → 1 en `es.html`;
  `Custom online store` → 1 en `en.html`. `href` de Atelier Commerce presente.
- Placeholder erradicados:
  `grep -oE 'retail-inventario|salud-agenda|logistica-despachos'` sobre ambos
  HTML → **sin resultados**; tampoco `Inventario en tiempo real`,
  `Agenda clínica`, `Portal de despachos` ni sus equivalentes EN.
- Bio en el DOM (antes solo estaba en el payload): `Físico de formación` y
  `Matemático de formación` → 2 ocurrencias cada una en `es.html` (1 DOM +
  1 `__NEXT_DATA__`). Chips de stack: `framer-motion` y `FastAPI` → 1 cada uno
  (solo DOM; el stack no pasa por i18n, no viaja en el payload).
- Expansión: `aria-expanded="false"` → 3 en `es.html` (2 tarjetas de socio +
  el botón de menú móvil, preexistente); `aria-controls="luis-bio-panel"` y
  `"david-bio-panel"` → 1 cada uno; `grid-rows-[0fr]` → 2;
  `transition-[grid-template-rows]` → 2; `inert=""` → 2.
- CSS emitido (que las clases arbitrarias existan, no solo el markup):
  `grid-template-rows:0fr`, `grid-template-rows:1fr`,
  `transition-property:grid-template-rows` y `cubic-bezier(.16,1,.3,1)`
  (`--ease-signal`) presentes; 6 reglas `:only-child` (4 de Contact + las de
  la grilla de proyectos).
- Claves crudas: `grep -oE 'projects\.(title|viewProject|sectors\.[a-z]+|atelier-commerce\.[a-z]+)|team\.members\.[a-z]+\.bio'`
  sobre ambos HTML → **sin resultados**.
- `hover:border-accent` restante en `es.html`: 14, **todas** del chip del stack
  tecnológico de Servicios (14 tecnologías, fuera de alcance). Las 3 tarjetas
  de Valores ya emiten `hover:border-border-strong`.
- **`git diff package.json package-lock.json` vacío. Cero dependencias nuevas.**

## Pendientes
- **Avatares**: los SVG siguen siendo el **placeholder geométrico** de 3.3c-1.
  Pendiente el **asset ilustrado vía Claude Design** antes de 3.4 — conviene
  que el asset definitivo entre *antes* de animarlo, no después.
- **3.4**: movimiento de los avatares — pupilas (seguimiento en desktop,
  mirada errante en táctil), parpadeo 4–7 s, reacción al tap — más **spotlight
  de dos niveles y atmósfera de fondo**. El asset ya expone `g.pupil` por ojo.
- **3.5**: retiro de Neon Sunset (tokens de `globals.css`), **alias legacy** de
  `Section`/`Card`/`Button` —siguen sin un solo consumidor— y el **scrollbar**
  (`::-webkit-scrollbar-thumb`, aún en gradiente morado/rosa).
- Copy de **Servicios sigue siendo el de Fase 0** (`services.title` "Nuestros
  Servicios" / `services.subtitle` "Soluciones completas para tu negocio"),
  pendiente heredado de la Entrada 12.
- Claves i18n `team.roles.engineer` y `team.roles.statistician`: **sin
  consumidor** desde 3.3c-1. Si no entra un tercer integrante, van en 3.5.
- `hover:border-accent` en los chips del stack de **Servicios**: mismo criterio
  que se corrigió en Valores (chips no clicables). No se tocó por estar fuera
  de alcance; queda anotado para 3.5.
- Animación de aparición-al-scroll del nav: sigue abierta (Entrada 10).

## Archivos tocados
`components/sections/TeamMemberCard.tsx`, `components/sections/Team.tsx`,
`config/projects.ts`, `public/locales/es/common.json`,
`public/locales/en/common.json`, esta entrada.

---

# Entrada 13 — Fase 3, sub-etapa 3.3c-1: Confianza con los socios reales y avatar SVG estático

Fecha: 2026-08-03. Fase: 3 — implementación, sub-etapa 3.3c-1.
Rama: fase3/confianza-socios (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel.

Primera mitad de la reescritura estructural de Confianza. **Alcance cerrado a
propósito**: esta etapa NO trae la expansión apilada, NO trae la grilla de
proyectos y **NO trae ningún movimiento del avatar** — ni seguimiento de
cursor, ni parpadeo, ni mirada errante. El avatar es SVG puro y estático.
**No se tocó** `Hero`, `Services`, `Contact`, `Footer`, `components/common/*`,
`config/{contactChannels,services,projects}` ni `styles/globals.css`.

## Qué se hizo

**1. Muere el equipo ficticio de Fase 0.** `Team.tsx` tenía hardcodeados cuatro
"Team Member 1-4" con roles physicist/mathematician/engineer/statistician. Se
eliminaron: la sección ahora hace `team.map(...)` sobre `config/team.ts`, con
los **dos socios reales** (Luis, David). Añadir un integrante vuelve a ser
añadir un objeto al config, sin tocar JSX. `Section background="gradient"`
(alias legacy) → `"default"`.

**2. `TeamMemberCard` reescrito para la interfaz nueva.** La tarjeta colapsada
muestra avatar + nombre + disciplina + rol + tagline, sin interacción. Jerarquía
tipográfica: nombre `text-text` bold, disciplina `text-text-muted`, rol
`text-text-subtle`, tagline `text-text-muted`. `Card variant="gradient"` →
variante `default` (superficie + borde de token). Se fue el avatar de emoji
(⚛️ ∑ ⚙️ 📈) sobre gradiente Neon y el mapa de color por rol.
**`bio` y `stack` NO se renderizan todavía**: son contenido de la expansión
(DESIGN-SPEC §7), o sea 3.3c-2. Verificado en el HTML emitido: los stacks
personales (`FastAPI`, `framer-motion`) no aparecen ni en el DOM ni en el
payload.

**3. Avatar SVG estático, `components/sections/Avatar.tsx` (nuevo).**
`viewBox="0 0 120 120"`, placeholder geométrico según §5, con las capas
separadas en grupos aunque hoy ninguna se anime: `bg` (fondo + hombros),
`face`, `hair`, `brows`, `eyes` — con **un `g.pupil` por ojo** —, `mouth`.
`accessory` se omitió (§5 lo marca opcional). **Sin framer-motion, sin
listeners, sin timers**: SVG puro, en el HTML estático, no depende de JS. Las
pupilas van centradas y **sin `transform`**, listas para que 3.4 las envuelva
sin rediseñar el asset. Peso real medido sobre el HTML emitido: **1.597 B
(Luis) / 1.605 B (David)**, bajo el objetivo de ~3KB de la spec.

**Desviación deliberada de la notación de §5: los ids van prefijados.** La spec
escribe las capas como `g#bg`, `g#eyes`, etc., pero la página monta **dos**
avatares: `id="eyes"` repetido sería HTML inválido y haría que cualquier
`querySelector` de 3.4 encontrara solo el primer avatar. Los ids se emiten como
`luis-eyes` / `david-eyes` (prefijo = `member.id`), y **el nombre de capa que
pide el spec va además en `className`**, que sí puede repetirse — `g.pupil` es
literalmente eso. Lo mismo con el `clipPath` (`luis-avatar-clip`). Verificado:
14 ids de capa en `es.html`, **cero duplicados**.

**4. Variantes por token, no por SVG duplicado.** El componente recibe
`avatar: { skin, hair, accent }` de `config/team.ts` y pinta con esos valores.
Un solo asset para los dos socios. **El acento del integrante se usa solo
decorativo y a baja opacidad** (anillo al 35%, hombros al 30%): el de Luis es
`--color-accent`, el señalizador de acción de §1, y pintarle la cara con él a
plena opacidad degradaría ese señalizador. La boca va en `--color-text-subtle`
por el mismo motivo.

**5. Valores migrado a Señal.** `bg-sunset-dark/50 border-neon-purple
hover:border-neon-cyan` → `bg-surface border-border hover:border-accent`;
títulos `text-neon-cyan` → `text-text`; cuerpo `text-gray-300` →
`text-text-muted`. El copy i18n de `values.*` **no cambió**.

Dos ajustes de layout que no venían en la instrucción, señalados para que Luis
los revierta si no los quiere (una línea cada uno):
- Las tarjetas de Valores pasaron de **centradas a alineadas a la izquierda**,
  por coherencia con la decisión de retícula suiza de la Entrada 12 (§5 de esa
  entrada, tarjetas de Servicios).
- Los `mt-24 md:mt-32` / `gap-*-10` heredados se bajaron a `mt-20 md:mt-24` /
  `gap-8`, la escala que usan Servicios y Contacto tras 3.3b.

**Objeción abierta sobre el hover de Valores.** La instrucción pedía
explícitamente `hover:border-accent` y así quedó, pero **contradice el criterio
de la Entrada 12**: en Servicios se decidió NO usar acento en tarjetas no
clicables precisamente porque el acento es el señalizador de "esto se puede
tocar". Las tarjetas de Valores tampoco son clicables. Queda como decisión del
arquitecto; si se revierte, es cambiar `hover:border-accent` por
`hover:border-border-strong` en `Team.tsx`.

**6. Copy de Confianza.** `team.subtitle` ES → "Dos socios full-stack. Nos
encargamos de todo el proceso, sin intermediarios: hablas con quien construye."
EN → "Two full-stack partners. We handle the whole process, no middlemen: you
talk straight to the people who build it." (equivalencia natural, no traducción
literal). **`team.title` sí se cambió**: era el genérico de Fase 0 ("Nuestro
Equipo" / "Our Team") y pasa al copy aprobado en DESIGN-SPEC §10, "Un
matemático y un físico construyendo software." / "A mathematician and a
physicist building software." — que es justo lo que la disciplina de cada
tarjeta sostiene abajo. **Se actualizó DESIGN-SPEC §10**, que seguía con la
versión "del brief al deploy" (pendiente que la Entrada 12 dejaba anotado).

**7. `portfolioUrl?` en `config/team.ts`.** Campo opcional, no traducible.
**Queda `undefined` para ambos socios**: la tarjeta no renderiza nada si falta
(ni enlace deshabilitado ni espacio reservado). Clave i18n nueva
`team.viewPortfolio` (ES "Ver portafolio" / EN "View portfolio").

**8. `types/team.ts` eliminado.** Contenía la interfaz vieja (`role` como enum
de 4 valores, `specialties`, `id: number`) y una interfaz `Technology` que
**no usaba nadie**. Se fue con el archivo; `types/` quedó vacío y también se
eliminó. Cero referencias restantes a `@/types/team`.

## Verificación de build
- `npx tsc --noEmit`: pasa, sin salida.
- `npm run build`: pasa. 8 páginas estáticas.
- Advertencia `Invalid literal value, expected false at "i18n.localeDetection"`:
  **sigue igual** (preexistente). **Ninguna advertencia nueva.**
- Socios en el HTML: `Team Member` → **0 ocurrencias** en `es.html` y `en.html`;
  `>Luis<` y `>David<` → 1 cada uno.
- Subtítulo por idioma renderizado completo en ambos HTML. `grep -c brief` →
  **0** en los dos.
- Disciplina traducida vía `team.roles`: `es.html` → `>Matemático<`, `>Físico<`;
  `en.html` → `>Mathematician<`, `>Physicist<`.
- Avatar en el HTML **estático** (`.next/server/pages/es.html`, o sea SSR, no
  hidratación): 2 × `viewBox="0 0 120 120"`, `id="luis-eyes"`, `id="david-eyes"`,
  4 × `class="pupil"` (dos por avatar). `grep -c framer-motion` sobre el HTML → 0.
- Claves crudas: `grep -oE 'team\.(title|subtitle|viewPortfolio|founderRole|roles\.[a-z]+|members\.[a-z]+\.[a-z]+)|values\.[a-zA-Z]+\.[a-z]+'`
  sobre ambos HTML → **sin resultados**.
- `Ver portafolio` / `View portfolio`: **0 en el DOM**, 1 en `__NEXT_DATA__`
  (next-i18next embarca el namespace completo; es el comportamiento normal, no
  renderizado). Igual la `bio`: 0 en DOM, 1 en payload.
- Clases legacy en los archivos tocados (`neon-*`, `sunset-*`, `text-gray-*`,
  `text-white`, `variant="gradient"|"neon"`, `background="gradient"`): **cero**.
- `types/team.ts` no existe; `grep -rn '@/types/team\|Technology' components/
  pages/ config/` → sin resultados.
- **`git diff package.json package-lock.json` vacío. Cero dependencias nuevas.**

## Estado de la migración a Señal
Clases legacy (`neon-*`, `sunset-*`, `text-gray-300`, `text-white`) en el código
fuente: **ya no queda ninguna**. Solo sobreviven los tokens de
`styles/globals.css` y el `::-webkit-scrollbar-thumb` (ambos, 3.5). Con Team
migrado, **todos los alias legacy de `Section` y `Card`
(`background="gradient"|"dark"`, `variant="neon"|"gradient"`) quedan sin un
solo consumidor** y pueden borrarse en 3.5.

## Pendientes
- **3.3c-2**: expansión apilada de las tarjetas de socio (DESIGN-SPEC §7:
  `grid-template-rows` 0fr→1fr, traseras con `translateY + scale`, bio + stack
  + foto opcional) y **grilla de proyectos**, con el proyecto real
  **"Atelier Commerce"** ya definido.
- **3.4**: movimiento de los avatares — pupilas (seguimiento en desktop, mirada
  errante en táctil), parpadeo 4–7 s, reacción al tap — más spotlight de dos
  niveles y atmósfera de fondo. El asset de esta etapa ya expone `g.pupil` por
  ojo; 3.4 no debería tener que rediseñarlo.
- **3.5**: retiro de Neon Sunset (tokens de `globals.css`), alias legacy de
  `Section`/`Card`/`Button` —ahora ya sin consumidores— y el **scrollbar**.
- Copy de Servicios **sigue siendo el de Fase 0** (`services.title` "Nuestros
  Servicios" / `services.subtitle` "Soluciones completas para tu negocio"),
  pendiente heredado de la Entrada 12.
- Claves i18n `team.roles.engineer` y `team.roles.statistician` quedan **sin
  consumidor** (eran del equipo ficticio). No se borraron por si entra un
  tercer integrante; si no, van en la limpieza de 3.5.
- Animación de aparición-al-scroll del nav: sigue abierta (material en la
  Entrada 10).

## Archivos tocados
`components/sections/Avatar.tsx` (nuevo), `components/sections/Team.tsx`,
`components/sections/TeamMemberCard.tsx`, `config/team.ts`,
`public/locales/es/common.json`, `public/locales/en/common.json`,
`types/team.ts` (**eliminado**, y con él el directorio `types/`),
`docs-claude/DESIGN-SPEC.md` (§10), esta entrada.

---

# Entrada 12 — Fase 3, sub-etapa 3.3b: rediseño de Servicios y Contacto

Fecha: 2026-08-01. Fase: 3 — implementación, sub-etapa 3.3b.
Rama: fase3/secciones-servicios-contacto (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel.

Migración de las dos secciones a la dirección Señal, más dos ajustes menores
heredados de 3.2/3.3a. **No se tocó** `Team`/`TeamMemberCard` (es 3.3c), ni
`Hero`, ni `config/contactChannels.tsx`, ni `styles/globals.css`.

## Qué se hizo

**1. Servicios migrado a Señal.** `Section background="dark"` → `"default"`,
`Card variant="neon"` → variante `default` (superficie + borde de token),
`text-${service.color}` (los `neon-*`) → `text-text` para el título,
`text-gray-300` → `text-text-muted`. Se eliminó el campo `color: 'neon-*'` del
array de servicios: ya no existe color por tarjeta. Las 4 categorías
(`fullstack`, `cloud`, `ai`, `data`) y su copy i18n **no cambiaron**.

**2. Emojis → SVG de línea inline, sin dependencia nueva.** Los cuatro emojis
(💻 ☁️ 🤖 📊) se reemplazaron por markup SVG estilo Lucide (MIT) copiado al
repo: código (`</>`), nube, cpu y gráfico de barras. Mismo contrato visual que
el sobre de `contactChannels.tsx` — `viewBox="0 0 24 24"`, `fill="none"`,
`stroke="currentColor"`, `strokeWidth="1.5"`, `aria-hidden="true"`.
**No se instaló `lucide-react` ni ningún paquete** (`git diff package.json`
vacío, ver verificación).

**Decisión de color del icono: `--color-text`, no acento.** DESIGN-SPEC §1 fija
que el acento teal aparece **solo donde hay una acción**, y las tarjetas de
servicio no son clicables. Pintarlas de teal degradaría el señalizador de
"esto se puede tocar" justo antes de la sección de Contacto, que sí lo es. En
Contacto el icono **sí** va en acento: allí la tarjeta entera es un `<a>`.

**3. Bloque de stack tecnológico: i18n y datos.** El `<h3>` decía literalmente
`"Stack Tecnológico / Tech Stack"` — las dos lenguas juntas y hardcodeadas, en
ambos locales. Ahora es `t('services.stack.title')` (ES "Stack tecnológico" /
EN "Tech stack"). La lista de 14 tecnologías estaba hardcodeada en el JSX; se
movió a `config/services.tsx` como `techStack: string[]`. Los nombres de
producto **no se traducen** (mismo criterio que `tags` en `config/projects.ts`).
Las 14 se mantienen sin cambios. Chips migrados: `bg-sunset-medium
border-neon-purple ... hover:border-neon-cyan hover:text-neon-cyan` →
`bg-surface-raised border-border text-text-muted` con hover a
`border-accent`/`text-accent` (el chip sí responde al puntero, así que el
acento en hover es coherente con §1).

**4. `config/services.tsx` nuevo.** Mismo patrón que `contactChannels.tsx` y
`projects.ts`: interface exportada + array exportado. Agregar un servicio =
añadir UN objeto; `Services.tsx` no cambia. Va en `.tsx` porque el icono es
`React.ReactNode`, igual que el canal de correo.

**5. Layout: grilla limpia, sin bento.** DESIGN-SPEC menciona bento para
servicios; se descartó **a propósito**. Un bento jerarquiza por tamaño de celda,
y las cuatro categorías tienen el mismo peso comercial: darle una celda grande a
una comunicaría una prioridad que no existe. Se conservó
`grid-cols-1 md:grid-cols-2 lg:grid-cols-4` migrada a tokens (columna única en
móvil). **Único cambio de layout**: el contenido de la tarjeta pasó de centrado
a alineado a la izquierda — es la retícula suiza de la dirección Señal, y con
descripciones de 2–3 líneas el borde izquierdo compartido lee mejor que cuatro
bloques centrados. Contacto **sí** sigue centrado (ahí el contenido es un dato
copiable corto, y hay que conservar el caso de canal único centrado).

**6. Contacto migrado a Señal.** `Section background="dark"` → `"default"`,
`Card variant="gradient"` → `"raised"`, `text-neon-cyan` → `text-accent` (icono
y dato copiable), `text-white` → `text-text`, `text-gray-300` →
`text-text-muted`. **Arquitectura intacta**: sigue consumiendo
`config/contactChannels.tsx`, con `buildHref`, `aria-label`, `select-all` del
correo, `target="_blank"` condicional al canal externo y el manejo de canal
único centrado (`md:only:*`). Copy i18n sin cambios. La tarjeta de contacto
queda en `surface-raised` sobre `bg` mientras las de servicio quedan en
`surface`: es deliberado — la tarjeta de conversión va medio escalón más
elevada que las informativas.

**7. Guion bajo del wordmark retirado** (decisión de Luis). Se eliminó el
`<span aria-hidden="true">_</span>` de `Navigation.tsx` (añadido en 3.2) y de
`Footer.tsx` (3.3a). Wordmark limpio: "Softensor", sans 700, `text-text`. Solo
se quitó ese elemento; no se rediseñó nada más de esos componentes.

**8. `aria-label` del nav a i18n.** El botón hamburguesa tenía
`aria-label="Toggle menu"` hardcodeado en inglés en ambos locales (heredado de
3.2 y señalado como pendiente en las Entradas 10 y 11). Ahora es
`t('nav.menuToggle')`. ES **"Menú"**, EN **"Toggle menu"**: en español "Menú" a
secas describe el control sin comprometerse con abrir/cerrar — el estado ya lo
comunica `aria-expanded`, que el botón ya tenía, así que un label tipo "Abrir
menú" contradiría al lector de pantalla cuando el panel está abierto.

## Verificación de build
- `npx tsc --noEmit`: pasa, sin salida.
- `npm run build`: pasa. 8 páginas estáticas.
- Advertencia `Invalid literal value, expected false at
  "i18n.localeDetection"`: **sigue igual** (preexistente). **Ninguna
  advertencia nueva.**
- Encabezado del stack por idioma en el HTML estático:
  `es.html` → `<h3 ...>Stack tecnológico</h3>`; `en.html` →
  `<h3 ...>Tech stack</h3>`. **Sin rastro de "Stack Tecnológico / Tech Stack".**
- Claves crudas: `grep -oE 'services\.stack\.title|nav\.menuToggle|services\.[a-z]+\.(title|description)'`
  sobre ambos HTML → **sin resultados**.
- `aria-label` del hamburguesa renderizado: `es.html` → `"Menú"`;
  `en.html` → `"Toggle menu"`.
- Wordmark: `grep -c '>_<'` → **0** en ambos HTML. "Softensor" aparece 7 veces
  (nav, footer, copyright, copy de contacto, payload).
- Iconos SVG presentes en el HTML emitido (los `path` de código, nube y barras
  se encuentran en `es.html`): son inline, no un sprite ni un paquete.
- Reglas de hover emitidas por Tailwind:
  `.hover\:border-accent:hover{border-color:var(--color-accent)}` y
  `.hover\:text-accent:hover{color:var(--color-accent)}`. CSS total: 32.8KB.

## Peso del bundle
- **`git diff package.json` y `package-lock.json`: vacío. Cero dependencias
  nuevas.** Los cuatro iconos son ~10 `path` inline; el costo es marcado en el
  HTML, no JS. (Referencia: `lucide-react` habría metido un paquete entero al
  árbol para cuatro glifos.)
- Turbopack en Next 16 **no imprime la tabla de tamaños por ruta** que se
  esperaba comparar. Medido a mano como línea base para etapas siguientes:
  `.next/static/chunks` = **501.751 bytes**; CSS = **32.835 bytes**;
  `es.html` = 24.141 B, `en.html` = 27.762 B.
- Observación (preexistente, no de esta etapa): `en.html` pesa ~3.6KB más que
  `es.html` porque `__NEXT_DATA__` embarca **el store de ES además del de EN**
  — `fallbackLng` cae al `defaultLocale: 'es'` de `next-i18next.config.js`. No
  se tocó; queda anotado por si el presupuesto de payload aprieta.

## Estado de la migración a Señal
Clases legacy (`neon-*`, `sunset-*`, `text-gray-300`, `text-white`) en el
código fuente: quedan **solo** en `Team.tsx` y `TeamMemberCard.tsx` (3.3c) y en
los tokens de `styles/globals.css` (3.5). Los alias legacy de componentes en
uso son ahora `Section background="gradient"` y `Card variant="gradient"`,
ambos únicamente en Team — al cerrar 3.3c quedan libres para borrarse en 3.5.

## Pendientes
- **Confianza (Team/TeamMemberCard) con reescritura estructural en 3.3c.**
  Luis resolvió ahí el copy que la Entrada 11 dejaba abierto: el subtítulo de
  Confianza es **"Dos socios full-stack. Nos encargamos de todo el proceso, sin
  intermediarios: hablas con quien construye."** — sin "del brief al deploy",
  por el mismo motivo que se retiró del H1. **DESIGN-SPEC §10 todavía tiene la
  versión vieja**; esta entrada manda sobre ella (regla de la cabecera de la
  bitácora), pero conviene actualizar §10 al abrir 3.3c.
- **Spotlight de dos niveles + avatares SVG + atmósfera de fondo en 3.4.**
- Retiro de Neon Sunset en **3.5**: tokens de `globals.css`, alias legacy
  (`Button variant="neon"`, `Section background="gradient"|"dark"`,
  `Card variant="neon"|"gradient"`) y el **scrollbar**
  (`::-webkit-scrollbar-thumb` sigue con el gradiente purple→pink).
- Animación de aparición-al-scroll del nav: sigue abierta para el arquitecto,
  con el material de la Entrada 10. Si se implementa, especificar antes en
  DESIGN-SPEC §2.
- Copy de Servicios sin revisar: `services.title` "Nuestros Servicios" /
  `services.subtitle` "Soluciones completas para tu negocio" siguen siendo el
  texto de Fase 0. Esta etapa era migración de estilo y **no** tocó el
  contenido de esas claves; si el arquitecto quiere copy nuevo, es una etapa
  de texto como la 3.3-meta.

## Archivos tocados
`config/services.tsx` (nuevo), `components/sections/Services.tsx`,
`components/sections/Contact.tsx`, `components/common/Navigation.tsx`,
`components/sections/Footer.tsx`, `public/locales/es/common.json`,
`public/locales/en/common.json`, esta entrada.

---

# Entrada 11 — Fase 3, sub-etapa 3.3-meta: metadatos del documento y corrección del H1

Fecha: 2026-07-27. Fase: 3 — implementación, sub-etapa 3.3-meta.
Rama: fase3/meta (desde develop).
Estado de compuerta: **EN VALIDACIÓN** hasta el preview de Vercel.

Etapa corta, de solo texto e i18n. **No se tocó ningún componente**: ni `Hero`,
ni secciones, ni comunes. Cierra el pendiente de SEO que la Entrada 10 marcó
como "el de mayor impacto comercial" y aplica una corrección de copy del H1.

## Qué se hizo

**1. Corrección del H1 del hero (reapertura de DESIGN-SPEC §10).** El H1
aprobado en Fase 2 era ES "Ingeniería de software precisa, del brief al
deploy." / EN "Precise software engineering, brief to deploy." La cola
"brief/deploy" es jerga de nuestro oficio, no del cliente: el dueño de una
pyme puede no saber qué es un "deploy", y el primer texto de la página no es
sitio para hacerlo traducir. La cola nueva nombra al **destinatario** en vez
del alcance:
- ES: "Ingeniería de software precisa, hecha para tu negocio."
- EN: "Precise software engineering, built for your business."

Cambió solo `hero.title` en ambos locales. `hero.subtitle` y `hero.cta` sin
tocar. **DESIGN-SPEC §10 quedó actualizado** con el H1 nuevo y con la versión
vieja anotada como reemplazada y su motivo.

**2. `<title>` y `<meta name="description">` por locale.** `pages/index.tsx`
tenía `"Softensor - Software Innovation"` hardcodeado — inglés en **ambos**
locales y con el posicionamiento de Fase 0 — y no tenía description. Ahora
`Home()` usa `useTranslation('common')` (importado de **`next-i18next`**, no de
`react-i18next` — el bug de contexto de la Entrada 8) y el `<Head>` consume
`t('meta.title')` y `t('meta.description')`. Se conservó el `<meta viewport>`.

Copy nuevo, redactado por idioma (no traducción literal), sin jerga y sin el
encuadre "IA/ML/Cloud":

| | `meta.title` | chars |
|---|---|---|
| ES | Softensor \| Software a la medida para tu pyme | 45 |
| EN | Softensor \| Custom software for small businesses | 48 |

| | `meta.description` | chars |
|---|---|---|
| ES | Creamos y mantenemos el software a la medida que tu negocio necesita. Hablas directo con quien lo construye. Cuéntanos tu caso, sin compromiso. | 143 |
| EN | We build and maintain the custom software your business runs on. You talk straight to the developers who build it. Tell us what you need. | 136 |

Ambos títulos bajo ~60 y ambas descriptions bajo ~155.

**3. Hallazgo no previsto: había una segunda `description` hardcodeada.**
`pages/_document.tsx` tenía `<meta name="description" content="Softensor -
Innovación en desarrollo de software con IA, ML y Cloud" />`. Con el cambio de
`index.tsx`, el HTML emitido quedaba con **dos** `<meta name="description">`:
la nueva por locale y esa, en español en ambos locales y con el
posicionamiento viejo que esta etapa retira. `_document.tsx` no puede usar
`useTranslation` (renderiza fuera del contexto de i18n), así que la corrección
correcta es **borrar la línea**: la de `index.tsx` la reemplaza y sí es por
idioma. Verificado tras el fix: exactamente **1** description por página.

**4. `getStaticProps` verificado, sin cambios.** `serverSideTranslations`
ya carga el namespace `common` y las claves `meta.*` viven ahí. No hizo falta
tocarlo.

## Verificación del fold móvil — el H1 nuevo NO mejoró el fold en ES

Medido igual que en 3.3a: build de producción servida, `getBoundingClientRect()`
sobre el DOM real en Chrome headless, viewport 360×640 y el caso duro 360×560.

| Locale | Viewport | H1 | Líneas | CTA (top–bottom) | Holgura bajo el fold |
|--------|----------|-----|--------|------------------|----------------------|
| ES | 360×640 | 32px | **4** | 444–504 | **136px** |
| ES | 360×560 | 32px | **4** | 404–464 | **96px** |
| EN | 360×640 | 32px | 3 | 441–501 | 139px |
| EN | 360×560 | 32px | 3 | 401–461 | 99px |

**La expectativa de la etapa era que el H1 nuevo, por más corto, mejorara el
fold. Es falso, y en ES es al revés.** El conteo real de caracteres:

- ES: 52 → **54** (es más largo, no más corto). Pasa de 3 a **4 líneas**.
- EN: 46 → 54 (más largo también), pero **se queda en 3 líneas**: la tercera
  solo se llena más.

Consecuencia en ES: la holgura cae de 153px a 136px a 640 (y de 113px a 96px a
560), exactamente **17px ≈ media línea** (`line-height` 33.92). Cuadra con que
el hero está centrado verticalmente (`min-h-screen flex items-center`): una
línea más empuja el contenido media línea hacia abajo. Ese cuadre es la
comprobación interna de que la medida es buena. EN queda **idéntico** a 3.3a
(441–501, 139px).

**Veredicto: el CTA primario sigue visible sin scroll en ambos idiomas y en
ambos viewports, con margen.** 96px de holgura en el peor caso es holgado. No
se ajustó el `clamp`. Pero queda registrado que el margen del fold en ES es
ahora menor, y que **una futura edición del H1 en ES que lo alargue más ya no
tiene una línea de sobra**: la cuarta línea ya se gastó.

## Verificación de build
- `npx tsc --noEmit`: pasa, sin salida.
- `npm run build`: pasa. 8 páginas estáticas.
- Advertencia `Invalid literal value, expected false at
  "i18n.localeDetection"`: **sigue igual** (preexistente). **Ninguna
  advertencia nueva.**
- `<title>` por idioma en el HTML estático: `es.html` →
  `Softensor | Software a la medida para tu pyme`; `en.html` →
  `Softensor | Custom software for small businesses`. **Sin rastro de
  "Software Innovation".** Nota de método: hay que grepear
  `'<title[^>]*>'`, no `'<title>'` — Next emite `<title data-next-head="">`.
- `<meta name="description">`: presente en ambos, cada uno en su idioma,
  **1 sola por página**.
- H1 nuevo renderizado: `'hecha para tu negocio'` en `es.html` → 2 (1
  renderizado + 1 del payload `__NEXT_DATA__`); `'built for your business'` en
  `en.html` → 2.
- Claves crudas: `grep -oE 'meta\.(title|description)|hero\.[a-zA-Z]+'` sobre
  ambos HTML → **sin resultados**.
- Copy viejo: sin rastro de "Software Innovation", "IA, ML y Cloud",
  "del brief al deploy" ni "brief to deploy" en el marcado.
- `<html lang>`: correcto por locale (`es` / `en`), lo pone Next por el routing
  i18n. No requiere trabajo.

## Pendientes
- **Servicios + Contacto en 3.3b**; **Confianza** (Team/TeamMemberCard) con
  reescritura estructural en **3.3c**.
- **Spotlight de dos niveles + avatares SVG + atmósfera de fondo en 3.4.**
- **DESIGN-SPEC §10, "Confianza subtítulo", sigue diciendo "Del brief al
  deploy, sin intermediarios"** — la misma jerga que se acaba de retirar del
  H1, por el mismo motivo. No se cambió aquí: es copy de una sección no
  implementada y la decisión es del arquitecto. **Debe resolverse antes de
  3.3c**, o el sitio vuelve a decir "brief al deploy" más abajo en la página.
- `aria-label="Toggle menu"` del nav **sigue hardcodeado en inglés** en ambos
  locales (heredado de 3.2). Esta etapa tocó i18n pero solo añadió `meta.*` y
  corrigió `hero.title`; no se metieron claves fuera de alcance.
- Retiro de Neon Sunset en **3.5**: tokens de `globals.css`, alias legacy
  `Button variant="neon"` y `Section background="gradient"|"dark"`, y el
  **scrollbar** (`::-webkit-scrollbar-thumb` sigue con el gradiente
  purple→pink). Los alias siguen en uso por las secciones sin migrar.
- Animación de aparición-al-scroll del nav: sigue abierta para el arquitecto,
  con el material de la Entrada 10. Si se implementa, especificar antes en
  DESIGN-SPEC §2.
- **Ya no es pendiente**: `footer.slogan` se mantiene como está
  ("Innovación impulsada por la ciencia" / "Science-driven innovation") por
  decisión de Luis. Cerrado.

## Archivos tocados
`public/locales/es/common.json`, `public/locales/en/common.json`,
`pages/index.tsx`, `pages/_document.tsx`, `docs-claude/DESIGN-SPEC.md` (§10),
esta entrada.

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
