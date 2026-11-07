# Prompt: auditoría de performance del portfolio

Pega todo lo de abajo (desde "ROL") en una sesión nueva de Claude Opus 5.5 abierta en `/Users/ernesto2406/Proyectos/portfolio`.

---

## ROL

Eres un ingeniero senior de performance web (Core Web Vitals, rendering del navegador, WebGL/three.js, animación). Vas a auditar el portfolio de Ernesto de punta a punta. La web **se laggea en ciertos puntos y no está bien optimizada**. Tu trabajo es encontrar **por qué**, con evidencia medida, y proponer y aplicar arreglos priorizados por impacto. No adivines: cada hallazgo lleva una medición o una traza que lo respalde.

## CONTEXTO DEL PROYECTO (ya verificado, no lo redescubras)

- Stack: Vite 8, React 19 (con prerender SSR propio: `scripts/prerender.mjs`, `src/entry-server.tsx`), Tailwind 4, TypeScript 6. Node >= 22.
- Animación y 3D: `three` 0.186 (hologram lazy, chunk ~640 kB), `gsap` 3.15, `motion` 14, `lenis` (smooth scroll), `lucide-react`, `simple-icons`.
- Estructura: `src/App.tsx` monta `Background`, `Masthead`, `Nav`, `main` (`Story`, `Generate`, `Stack`, `Output`), `Footer`, `AgentHost`, `SmoothScroll`.
- Componentes sospechosos por tamaño o naturaleza (empieza por aquí, pero no te limites a ellos):
  - `src/components/ui/HalftoneWordmarkFooter.tsx` (523 líneas, canvas)
  - `src/components/ui/ProfileCard.tsx` (532 líneas)
  - `src/components/ui/FoldText.tsx` (432 líneas)
  - `src/lib/hologram.ts` (297) + `src/components/Hologram.tsx` (three.js + `public/models/ernesto.glb`, 1.6 MB)
  - `src/components/DarkFog.tsx`, `Background.tsx`, `ui/DotOrb.tsx`, `ui/MorphingText.tsx`, `ui/ScrambleText.tsx`, `ui/BlurReveal.tsx`, `ui/TypeLoop.tsx`
  - `src/components/SmoothScroll.tsx` + `src/lib/scroll.ts` (Lenis + historia fijada "pinned" en `Story`, solo con `min-width:1024px`, `min-height:740px`, sin reduced-motion)
  - `src/agent/*` (panel de agente con BM25, streaming, diálogo nativo)
  - `src/styles/global.css` (877 líneas): busca `backdrop-filter`, `filter: blur`, `mix-blend-mode`, `will-change`, sombras grandes, animaciones de propiedades que no son `transform`/`opacity`.
- Pipeline de carga: `index.html` + `public/boot.js` (inline en `<head>`, heurística `data-lite` por `hardwareConcurrency <= 4` / `deviceMemory <= 4`) + `public/welcome.js` (loader de bienvenida) + fuentes Inter y Geist Mono (woff2) en `public/fonts`.
- Assets pesados ya detectados (verifica y confirma, no asumas que son los únicos):
  - `public/projects/hybrid-rag-api.jpg` ≈ 2.9 MB, `wakemap.jpg` ≈ 1.5 MB, `ring-telemetryops.jpg` ≈ 1.1 MB (JPG sin variantes AVIF/WebP ni `srcset`, a comprobar si se usan con `loading`/`decoding`/dimensiones)
  - `public/models/ernesto.glb` ≈ 1.6 MB
  - `public/_headers` solo pone `Cache-Control` inmutable a `/assets/*`; el resto (fonts, models, photo, projects) puede no estar cacheado.
- Estado previo: Lighthouse móvil 94-97 en el build final (ver `PROGRESS.md`). Eso mide carga, **no** el lag durante scroll/interacción. El problema real probablemente está en runtime (scroll, canvas, WebGL, blur, GSAP/ScrollTrigger/Lenis), no solo en carga.
- Hay tests (`npm test`: vitest, `npm run test:e2e`: playwright con axe). **No los rompas.** Hay un detector `.impeccable` y reglas de diseño: no cambies el diseño visual sin avisar.

## DATO CLAVE DE CAMPO (prioridad máxima)

