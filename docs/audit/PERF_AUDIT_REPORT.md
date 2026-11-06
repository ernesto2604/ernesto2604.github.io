# Auditoría de rendimiento: portfolio

Fecha: 2026-11-06. Todo medido sobre el **build de producción** (`npm run build` + `vite preview`), nunca sobre `dev`.

## 1. Resumen ejecutivo

1. **Las fotos de proyecto eran de 20 MP (3712×5568 px, 1,1 a 2,9 MB).** Cada hover entre proyectos volvía a decodificarlas (80 ms por foto con CPU 4x; Chrome no retiene en caché un bitmap de 82 MB). Eso daba frames de 66 a 283 ms en la sección de proyectos. Ahora son WebP de 1000×1000: 266 kB las tres (antes 5,4 MB), sin decodificación durante el hover.
2. **En el deploy, el problema se multiplicaba por la red.** Cloudflare servía `/projects/*` con `max-age=0, must-revalidate`, así que cada hover pedía otra vez el JPG (unos 750 ms por petición en Fast 4G). Además, el JPG de 1 MB se descargaba a la vez que el JS crítico. Ahora las fotos tienen hash en `/assets/`, que es inmutable.
3. **LCP de Lighthouse: móvil 8,4 s → 3,3 s; escritorio 1,5 s → 0,66 s.** Escritorio pasa de 95 a 100 de score y el peso de la carga inicial de 1448 a 642 kB.
4. **Había animaciones vivas fuera de pantalla.** El timeline GSAP `repeat: -1` de la rejilla y `MorphingText` (blur por frame) seguían corriendo. Ahora se pausan con `IntersectionObserver`. En reposo sobre la sección, el trabajo del hilo principal baja de 1437 a 482–850 ms cada 6 s (CPU 4x).
5. **Descartado con medición:** `mix-blend-mode` de los títulos, `backdrop-filter` del masthead, la reescritura del clipPath a GPU y el GLB (ya usa meshopt + WebP). Ninguno mueve el p95 por encima del ruido.

## 2. Metodología y perfil

- Equipo: Mac arm64 (GPU "Apple M6", ANGLE Metal), Chrome estable en modo headless.
- Runtime: [`docs/audit/bench.mjs`](bench.mjs) (Playwright + CDP). Configuración: viewport 1440×900 a DPR 2, loader de bienvenida saltado, CPU 1x y 4x (`Emulation.setCPUThrottlingRate`) y red opcional Fast 4G (150 ms RTT, 9 Mbps).
- Métricas: intervalos de rAF (fps y p95), `long-animation-frame` y una traza CDP `devtools.timeline` agregada por evento (Paint, Decode Image, GPUTask…).
- Escenarios:
  - **idle**: la sección de proyectos visible durante 6 s.
  - **hover**: 9 cambios de proyecto cada 700 ms.
  - **scroll**: rueda continua de arriba a abajo, 80 px cada 16 ms (pasa por Lenis).
- Lighthouse 13: 3 corridas por cada forma, móvil (throttling por defecto, que ya es CPU 4x) y escritorio. Se toma la mediana.
- "Antes" es el commit `29549bf`, construido en un worktree temporal. "Después" es el árbol de trabajo actual.
- **Limitación:** el panel del navegador integrado estaba oculto (rAF a 1 Hz) y no sirvió para medir. Todo se midió con Chrome headless. El coste de GPU en la composición (blend, backdrop) solo se ve de forma indirecta, a través del frame time.

## 3. Línea base y resultado

### Runtime: sección de proyectos (p95 de frame time / frame máximo / frames > 33 ms / LoAF)

| Escenario | Antes 1x | Después 1x | Antes 4x | Después 4x |
|---|---|---|---|---|
| idle 6 s | 16,7 / 16,8 / 0 / 0 | 16,8 / 16,8 / 0 / 0 | 16,7 / 16,8 / 0 / 0 | 16,8 / 16,8 / 0 / 0 |
| hover ×9 | 16,8 / **66,7** / 4 / 2 | 16,8 / 116* / 1 / 1 | 16,8 / **66,7** / 3 / 3 | 16,8 / **16,8 / 0 / 0** |
| scroll completo | 16,8 / **283** / 16 / 15 | 16,8 / **33,4 / 0 / 0** | 16,8 / 50 / 5 / 0 | 16,8 / 33–50 / 1–3 / 0 (3 corridas) |
| Decode Image en hover | 300 ms | **0** | 346 ms | **0** |

