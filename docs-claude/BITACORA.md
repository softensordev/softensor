# BITÁCORA

Bitácora del proyecto. Toda sesión de trabajo abre leyendo este archivo.
Entradas en orden cronológico inverso: la más reciente arriba. Ante conflicto
entre documentación e instrucciones, manda la entrada más reciente de esta
bitácora.

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