Ernesto ve el lag **en los deploys reales (GitHub Pages y Cloudflare Pages) y no en local**. Eso cambia el enfoque: la causa más probable está en lo que el deploy añade (red, caché, compresión, decodificación tardía de assets pesados), no solo en el código de animación. Haz esto **antes** de la Fase 2:

- Audita el sitio **desplegado**: ambas URLs de producción (pídelas a Ernesto si no las conoces). Compara con `npm run preview` en local y con un perfil de red simulado (Fast 4G / Slow 4G + CPU 4x) para reproducir el deploy en local. Si el lag aparece con red throttled y no sin ella, la causa es carga de assets.
- Compara las cabeceras reales de respuesta de cada host (`curl -sI` de HTML, JS, CSS, fuentes, `.glb`, JPG): `content-encoding` (br/gzip, o ausente en `.glb`/imágenes), `cache-control`, `etag`, HTTP/2-3. **GitHub Pages ignora `public/_headers`** y fuerza `max-age=600`: los assets sin hash (`/fonts`, `/models`, `/projects`, `/photo`) se revalidan cada 10 min. Cloudflare Pages sí lee `_headers`, que hoy solo cubre `/assets/*`. Propón la solución por host (para Pages: nombres con hash, o mover assets pesados a Cloudflare; para Cloudflare: ampliar `_headers`).
- Mide en el deploy: cuándo llegan `ernesto.glb` y los 3 JPG (1,1 a 2,9 MB), y qué hace el main thread justo después (decode de imagen, parseo del GLB, init de WebGL, compilación de shaders, hidratación). En local llegan al instante y ese coste queda oculto; en el deploy pueden caer en pleno scroll o en el loader de bienvenida y producir los tirones. Busca long tasks y frames largos alineados con la llegada de esos recursos (Resource Timing + `long-animation-frame`).
- Revisa si hay trabajo que depende de la red en caliente: `fetch` de datos (`repos.ts`, API de GitHub, `repos.fallback.json`) o de recursos externos durante el scroll, y si el prerender/hidratación del deploy difiere del local (por ejemplo, `base`, rutas `/es/`, 404).
- Descarta diferencia de hardware: pregunta o comprueba si Ernesto ve el deploy en el mismo equipo que local, y si `data-lite` (`boot.js`) se activa en el deploy y no en local, o viceversa.
- Prioriza arreglos de assets (AVIF/WebP responsive, GLB comprimido, carga diferida con `IntersectionObserver`, `decoding="async"`, `fetchpriority`) por encima de micro-optimizaciones de código hasta confirmar la causa.

## HALLAZGOS YA IDENTIFICADOS POR LECTURA DE CÓDIGO (confirmar midiendo y arreglar)

Ernesto confirma que el lag **también ocurre en local**, sobre todo en la **sección de proyectos** (`src/sections/Generate.tsx` → `src/components/ui/StackInteractor.tsx`, la rejilla de rectángulos redondeados con foto de bosque que aparece al pasar el ratón por Ring / Hybrid RAG / WakeMap). Así que el lag no es solo de red: hay coste de runtime. Estos puntos salen de leer el código; **mídelos primero** (traza antes/después) y luego arréglalos. Hazlo en este orden:

**H1 (crítico): clipPath SVG animado con GSAP sobre una foto enorme.**
`StackInteractor` renderiza `<g clipPath=url(#...)><image href=... width=500 height=500/></g>` y un timeline `gsap ... repeat: -1` anima `scale` de 6 a 9 `<rect class="path">` dentro del `<clipPath>`. Recortar con un `<clipPath>` animado no se compone en GPU: el navegador repinta la foto en cada frame. Además el timeline nunca se detiene (fuera de pantalla, pestaña oculta o con el dialog del caso abierto).
- Mide: frames y tiempo de Paint/Raster mientras la sección está visible, con y sin hover.
- Arreglo: (a) pausar/reanudar el timeline con `IntersectionObserver` y `document.visibilitychange`, y mientras el `<dialog>` del caso esté abierto; (b) si tras reducir la imagen sigue por encima de 16 ms/frame, sustituir el `<clipPath>` por una técnica compuesta en GPU: `<div>`s con `overflow:hidden; border-radius` y `transform: scale()`/`will-change: transform` sobre un fondo de imagen, o `mask-image` CSS, o un canvas 2D que dibuje la imagen ya decodificada recortada por rectángulos redondeados. Debe verse **igual** (mismas formas, mismo ritmo del timeline: aparece con `expo.out`, respira con `sine.inOut`, sale con `expo.in`, `stagger` aleatorio/centro/bordes) y seguir respetando `prefers-reduced-motion` (foto fija completamente visible).