\* Un único `GPUTask` de 164 ms en el proceso GPU, que no se repitió. Con CPU 4x, el hover queda a 60 fps sin frames largos.

### Deploy (Cloudflare Pages) frente a local con Fast 4G

| | CF antes (`ernesto2406.pages.dev`) | Local después (Fast 4G) |
|---|---|---|
| Hover: frame máx. / LoAF | 100 ms / 108 ms | 16,8 ms / 0 |
| Scroll: frame máx. | 50 ms (Decode Image 53 ms) | 16,8 ms |
| Foto inicial | `ring-telemetryops.jpg`, 1073 kB, en paralelo con `index.js` (t = 220 ms) | WebP con hash, 60–114 kB, después de `load` |
| Hover a una foto nueva | se vuelve a pedir el JPG en cada hover (≈ 750 ms; ver `max-age=0` abajo) | precargadas y decodificadas, sin red |

### Lighthouse (mediana de 3)

| | Score | FCP | LCP | TBT | CLS | SI | Peso | Main thread |
|---|---|---|---|---|---|---|---|---|
| Móvil antes | 72 | 2404 | **8404** | 1 | 0 | 2404 | 1410 kB | 2232 ms |
| Móvil después | 89 | 2402 | **3302** | 0 | 0 | 2402 | 604 kB | 2006 ms |
| Escritorio antes | 95 | 522 | 1502 | 0 | 0 | 522 | 1448 kB | 655 ms |
| Escritorio después | **100** | 522 | **662** | 0 | 0 | 522 | 642 kB | 461 ms |

El elemento LCP es un `<span>` de texto en los dos casos. La mejora viene de que el JPG ya no le quita ancho de banda al JS y a las fuentes. El LCP móvil de 3,3 s que queda corresponde al loader de bienvenida (Lighthouse no tiene `sessionStorage` y lo reproduce entero). Es diseño y no se toca.

### Bundle (sin cambios relevantes)

| Chunk | Bruto | gzip |
|---|---|---|
| `index-*.js` | 542 kB | 186,5 kB |
| `hologram-*.js` (lazy) | 641 kB | 162,8 kB |
| `AgentPanel-*.js` (lazy) | 23 kB | 9,4 kB |
| `lenis-*.js` (lazy) | 18,6 kB | 5,4 kB |
| CSS | 61 kB | 13,4 kB |

## 4. Hallazgos

| ID | Sev. | Eje | Archivo:línea | Evidencia | Causa raíz | Arreglo | Impacto | Riesgo visual | Esfuerzo | Estado |
|---|---|---|---|---|---|---|---|---|---|---|
| H2 | Crítico | Assets | `src/sections/Generate.tsx:150` (antes) | 3712×5568 px. Decode Image de 80 ms por hover (4x). Frame de 283 ms al entrar en la sección (1x, en frío). LCP móvil de 8,4 s | JPG de 20 MP pintado a 500×500 CSS px | `scripts/projects-img.mjs`: WebP de 1000×1000 con recorte central (el mismo encuadre que `slice`), q78. Importado vía `import.meta.glob`, así que lleva hash | 5,4 MB → 266 kB. Decode por hover: 0 | Ninguno (diff medio 1,8–3,4/255, ver [captura](projects-photo-before-after.png)) | S | ✅ |
| D1 | Crítico (deploy) | Red | `public/_headers` | CF: `/projects`, `/models` y `/fonts` con `max-age=0, must-revalidate`. Fast 4G: un re-fetch por hover de ≈ 750 ms. GH: todo con `max-age=600` | Assets sin hash y sin regla en `_headers` | Fotos dentro de `/assets/` (inmutables). `_headers`: `/fonts`, `/models` y `/photo` con 7 días + `stale-while-revalidate` | Hover sin red. Visitas repetidas sin revalidar | Ninguno | S | ✅ (CF). GH ignora `_headers`: solo lo arregla el hash |
| H2b | Alto | Main thread | `StackInteractor.tsx` | Al cambiar `href` se decodificaba durante la animación | Sin precarga | Precarga + `img.decode()` de las 3 fotos cuando la sección está a menos de 1 viewport, después de `load` | Hover sin decode | Ninguno | S | ✅ |
| H1 | Medio (era crítico por H2) | Animación | `StackInteractor.tsx` | Con la foto ligera, el idle a 4x da p95 de 16,8 ms. Con la de 20 MP, PrePaint + Paint sumaban 200 ms cada 6 s | El timeline `repeat: -1` corría también fuera de pantalla y con el diálogo del caso abierto | Pausa con IO + prop `paused` (diálogo abierto). La técnica de clipPath se mantiene | El ticker de GSAP solo funciona con la rejilla visible (verificado contando rAF) | Ninguno | S | ✅. La reescritura a GPU (H1b) no está justificada: el criterio se cumple |
| H6a | Medio | Animación | `src/components/ui/MorphingText.tsx` | rAF a 60 fps en **todas** las posiciones de scroll; `filter: blur()` + filtro SVG por frame durante el morph | Bucle sin pausa fuera de pantalla | IO: `play && visible` | Ningún rAF fuera del hero | Ninguno | S | ✅ |
| H3 | Bajo | Paint | `global.css:854`, `StackInteractor.tsx` | A/B con `mix-blend-mode: normal` a 4x: p95 de 16,8 ms en ambos casos, variaciones dentro del ruido | — | Solo `transition-all` → `transition-transform` (el span solo anima `translate`) | Marginal | Ninguno | S | ✅ (el blend se mantiene) |
| H4 | Bajo | Composición | `global.css:195-197` | A/B sin `backdrop-filter` en el masthead: p95 de 16,7–16,8 ms en ambos casos | — | Ninguno | — | — | — | Descartado |
| H5 | Bajo | React | `StackInteractor.tsx` | Tras H2, hover a 4x sin frames > 16,8 ms | El revert/recreate del timeline por cada cambio de máscara cuesta < 1 frame | Ninguno | — | — | — | Descartado |
| N1 | Bajo | Main thread | `SmoothScroll.tsx:31` | Lenis `autoRaf` deja un rAF permanente a 60 fps (incluso sin scroll). Un `FunctionCall` de 25 ms en 3 corridas a 4x | Diseño de Lenis | Opcional: `autoRaf: false` y conducirlo desde el ticker de GSAP | Muy bajo | Ninguno | M | Pendiente (sin evidencia de lag) |
| N2 | Info | Red | `public/models/ernesto.glb` | 1,6 MB. CF no lo comprime (`model/gltf-binary`); GH lo sirve en gzip (1,24 MB). Llega a t ≈ 1,2–3,4 s con 4G | Ya usa meshopt + textura WebP de 2048 px (`scripts/optimize-model.mjs`) | Opcional: textura de 1024 px (riesgo visual bajo) | Carga del hero | Bajo | S | Para que decida Ernesto |

## 5. Lo que **no** es problema (descartado con evidencia)

- **`mix-blend-mode: difference`** en la lista de proyectos: el A/B no cambia el p95 ni los frames largos.
- **`backdrop-filter` del masthead** (3 capas): el A/B tampoco cambia el p95.
- **ClipPath SVG animado:** con la foto ligera cuesta menos de un frame a 4x. No hace falta reescribirlo a divs, máscaras o canvas.
- **Hologram, `HalftoneWordmarkFooter` y `DotOrb`:** ya pausan con `IntersectionObserver` o con `active`. El conteo de rAF confirma que el hologram solo corre en el hero y el halftone solo despierta con interacción.
- **`DarkFog`:** solo hace rAF en eventos de scroll (cero rAF en reposo).
- **Pestaña oculta:** rAF, GSAP y Lenis se congelan solos. Añadir `visibilitychange` no aporta nada.
- **Imports de iconos:** `lucide-react` y `simple-icons` usan imports con nombre, así que el tree-shaking funciona.
- **TBT:** 0–1 ms. El chunk de 542 kB no bloquea la interacción.

## 6. Presupuesto propuesto (regresión)

| Métrica | Presupuesto | Hoy |
|---|---|---|
| JS inicial (gzip) | ≤ 190 kB | 186,5 kB |
| Fotos de proyecto (las 3) | ≤ 400 kB, ≤ 120 kB cada una | 266 kB (60 / 95 / 111) |
| LCP escritorio / móvil (Lighthouse) | ≤ 1,0 s / ≤ 3,5 s (con welcome) | 0,66 / 3,3 s |
| TBT | ≤ 50 ms | 0 |
| p95 de frame time en la sección de proyectos, 4x | ≤ 33 ms | 16,8 ms |
| Decode Image durante hover | 0 | 0 |

## 7. Segunda pasada: Safari (WebKit)