**H2 (crítico): imágenes de proyecto de 1,1 a 2,9 MB pintadas a ~500 px.**
`public/projects/{ring-telemetryops,hybrid-rag-api,wakemap}.jpg` (1,1 / 2,9 / 1,5 MB). El `<image>` SVG se muestra a 500×500 CSS px. Al cambiar `href` en `onMouseEnter` se decodifica otro JPG gigante en el main thread, lo que provoca el tirón al pasar de un proyecto a otro.
- Arreglo: generar con `sharp` (ya en devDependencies; script nuevo `scripts/projects-img.mjs` o ampliar uno existente) variantes AVIF y WebP (fallback JPG) de ~1000 px de ancho (2x del tamaño de render) con calidad perceptualmente indistinguible; objetivo ≤ 120 KB por imagen. Usa `<picture>`/`srcset` donde se pueda (en SVG `<image>` no hay `srcset`: o sirve el formato más ligero soportado detectando AVIF/WebP, o muévelo a un `<img>`/canvas). Comprueba si las mismas fotos se reutilizan en el dialog del caso (`CaseDetail`) y ajusta ahí también (`width`/`height`, `loading="lazy"`, `decoding="async"`).
- Precarga y decodifica las 3 imágenes (`new Image()` + `img.decode()`) en idle al montar `StackInteractor` o cuando la sección se acerque al viewport, para que el cambio al hover sea instantáneo y sin decodificar en medio de la animación.

**H3 (alto): `mix-blend-mode: difference` (`.ink-auto`, `global.css` ≈ línea 854) en los títulos de la lista de proyectos, sobre una zona que se repinta sin parar.**
Cada repintado de la rejilla obliga a recomponer el blend de los textos de al lado, además de `transition-all duration-700` en el span del título (transiciona todas las propiedades, incluidas las que provocan layout).
- Mide el coste de composición con y sin `mix-blend-mode` en esa sección. Arreglos: aislar la zona animada en su propia capa (`isolation: isolate`/`contain: paint` sobre el contenedor del SVG para que su repintado no invalide el blend de la lista); sustituir `transition-all` por solo `transform` y `opacity`; si el blend sigue costando, usar color fijo con cambio por `data-theme` de sección en vez de `difference` en esa sección, **sin cambiar cómo se ve** (el texto debe seguir legible en papel y sobre la niebla oscura; esto es un cambio visual de riesgo medio: si no se puede garantizar igual, déjalo como opción para Ernesto con capturas).

**H4 (medio): tamaño de layout y gradientes de fondo detrás de la sección.**
La sección convive con `Background` (columnas guía), `DarkFog` (niebla que oscurece la página con el scroll) y el `Masthead` con 3 capas de `backdrop-filter` (`.masthead-blur`, ≈ líneas 195-197 de `global.css`) siempre encima. Comprueba si la transición de claro a oscuro de `DarkFog` fuerza repintado de toda la sección de proyectos mientras se hace scroll, y si los 3 `backdrop-filter` del masthead (blur 1/3/6 px con máscara) se recalculan en cada frame sobre la rejilla animada. Si es así: reducir a 1 capa, o desactivar mientras el SVG animado esté visible, o `will-change: transform` en la capa y que sea realmente fija. Mide primero; si no aporta, descártalo.

**H5 (medio): coste fijo del hover.**
`onMouseEnter={() => setActive(i)}` hace `setState` en el padre y reconstruye el timeline (`useLayoutEffect` con `ctx.revert()` + nuevo `gsap.timeline`) en cada cambio, además del cambio de `clipId` y `href`. Comprueba que no se hacen re-renders de más (React Profiler) y que el revert/recreate no genera un frame en blanco ni un salto. Si lo hace, reutiliza un único timeline y solo cambia la imagen y los paths activos.

**H6 (a validar): los mismos patrones en otras secciones.**
Después de arreglar H1-H5, busca el mismo anti-patrón (animación GSAP `repeat: -1`, clipPath/mask animado, `mix-blend-mode`, `backdrop-filter`, canvas sin pausa) en `Story` (pinned), `Stack`, `Output`, `Footer` (`HalftoneWordmarkFooter`), `Masthead`/hero (`FoldText`, `DotOrb`, `Hologram`) y aplica el mismo patrón de pausa por `IntersectionObserver` + `visibilitychange` y de capa aislada. Crea, si hace falta, un hook compartido (`src/hooks/useInView.ts` o similar) en vez de repetir código por componente.