Ernesto seguía notando lag, sobre todo en Safari. Para medirlo usé Playwright WebKit 27.2 (el motor de Safari 27.2) con [`bench-webkit.mjs`](bench-webkit.mjs). Configuración: 1440×900 a DPR 2, sin throttling. WebKit no tiene CDP, así que solo mido intervalos de rAF y hago A/B inyectando CSS. Cada A/B se repitió de 2 a 3 veces.

| Sección (reposo, 3 s) | Antes: fps / p95 / máx. | Después: fps / p95 / máx. |
|---|---|---|
| Hero (`#input`) | **42 / 39 / 235 ms** | **60 / 18 / 18** |
| Proyectos, skills, output, footer | 60 / 18 / 18 | 60 / 18 / 18 |
| Hover entre proyectos | 62 / 18 / 20 | 62 / 18 / 18 |

| A/B en el hero (WebKit, reposo) | fps / p95 / máx. |
|---|---|
| Base | 42 / 39 / 235 |
| Sin `filter` en `MorphingText` | 60 / 18 / 18 |
| Sin el canvas del hologram | 43 / 40 / 258 (no es la causa) |
| Sin `backdrop-filter` en el masthead | 39–45 / 38–55 / 347 (no es la causa) |
| Sin la niebla (`DarkFog`) | 41 / 45 / 272 (no es la causa) |
| `will-change` solo en los dos textos | 52 / 30 / 105 |
| `will-change` en todos los hijos (también las copias `.invisible`) | **60 / 18 / 18** |

| ID | Sev. | Archivo | Causa raíz | Arreglo | Riesgo visual | Estado |
|---|---|---|---|---|---|---|
| S1 | Crítico (Safari) | `src/components/ui/MorphingText.tsx` | Durante el "derretido" (1,5 s de cada 4 s), WebKit rasterizaba por software toda la caja del título con el filtro SVG de umbral + `blur()` en cada frame | ~~`will-change` en cada hijo~~ (rompía el morph líquido en Safari real, ver 7c). Ahora: blur máximo de 10 px en lugar de 100 px, sin `will-change` | El morph se ve igual. Queda una micro-caída de fps al inicio de cada cambio en Safari | ✅ (corregido en 7c) |
| S2 | Bajo (solo WebKit headless) | `src/styles/global.css:832-848` | Al entrar en `skills`, `html[data-dark]` transiciona 10 custom properties registradas (`@property`, que se heredan) durante 0,5 s. Toda la página se recalcula y repinta en cada frame. Son 3 frames de 37–50 ms, siempre justo después del cambio (correlación con `MutationObserver` + `getAnimations`). Quitar la niebla, el blend o el blur no lo cambia | Opción: que la paleta cambie de golpe (`transition-duration: 0s`) mientras la niebla tapa el papel | **Medio**: el color del texto deja de hacer el fundido de 0,5 s | **Pendiente: decide Ernesto** |
| S3 | Bajo | `src/lib/hologram.ts` | El init de three.js (shaders) da un frame de 35–56 ms en WebKit, a los ~6,4 s, al acabar el loader | — | — | Se acepta |

Descartado en WebKit:
- Puntero sobre el hologram, el halftone del footer y la ProfileCard: 60 fps, p95 de 18 ms.
- Loader de bienvenida: solo 1 o 2 frames largos en el primer pintado (unos 100 ms, en Chrome también).

**Limitación:** es WebKit headless, no el Safari real del equipo de Ernesto. Para medir Safari de verdad hay que activar *Desarrollo → Permitir automatización remota* (`safaridriver`).

## 7b. Safari 27.2 real (equipo de Ernesto)

Medido en el Safari real del equipo de Ernesto con `safaridriver` y [`bench-safari.mjs`](bench-safari.mjs) (WebDriver por HTTP, sin dependencias nuevas). Configuración: ventana de 1440×948, DPR 2, modo pinned activo, `data-lite` no activo. El scroll se hace desde la propia página (24 px por frame, unas 1440 px/s), porque las acciones `wheel` de `safaridriver` no mueven la página. Para medir el estado "sin arreglo" se inyecta `.hero-title *{will-change:auto!important}`.

| Safari real | Sin arreglo S1 (6 corridas) | Con arreglo S1 (9 corridas) |
|---|---|---|
| Hero en reposo | 37–59 fps | 60 fps / p95 18 ms |
| **Proyectos en reposo** | **7–12 fps, frames de 280–320 ms** | 60 / 18 |
| Skills en reposo | 3–29 fps, picos de 313–965 ms | 60 / 18 |
| Scroll completo | 11–31 fps, picos de 1,4 s | 59–60 fps, p95 18 ms, máx. 31–41 ms |
| Hover entre proyectos | — | 60 fps, p95 17 ms, máx. 22 ms |