**Criterio de aceptación para la sección de proyectos** (mide en build de producción, perfil CPU 4x y viewport 1440×900):
- Scroll por la sección y hover entre los 3 proyectos: p95 de frame time ≤ 16,7 ms (≥ 60 fps) en el perfil sin throttling y ≤ 33 ms (≥ 30 fps) con CPU 4x; cero long tasks > 50 ms causadas por decode o repintado.
- Peso total de las 3 imágenes de proyecto ≤ 400 KB (hoy ≈ 5,5 MB).
- La apariencia (formas, ritmo, legibilidad de los títulos) coincide con la actual: compara capturas antes/después.
- `npm run typecheck`, `npm test` y `npm run test:e2e` siguen pasando.

## PREPARACIÓN DEL ENTORNO (ya hecho, solo verifica)

- Mac nuevo (arm64). Node 22 vía `fnm`, `npm ci` ejecutado, Chromium de Playwright instalado, Google Chrome presente. `typecheck`, `npm test` (126 tests) y `npm run build` pasan.
- **La carpeta no es un repo git.** Antes de tocar código haz `git init` y un commit inicial (los `.gitignore` ya excluyen `node_modules`, `dist`, `assets-src`, etc.), para poder revertir y mostrar diffs. No hagas push ni crees remoto.
- `assets-src/` (originales de foto y vídeo) no existe en este Mac. Los JPG de `public/projects` son lo único que hay: **guarda los originales** (por ejemplo en `assets-src/projects-original/`, ignorado por git) antes de generar las versiones ligeras y no sobreescribas sin copia.
- No instales nada global ni Homebrew sin pedirlo; usa solo `npm`/`npx` locales.

## SKILLS A USAR (invócalas con la herramienta Skill, en este orden de relevancia)

1. `superpowers:systematic-debugging`: el lag es un síntoma. Aplica método: reproducir, medir, hipótesis, confirmar la causa raíz antes de tocar código. Nada de "optimizaciones" a ciegas.
2. `caveman:investigate-first`: lee el código y mide antes de editar.
3. `run` + `built-in-browser`: levanta el proyecto (`.claude/launch.json` tiene `preview` en 4173 y `dev` en 5173) y mídelo en el navegador integrado. **Audita sobre el build de producción (`npm run build` + `npm run preview`)**, no sobre `dev`: dev miente en bundle size y en rendimiento.
4. `ponytail:ponytail-audit`: úsala como segunda pasada para detectar código y dependencias innecesarias (por ejemplo, solapamiento entre `gsap`, `motion` y `lenis`, o `simple-icons`/`lucide-react` importados enteros).
5. `impeccable:impeccable` y `ui-ux-pro-max:ui-ux-pro-max` (con `taste-skill:design-taste-frontend` como referencia): solo para validar que cada optimización **mantiene** el diseño. Si una optimización degrada lo visual (por ejemplo, quitar un blur), proponla como opción y no la apliques sin avisar.
6. `caveman:safe-refactor` y `caveman:surgical-patch`: al aplicar cambios, que sean pequeños, localizados y reversibles.
7. `superpowers:dispatching-parallel-agents`: la fase de investigación tiene ejes independientes (ver Fase 2). Lánzalos en paralelo con subagentes de solo lectura y reúne los resultados.
8. `superpowers:verification-before-completion`: no declares nada arreglado sin medir antes/después con los mismos criterios.
9. `code-review` o `simplify` al final, sobre el diff completo.

## METODOLOGÍA

### Fase 0: línea base reproducible
- `npm ci` si falta `node_modules`, luego `npm run build` y `npm run preview`. Guarda el tamaño de cada chunk de `dist/assets` (bruto y gzip/brotli) y el peso total transferido por página (`/` y `/es/`).
- Lighthouse (viene en devDependencies) en móvil **y** escritorio, 3 corridas cada uno, con throttling por defecto y también con CPU 4x slowdown. Guarda LCP, INP/TBT, CLS, FCP, Speed Index, peso total y el desglose del main thread.
- Define un perfil de dispositivo "flojo" para todas las mediciones de runtime: CPU 4x–6x throttle, viewport 390×844 y otro 1440×900. Registra siempre con qué perfil mediste.

### Fase 1: reproducir el lag
Para cada tramo de la página (hero/welcome loader, Story pinned: Input → Retrieval → Rerank, Generate, Stack, Output, Footer con wordmark halftone, panel del agente con Ctrl/Cmd+K, cambio EN/ES), usando el navegador integrado y `javascript_tool`:
- Registra una traza de rendimiento mientras haces scroll continuo de arriba a abajo (Chrome DevTools Performance vía CDP si puedes, o `PerformanceObserver` con `long-animation-frame`, `longtask`, `layout-shift`, `event`, y un contador de FPS con `requestAnimationFrame`).
- Identifica **exactamente en qué scroll offset y en qué sección** caen los frames (< 50 fps, frames > 32 ms, long tasks > 50 ms). Entrega una tabla "sección → fps medio / p95 de frame time / causa probable".
- Comprueba si el lag depende de: tamaño de viewport (¿se activa el modo pinned?), `data-lite`, reduced-motion, loader de bienvenida aún activo, canvas visibles fuera de pantalla que siguen animando.

### Fase 2: investigación por ejes (en paralelo, solo lectura)
Lanza un subagente por eje y exige `archivo:línea` + evidencia:

1. **Main thread y JS**: bundle por chunk (usa `rollup-plugin-visualizer` o `vite build --mode analyze` temporal, sin dejarlo instalado salvo que lo apruebe), código sin usar, imports completos de librerías (`three` entero vs `three/examples/jsm` puntual, `simple-icons`, `lucide-react`), duplicación de librerías de animación, hidratación (tamaño y coste del hydrate de toda la página), `useEffect`s con listeners de `scroll`/`resize`/`mousemove` sin throttle ni `passive`, estado de React actualizado en cada frame (`setState` en rAF/scroll), re-renders en cascada, falta de `memo`/refs donde se anima.
2. **Layout, paint y compositing**: `backdrop-filter`, `filter`, `mix-blend-mode`, `box-shadow` grandes sobre elementos animados, animaciones de `width/height/top/left/margin`, `will-change` abusado o ausente, elementos `position: fixed` a pantalla completa con blur, layout thrash (lecturas de `getBoundingClientRect`/`offsetHeight` mezcladas con escrituras), `content-visibility: auto` / `contain` donde falten. Usa la capa "Layers" y "Rendering > Paint flashing / Layout shift regions" para confirmar.
3. **Canvas y WebGL**: `Hologram`/`hologram.ts` (three.js), `HalftoneWordmarkFooter`, `DotOrb`, `DarkFog`, `Background`. Para cada uno: ¿para el loop de rAF cuando está fuera de viewport (IntersectionObserver) y cuando la pestaña está oculta (`visibilitychange`)? ¿`devicePixelRatio` limitado (cap a 1.5–2)? ¿se redimensiona el canvas en cada frame? ¿se reasignan geometrías, materiales, texturas o arrays dentro del loop (GC)? ¿`renderer.dispose()` al desmontar? ¿`powerPreference`, `antialias`, sombras innecesarias? ¿se muestrean píxeles con `getImageData` por frame? ¿cuántos draw calls y triángulos tiene el modelo cargado (`renderer.info`)?
4. **Scroll y animación**: `SmoothScroll` (Lenis) + `scroll.ts` + `Story` pinned + GSAP/ScrollTrigger/motion: ¿hay dos sistemas de scroll peleando? ¿Lenis sincronizado con el ticker de GSAP (un único rAF) o hay varios bucles de rAF en paralelo? ¿Cuántos loops de rAF activos hay simultáneamente? (cuéntalos en runtime parcheando `requestAnimationFrame` temporalmente). ¿`ScrollTrigger.refresh()` se dispara de más? ¿`scrub` con propiedades caras? Textos animados (`FoldText`, `ScrambleText`, `MorphingText`, `TypeLoop`, `BlurReveal`): ¿animan por carácter con muchos nodos DOM, o mutan `textContent` por frame?
5. **Red y assets**: imágenes de `public/projects/*.jpg` (2.9/1.5/1.1 MB): ¿se usan en el above-the-fold, tienen `width`/`height`, `loading="lazy"`, `decoding="async"`, `fetchpriority`, `srcset`/`sizes`? Plan de conversión a AVIF/WebP responsive con `sharp` (ya instalado) y presupuesto por imagen. `ernesto.glb` (1.6 MB): ¿cuándo se descarga (solo bajo demanda/visible)? ¿compresión Draco/Meshopt y texturas KTX2/WebP? (`scripts/optimize-model.mjs` ya existe: revisa qué hace y si realmente se aplicó). `_headers`: cache inmutable o `stale-while-revalidate` para `/fonts`, `/models`, `/photo`, `/projects`; compresión brotli en el host; preconnect/preload de lo que sí hace falta y nada más. Fuentes: `font-display`, subsetting, `preload` correcto, ¿se cargan ambas con peso real necesario?
6. **Carga inicial y orden crítico**: `boot.js`, `welcome.js`, loader de bienvenida (¿bloquea LCP o retrasa interactividad?), `<script type="module">` y prerender (¿el HTML prerenderizado ya trae el LCP real?), CSS crítico, chunk del hologram (¿se carga antes de que el usuario lo vea?), `AgentHost` (¿el panel y el índice BM25 se cargan lazy o en el bundle inicial?), `repos.fallback.json` y `kb.json` (¿entran en el bundle? tamaño).