- **Hallazgo:** en Safari real, las capas propias del título del hero (S1) no solo arreglan el hero. Sin ellas, proyectos y skills caen a 7–14 fps mientras la foto enmascarada anima, aunque el morph esté parado fuera de pantalla (comprobado: `filter: none`). Cambian el árbol de capas de Safari, y la animación del clipPath deja de forzar repintados enormes. **El mecanismo exacto no está confirmado.** Probé `contain: paint` en el SVG, `will-change: transform` en el SVG y `contain: paint` en el icono del enlace con blend; ninguno lo reproduce de forma fiable con el CSS del bundle.
- **Artefactos de la medición, descartados:**
  - Inyectar cualquier hoja tarde (incluso una regla vacía) alteraba el resultado.
  - Corridas con 0 frames o con un "frame" de 56 s: Safari para rAF cuando la ventana automatizada queda tapada o en segundo plano.
- **Riesgo:** el buen rendimiento en Safari depende de una decisión interna de capas de WebKit. Si se toca la estructura del hero o de la sección de proyectos, hay que volver a medir con `bench-safari.mjs`.

### 7c. Corrección de S1: el `will-change` rompía el morph líquido en Safari

Ernesto vio que en Safari real (no en Chrome) el morph "AI Engineer" ↔ "I'm Ernesto" ya no se veía líquido, sino como un fundido borroso. En Safari, cualquier hijo con capa propia dentro de la caja del filtro escapa al filtro SVG de umbral. Probado a ojo en Safari real con copias del build que llevan cada variante incrustada en el HTML. Las capturas de WebDriver no sirven aquí: Safari las renderiza por software y todas las variantes salen "líquidas".

| Variante (Safari 27.2 real) | Morph líquido | Hero con morph, fps / p95 ms / frames > 33 ms | Proyectos / skills |
|---|---|---|---|
| `will-change` en todos los hijos (S1) | No | 60 / 18 / 0 | 60 |
| Solo en las copias `.invisible` | No | 60 / 18 / 0 | 60 |
| Capa en la caja o en el `h1` | Sí | se laggea (a ojo) | — |
| Sin `will-change` (original) | Sí | **10 / 230 / 20** | 60 |
| Sin `will-change` + blur máximo 20 px | Sí | 47 / 50 / 30 | 50–60 |
| **Sin `will-change` + blur máximo 10 px (aplicado)** | **Sí** | **50 / 33 / 9** | 58–60 |

- **Aplicado:** sin `will-change` en el título y con `Math.min(8 / fraction - 8, 10)` en lugar de `100` en [`MorphingText.tsx`](../../src/components/ui/MorphingText.tsx). El umbral convierte el blur en bordes duros, así que con 10 px la fusión se ve igual. Queda una micro-caída de fps al inicio de cada cambio.
- **Proyectos y skills ya no necesitan el `will-change`.** Sin él dan 60 fps porque el morph se pausa fuera de pantalla (IntersectionObserver). Esto deja obsoleto el hallazgo de 7b sobre las capas del título.
- **Si hace falta 60 fps estables durante el cambio:** la única vía que conserva el efecto es WebGL, con blur y umbral en un shader.

## 8. Tests

- `npm run typecheck`: OK.
- `npm test`: 126/126.
- `npm run test:e2e`, tras la segunda pasada: 98 pasan, 8 skips y 24 fallos. Uno de ellos es `agent.spec.ts:260` en escritorio: la violación strict-mode "I can't answer that" resuelve a 2 elementos (el texto visible y la región `aria-live`). Es exactamente el mismo fallo que ya daba ese test en móvil en la línea base. Es una carrera de tiempos del test y el diff no toca `src/agent/`. Comprobado: falla 3 de 3 veces también con el build sin el `will-change` de S1.
- `npm run test:e2e`, en la primera pasada: 99 pasan, 8 skips y **23 fallos que ya existían**. Son exactamente los mismos 23 en el commit base `29549bf` (comparados nombre a nombre). Ejemplos: axe `color-contrast` y `label-content-name-mismatch` en la lista de proyectos, y pruebas de welcome y nav. No los provoca esta auditoría.