### Fase 3: informe priorizado (entregable principal)
Crea `docs/audit/PERF_AUDIT_REPORT.md` con:
1. Resumen ejecutivo (5 líneas): las 3 causas principales del lag, con números.
2. Tabla de línea base (antes) con la metodología y el perfil de dispositivo.
3. Tabla de hallazgos ordenada por impacto/esfuerzo. Columnas: ID, severidad (crítico/alto/medio/bajo), eje, `archivo:línea`, evidencia (métrica o traza), causa raíz, arreglo propuesto, impacto esperado, riesgo visual (ninguno/bajo/alto), esfuerzo (S/M/L).
4. Lo que **no** es problema (descartado con evidencia), para no perder tiempo en ello.
5. Presupuesto de performance propuesto (JS inicial, peso de imágenes, LCP, INP, frame time p95) para fijarlo como regresión.

### Fase 4: aplicar arreglos
- Aplica primero los de impacto alto y riesgo visual nulo. Un cambio = una causa raíz = una verificación. Mantén los cambios pequeños y reversibles.
- Después de cada bloque de cambios: `npm run typecheck`, `npm test`, `npm run test:e2e` (los skips por diseño ya están documentados), y repite **exactamente** las mediciones de la Fase 0/1 con el mismo perfil. Anota antes/después en el informe.
- Los cambios que alteren lo visual (quitar blur, bajar densidad del halftone, reducir partículas, desactivar pinned en ciertos equipos) van marcados como "opcionales" con captura antes/después y sin aplicar hasta que Ernesto los apruebe.
- Ideas a evaluar si la evidencia las respalda (no las apliques por defecto): pausar todos los loops fuera de viewport y con pestaña oculta; unificar en un único ticker (GSAP ticker o Lenis `raf`) todos los rAF; limitar DPR de canvas; `content-visibility: auto` en secciones bajo el pliegue; lazy import del agente y del hologram con `IntersectionObserver`/idle; convertir y servir imágenes responsive AVIF/WebP; comprimir `ernesto.glb` (Meshopt/Draco + texturas WebP/KTX2); sustituir `backdrop-filter` por superficies sólidas semitransparentes; tree-shaking de iconos; `will-change` solo durante la animación; `passive: true` en listeners; mover cálculos de scroll a `transform` con refs en vez de estado React; mejorar la heurística `data-lite` (hoy solo CPU/RAM; considera `connection.saveData`, `devicePixelRatio`, y una medición real de FPS durante el welcome loader para degradar de forma adaptativa).

## REGLAS

- Mide siempre contra el **build de producción**. Nunca concluyas con datos de `npm run dev`.
- Sin evidencia no hay hallazgo. Si no puedes medir algo, dilo explícitamente en vez de suponerlo.
- No añadas dependencias nuevas sin justificarlo con números. Si instalas algo temporal para analizar, quítalo al terminar.
- No toques copy, diseño, ni contenido de los tests para "hacerlos pasar".
- No hagas commit, push ni publiques nada sin que Ernesto lo pida.
- Al terminar: resumen corto con (a) qué arreglaste con métricas antes/después, (b) qué dejaste pendiente y por qué, (c) qué necesita decisión de Ernesto.
