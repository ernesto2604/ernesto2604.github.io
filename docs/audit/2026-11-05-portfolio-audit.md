# Auditoría de diseño y contenido del portfolio (2026-11-05)

**Qué se auditó**

- Repo `C:\Users\ernee\Desktop\portfolio`, rama `feat/background`, commit **`a268bcb`** ("feat(hero): mono tagline, centred ask line and a scroll cue"). El árbol estaba limpio cuando empezó la auditoría.
- Web publicada: https://ernesto2406.pages.dev/ y `/es/`.

**Incidencia durante la auditoría**

- Otra sesión volvió a editar la carpeta entre las 19:15 y las 19:25: 8 archivos sin commitear (`public/welcome.js`, `Masthead.tsx`, `ScrambleText.tsx`, `src/lib/welcome.ts`, `Story.tsx`, `global.css` y dos tests).
- Además, esa sesión **reconstruyó `dist/` hacia las 19:17–19:21**.
- Para que el resultado no dependiera de eso, se extrajo `a268bcb` con `git archive` al scratchpad, se compiló allí y se sirvió en `:4180`. Todas las cifras de axe, teclado y semántica, y la verificación del agente, salen de esa build congelada.
- Lighthouse se ejecutó antes del rebuild, sobre la build de `a268bcb` en `:4173`.
- Las capturas de diseño con reloj del masthead anterior a las 19:21 también son de `a268bcb`. Se marcan las excepciones.

**Método**

- 4 agentes en paralelo, con fusión y deduplicación manual:
  - diseño y marca;
  - contenido y fact-check;
  - accesibilidad, rendimiento y SEO;
  - simulación de recruiter.
- Skills usadas:
  - `impeccable`: critique (Assessment A en el agente de diseño, Assessment B/detector en el de accesibilidad) y audit.
  - `design-taste-frontend`: lint e inspect.
  - `ui-ux-pro-max`: checklists de accesibilidad y UX.
  - `dispatching-parallel-agents`.
  - `verification-before-completion`.
- Herramientas: Lighthouse 13.5 (móvil, 3 ejecuciones por idioma, en local y en live), axe-core 4.14 vía Playwright, navegador integrado.

**Evidencias** en `.shots/audit/`:

| Carpeta | Contenido |
|---|---|
| `design/` | 218 archivos (capturas por página, idioma y ancho, salida de taste) |
| `recruiter/` | 114 |
| `a11y/` | 40 |
| `axe/` | 33 JSON |
| `lighthouse/` | 12 informes JSON + HTML |
| `content/` | contenido |
| `lead/` | verificaciones propias |

> **Degradación declarada (impeccable):** el Assessment A y el B corrieron en agentes separados, pero el detector lo ejecutó el agente de accesibilidad sobre el árbol de trabajo y el `dist/` posterior a las 19:17. Por eso sus números son orientativos. No se escribió ningún snapshot en `.impeccable/`, porque la auditoría es de solo lectura.

---

## 1. Resumen ejecutivo

1. La **idea** es buena y propia: la página funciona como un pipeline RAG que responde "¿quién es Ernesto?", con un agente que enseña sus tool calls y diagramas de arquitectura. Ingenieros y recruiters la recuerdan.
2. La **ejecución** de la versión local tapa esa idea:
   - La primera pantalla solo dice "I'm Ernesto" y un eslogan ("NOT HERE TO FOLLOW. HERE TO BUILD.").
   - Falta el rol fijo, qué ha construido, un CTA y un CV.
   - **En este punto la versión publicada es mejor que la local.**
3. **Dos P0:**
   - El agente responde "**Yes.** He is available now…" a "Has he deployed anything to production?". Es una afirmación falsa ante la pregunta más típica de un ingeniero. Verificado en live y en local.
   - **Seguridad fuera del sitio:** hay dos claves de Google y un token de Telegram en el historial de repos públicos que el sitio enlaza, y tu teléfono en el historial público del repo del portfolio.
4. **No hay CV descargable** en ninguna parte del sitio, en ningún idioma.
5. **La web publicada va 10 commits por detrás.** Muestra interstitials "Thinking…" que en móvil retrasan el nombre y el rol unos 7 s.
6. **Rendimiento:** Lighthouse móvil Performance da 64–69 en local y 43–69 en live, frente al objetivo de 90+. La causa principal es el modelo `ernesto.glb` de 1,6 MB, que se descarga en todos los dispositivos sin interacción, más un TBT de 1,3–2,4 s.
7. **Afirmaciones que el código contradice:**
   - El pie dice "hosted on GitHub Pages. No cookies, no trackers", pero el dominio canónico (pages.dev) inyecta el beacon de Cloudflare y el formulario envía a formsubmit.co.
   - El caso del RAG dice "concurrently" y "exponential backoff", y el código hace `await` secuenciales y `sleep(0.5)` fijo.
   - El stack lista `pytest` y el repo no tiene ningún test con asserts.
8. **"Parece hecho con IA": confirmado.** No es por el concepto, es por el acabado:
   - componentes de catálogo reconocibles: StaggeredMenu numerado, ProfileCard con StarBorder, MorphingText, halftone de 21st.dev;
   - etiquetas mono entre corchetes, numerales fantasma y un reloj con glitch;
   - paleta crema más ámbar.
9. **"Demasiado texto": confirmado a medias.**
   - El flujo visible ronda las 670 palabras en EN y las 760 en ES, que no es enorme.
   - El problema es dónde se concentra: about de 103 palabras bajo "The answer, in short", resúmenes de 40–50 palabras con HNSW/GIN/RRF y unas 400 palabras más en los diálogos de casos.
   - El copy suena a IA por la **cadencia de eslogan**: "Not here to follow. Here to build.", "Measure first, reason second", "Refuse rather than invent".
   - Lo grave es el reparto: lo mejor (casos, cifras de tests) va escondido y la pared de iconos queda visible.
10. **Veredicto:** para AI Engineer junior o graduate, probablemente le llamen gracias a Ring TelemetryOps y la calidad de los casos. Para FDE, dudoso. El cambio que más sube las probabilidades: una primera pantalla con nombre, rol fijo, una frase de qué construye y "CV" + "Contact". Y corregir el agente antes de desplegar.

---

## 2. Scorecard (0–10)

| Área | Nota | Justificación |
|---|---|---|
| Primera impresión | 3 | El test de 5 s falla en rol, trabajo y contacto. El rol solo se ve unos 1,5 s de cada 4 por el morph, y nunca con reduced-motion. |
| Jerarquía y composición | 5 | El hero tiene un buen tamaño de título, pero compiten 5 elementos animados. Los casos quedan tras carpetas, hay pantallas casi vacías y el pie usa otro sistema de márgenes. |
| Tipografía | 6 | Inter con tracking ajustado funciona. Hay 12 tamaños en uso (11–137 px), 12 bloques por debajo de 13 px y micro-labels mono en mayúsculas. |
| Color y fondo | 6 | La paleta es coherente pero es la típica "crema + ámbar". Contraste del pie a 2,6:1 y foco del menú oscuro a 2,59:1. |
| Movimiento | 5 | Respeta bien reduced-motion. Pero hay demasiadas cosas moviéndose a la vez, el loader se repite en cada recarga y el morph esconde el dato clave (el rol). |
| Responsive | 7 | No hay scroll horizontal en ninguna de las 6 anchuras. Fallan el diagrama a 390, el chip [TAB] cortado en ES, "CTRL + K" mostrado en táctil y áreas táctiles pequeñas. |
| Credibilidad del contenido | 4 | Ring y el RAG sin frameworks aguantan en su mayor parte (unas 30 afirmaciones verificadas). Pero el agente afirma un despliegue inexistente, hay 5 afirmaciones contradichas por el código, "agents" en plural, la métrica del CEU sin confirmar y la KB le llama "Forward Deployed Engineer". |
| Copy | 4 | Los casos tienen decisiones reales. El hero es un eslogan, hay cadencia de eslogan en todo el sitio, jerga RAG para recruiters, resúmenes duplicados, y lo más convincente (`fact`, cifras de tests) no se ve. |
| Paridad EN/ES | 7 | Paridad completa de claves y placeholders, y no faltan tildes. El ES tiene un 12–19 % más de texto, anglicismos sin traducir, un "con … con" y añade información que el EN no tiene. |
| Accesibilidad | 7 | 0 violaciones axe en 37 estados, buen orden de foco y diálogos correctos. Fallan el foco invisible en "Send message", el contraste del pie, el skip link y reduced-transparency parcial. |
| Rendimiento | 3 | Perf móvil 64–69 local y 43–69 live, TBT de hasta 2,4 s, GLB de 1,6 MB (77 % de los bytes). |
| SEO | 8 | Canonical, hreflang recíproco, sitemap, robots, JSON-LD válido, 404 real en live y OG 1200×630. Flojos el `<title>` sin rol y el JSON-LD sin `image`. |

**impeccable critique (Nielsen, superficie Experience; la heurística 10 es n/a):** **23/36 (64 %, banda "Aceptable")**.

| # | Heurística | Nota |
|---|---|---|
| 1 | Estado del sistema | 3 |
| 2 | Lenguaje del usuario | 2 |
| 3 | Control y libertad | 3 |
| 4 | Consistencia | 2 |
| 5 | Prevención de errores | 3 |
| 6 | Reconocer, no recordar | 2 |
| 7 | Flexibilidad | 3 |
| 8 | Estético y minimalista | 2 |
| 9 | Recuperación de errores | 3 |

- Carga cognitiva: falla en 3 de 8 puntos (moderada): foco único, opciones mínimas y revelado progresivo invertido.
- Especificidad: "mixta, inclinada a plantilla".

**impeccable audit:** **14/20 ("Bien")**.

| Dimensión | Nota |
|---|---|
| Accesibilidad | 3 |
| Rendimiento | 2 |
| Theming | 3 |
| Responsive | 3 |
| Integridad | 3 |

**design-taste-frontend:**

- Lint de `src`: 65 FAIL / 24 WARN.
- Inspect: EN 13 FAIL / 5 WARN y ES 14 FAIL / 5 WARN. Salidas en `.shots/audit/design/taste-*.txt`.

FAIL que confirmo:

- mono/micro-label;
- glow del StarBorder;
- numerales fantasma;
- small-text;
- empty-screens (carpetas);
- first-action (sin botón en la primera pantalla a 390 y 768);
- palette-cream;
- eyebrow "Available now";
- edge-text en ES a 768.

Falsos positivos:

- shadow ×14: son sombras transparentes;
- mono en los tool calls del agente: ahí es código literal y está bien;
- few-pictures / no-footage: en un portfolio personal, fotos de stock serían peor;
- gradient-text: viene de `FoldText.tsx`, que es código muerto;
- covered-text: lo mide durante la transición del pin.

**ui-ux-pro-max.**

Falla:

- contraste;
- focus states;
- target size;
- skip link;
- reduced-transparency;
- scripts de terceros (live);
- optimización de imagen (no hay `srcset`);
- fallback de red del GLB.

Descartado por no aplicar:

- haptics;
- safe areas / Dynamic Island;
- bottom nav;
- gestos de sistema;
- login (password toggle, autenticación accesible);
- charts;
- virtualización de listas;
- offline/PWA;
- touch target de 44 pt: se aplicó el criterio web de WCAG 2.2, que es 24 px.

---

## 3. Hallazgos (por severidad, luego por impacto/esfuerzo)

Leyenda:

- **V** = verificado, lo he visto o medido. **I** = inferido.
- Los IDs entre paréntesis remiten a los informes de cada agente.
- Rutas de evidencia relativas a `.shots/audit/`.

### P0

**F-00 · Secretos y datos personales en el historial de repos públicos enlazados desde el sitio**

- Severidad: P0. Estado: V. Esfuerzo: S–M. (C-01, C-02)
- **Evidencia** (verificada por mí; los valores van enmascarados):
  - `ernesto2604/lastVersionWakeMap` (PUBLIC): dos claves de Google API (`AIzaSyBD…` y `AIzaSyCg…`) en el historial (commits `73c4311`, `6a798e2`, `46b2364` y `ab3bf44`, de marzo y abril de 2026), en AndroidManifest, Info.plist, .env e index.html. Se borraron después, pero siguen en el historial.
  - `ernesto2604/AI_surveillance_hub` (PUBLIC): `TELEGRAM_TOKEN = "8574425087:AAH2…"` en `eae9dce` (2026-01-14). Se movió a env en `c6d0404`.
  - `ernesto2604/ernesto2604.github.io` (PUBLIC, el repo de este sitio, enlazado como "Source of this site"): el teléfono (`"phone": ["+34", …]`) está en `src/content/profile.json` desde `be11d30`. Se quitó en `2852fa8`, pero `be11d30` sigue en `origin/main`.
  - **No se comprobó si las claves siguen activas.** Eso habría sido usar credenciales.
- **Por qué importa:**
  - Las claves activas pueden generar coste o abuso.
  - Un revisor con un escáner de secretos (o GitHub secret scanning) lo ve, y en un perfil que presenta "Secure Auth Go" se lee como falta de criterio de seguridad.
  - El teléfono queda expuesto a scraping.
- **Arreglo:**
  1. Revocar o rotar ya las dos claves de Google y el token de Telegram (BotFather `/revoke`).
  2. Reescribir el historial con `git filter-repo` o BFG, o volver a publicar los repos limpios.
  3. Para el teléfono, reescribir el historial del repo del sitio, o aceptar el riesgo de forma consciente.

  **Esto lo haces tú. No es un cambio de copy.** Reescribir el historial es irreversible y obliga a hacer force-push.

**F-01 · El agente afirma un despliegue en producción que no existe**

- Severidad: P0. Estado: V. Esfuerzo: S. (R-01)
- **Dónde:** agente (Ctrl/Cmd+K), live y local. `src/content/agent/kb.json:358` (keyword `"forward deployed"`) y `:373` (respuesta).
- **Evidencia:**
  - `lead/agent-en-800-deployed-yes.jpg`: `match_intent("Has he deployed anything to production?") → availability (score 2.05)` → "Yes. He is available now for AI Engineer, Forward Deployed Engineer…".
  - Reproducido también en `recruiter/persona-local4180-agent-who.png`.
- **Por qué importa:** es la primera pregunta trampa que haría un ingeniero. Una respuesta "Yes" falsa invalida la credibilidad de todo lo demás y deja ver un matching por palabras sueltas ("deployed" ≈ "forward deployed").
- **Arreglo:**
  - En `src/agent/match.ts`, exigir coincidencia de frase para keywords de varias palabras.
  - Añadir un intent `production` con una respuesta honesta (qué está desplegado y qué no).
  - Añadir tests de regresión con preguntas trampa (production, salary, years of experience, "is he senior").

### P1

**F-02 · Primera pantalla sin rol fijo, sin qué construye y sin CTA**

- Severidad: P1. Estado: V. Esfuerzo: S. (D-01, R-04)
- **Dónde:** hero local, `src/sections/Story.tsx` y `hero.*` en `en.json`/`es.json`.
- **Evidencia:**
  - `design/home-en-1366.png` y `design/home-en-390.png` (19:15–19:17, a268bcb): solo "I'm Ernesto", "NOT HERE TO FOLLOW. HERE TO BUILD." y "[SCROLL TO EXPLORE]".
  - "AI Engineer" solo aparece en el ciclo del morph (unos 1,5 s de cada 4) y no aparece nunca con reduced-motion (`design/home-en-1440-reduced.png`).
  - No hay email, LinkedIn ni botón en la primera pantalla.
- **Test de 5 s:**

| Pregunta | 390 | 1366 |
|---|---|---|
| ¿Quién? | Sí (sin apellido) | Sí (sin apellido) |
| ¿Rol? | No | Intermitente |
| ¿Qué ha construido? | No | No |
| ¿Contacto? | No | No |

- **Por qué importa:** el recruiter de 30 s decide aquí. Live tenía "I build AI systems end to end: RAG, agents and the backend that makes them reliable" y el botón "See the work", y se han perdido.
- **Arreglo:** título estático "Ernesto Contreras" + "AI Engineer", una frase concreta de qué construye, botones "See the work" / "CV" / "Contact", y el eslogan fuera o como texto secundario.

**F-03 · No hay CV descargable**

- Severidad: P1. Estado: V. Esfuerzo: S. (R-02)
- **Dónde:** todo el sitio. `src/content/profile.json` no tiene clave `cv` y no existe `public/cv/`.
- **Evidencia:** `cat src/content/profile.json` (no hay clave cv). El README documenta cómo activarlo y está sin hacer.
- **Por qué importa:** es lo primero que busca un recruiter, y muchos ATS lo necesitan.
- **Arreglo:** poner los PDFs EN y ES en `public/cv/` y añadir `"cv": {"en": …, "es": …}`. Enlazarlo en el hero, el menú y el contacto. Comprobar que `/es/` enlaza el CV en español.

**F-04 · La web publicada está desfasada (10 commits) y en móvil retrasa el contenido unos 7 s**

- Severidad: P1. Estado: V. Esfuerzo: S. (R-03, R-05)
- **Dónde:** https://ernesto2406.pages.dev/.
- **Evidencia:**
  - `sitemap.xml` live tiene `lastmod 2026-10-28` frente a 2026-11-05 en local. Los hashes de assets son distintos (`index-6702SAgg.js` frente a `index-DFNuQcrt.js`).
  - El texto live todavía incluye "Thinking… / Reading the query: who is Ernesto?…".
  - `recruiter/live-en-390-first.png`: a unos 6,5 s solo se ve "Thinking…".
  - La lista completa de diferencias está en §8.
- **Por qué importa:** los recruiters evalúan hoy una versión que ya has descartado.
- **Arreglo:** desplegar, pero **después** de F-01, F-02 y F-03. Desplegar el hero local tal cual empeoraría el mensaje.

**F-05 · Rendimiento móvil muy por debajo del objetivo de 90**

- Severidad: P1. Estado: V (cifras) / I (causa del long task). Esfuerzo: M. (A-04, A-05)
- **Dónde:** `src/components/Hologram.tsx:25,44` y `public/models/ernesto.glb`.
- **Evidencia (`lighthouse/*.report.json`):**

| Build | Idioma | Perf (3 runs) | LCP | TBT |
|---|---|---|---|---|
| Local | EN | 69 / 64 / 67 | 2,7–2,8 s | 1 280–2 390 ms |
| Local | ES | 64 / 66 / 64 | 2,7–3,0 s | 1 650–1 760 ms |
| Live | EN | 69 / 47 / 68 | 3,6–4,3 s | 580–2 140 ms |
| Live | ES | 61 / 48 / 43 | 3,6–4,6 s | 1 100–2 150 ms |

  - CLS ≤ 0,012.
  - Peso total 2 053 KiB, del que `ernesto.glb` son 1 586 KiB (77 %). Ya está comprimido con meshopt y tiene 131 540 vértices.
  - El modo `lite` (móvil o `pointer: coarse`) solo cambia antialias y pixel ratio. **El modelo se descarga igual**, lo dispara un IntersectionObserver al terminar el loader.
  - Main thread: Style & Layout 3,3 s y Script 2,9 s. Hay un long task de unos 1 052 ms hacia los 3,7 s. Su causa no está confirmada sin una traza (I: hidratación, pin de GSAP, halftone del pie).
  - Elemento LCP local: `h1.hero-title > span.relative > span.absolute` (el título que muta). En live: `#welcome .welcome-word` (la palabra del loader).
- **Por qué importa:** incumple una restricción del propio proyecto. En móviles de gama media se nota el retraso, y un ingeniero que pase Lighthouse lo ve enseguida.
- **Arreglo:**
  - En `lite`, mostrar un póster estático (la foto o un PNG del holograma) y cargar el GLB al tocar o pasar el ratón, o servir un GLB decimado a unos 30k vértices.
  - Diferir el pin y el halftone hasta que sean visibles.
  - Sacar una traza de Performance para identificar el long task.

**F-06 · El pie afirma "GitHub Pages · No cookies, no trackers" y es falso en el dominio canónico**

- Severidad: P1. Estado: V. Esfuerzo: S. (A-03, R-12)
- **Dónde:** `src/content/en.json:448` (`footer.built`), su equivalente en ES y `kb.json:512`.
- **Evidencia:**
  - Lighthouse live muestra la petición a `https://static.cloudflareinsights.com/beacon.min.js` (third-party 10 KiB). No está en el repo: la inyecta Cloudflare.
  - `src/sections/Output.tsx:11,28` hace `fetch` a `https://formsubmit.co/ajax/<email>`.
  - En la build local, cargar la página, hacer scroll y usar el agente generan **0** peticiones a terceros (V).
- **Por qué importa:** un ingeniero que abra DevTools ve la contradicción en 10 segundos. Es una afirmación técnica falsa en un portfolio técnico.
- **Arreglo:** desactivar Web Analytics en el panel de Cloudflare Pages, o reescribir el texto ("Hosted on Cloudflare Pages, mirrored on GitHub Pages. The contact form goes through FormSubmit."). Mejor las dos cosas.

**F-07 · Los casos, lo mejor del sitio, quedan escondidos tras carpetas**

- Severidad: P1. Estado: V. Esfuerzo: M. (D-02)
- **Dónde:** `#generate`, componente FolderFloat.
- **Evidencia:** `design/case-en-1440-hover.png` (carpetas de 260×190 con texto de 12 px, sin pista de "abrir"). El inspector de taste marca 2 de 7 pantallas como casi vacías. Abierto, el caso es excelente (`design/case-en-1440.png`).
- **Por qué importa:** el hiring manager tiene que descubrir que hay que hacer clic en una carpeta. Si no lo hace, no ve diagramas ni decisiones.
- **Arreglo:** mostrar inline, por caso, el titular + una línea de resultado + el diagrama + 3 decisiones clave, con "Read more" para el detalle. Quitar las carpetas.

**F-08 · Tics de plantilla ("parece hecho con IA")**

- Severidad: P1. Estado: V. Esfuerzo: M. (D-03)
- **Dónde y qué:**
  - StaggeredMenu de React Bits con superíndices 01–04 (`src/components/Nav.tsx:62`).
  - `ProfileCard.tsx` con `StarBorder.tsx` (glow alrededor de "Send message").
  - `MorphingText.tsx` (shadcn).
  - `HalftoneWordmarkFooter.tsx` (21st.dev).
  - Etiquetas mono entre corchetes: "[SCROLL TO EXPLORE]", "[CTRL + K]", "[GO TO CONTACT →]".
  - Numerales fantasma "03" y "04".
  - Reloj con scramble que muestra glitches del tipo "19:%@ &=?" (`design/scroll-en-390-04.png`).
  - Guías de columna discontinuas.
  - Paleta #F6F4EF + ámbar.
  - En el copy: el eslogan "Not here to follow. Here to build.", "status 200 · 4 stages · the agent sends 0 network requests" y el eyebrow "Available now".
- **Lo que sí es distintivo (no tocar):** el pipeline con scores reales, el agente que enseña sus tool calls, los diagramas por caso, el holograma en tinta y el wordmark final.
- **Por qué importa:** los ingenieros reconocen estas piezas de catálogo, y restan autoría justo donde el concepto la suma.
- **Arreglo:**
  - Quitar ProfileCard y StarBorder (contacto como lista sobria).
  - Quitar numerales fantasma, corchetes y el scramble del reloj (reloj estático o fuera).
  - Menú sin números.
  - Una sola familia de etiquetas, en sentence case.

**F-09 · Foco invisible en el CTA de contacto y en el menú**

- Severidad: P1 (WCAG 2.4.7 / 1.4.11). Estado: V. Esfuerzo: S. (A-01, D-04)
- **Dónde:** botón "Send message"/"Enviar mensaje" (outline `rgba(255,255,255,.1)` sobre crema) y enlaces del menú oscuro (#8C4A00 sobre #17191E = 2,59:1, recalculado por mí).
- **Evidencia:** `a11y/focus-send-message.png` y `design/focus-en-1440-menu-0.png`.
- **Por qué importa:** es el CTA de contacto, y es un fallo AA que un revisor de accesibilidad detecta enseguida.
- **Arreglo:** `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px }` en ese botón. Dentro de `.menu-dialog`, usar un outline claro (≥3:1 sobre #17191E).

**F-10 · Texto del pie por debajo de AA**

- Severidad: P1. Estado: V. Esfuerzo: S. (A-02, D-05, A-13)
- **Dónde:** `HalftoneWordmarkFooter.tsx:158-159`.
- **Evidencia:**
  - Encabezados de columna #999998 sobre #f6f4ef = 2,59:1 a 10,5 px (recalculado).
  - Línea de marca a 3,0:1.
  - "Available now" de la tarjeta a 3,9:1 con 12,5 px.
  - axe lo deja como "incomplete" por el canvas de fondo. Se midió por píxel.
- **Arreglo:** opacidad ≥ 0,7 o `--muted`, tamaño ≥ 12 px y sentence case.

**F-11 · El README de perfil de GitHub contradice el sitio**

- Severidad: P1. Estado: V. Esfuerzo: S. (R-06)
- **Dónde:** github.com/ernesto2604 (README de perfil).
- **Evidencia:**
  - Dice "Claude 3 Haiku" y el sitio dice "Claude Haiku 4.5".
  - Describe WakeMap como "FastAPI, containerized PostgreSQL with JWT", pero el repo es `backend/src/server.js` (Node/Express), como dice el sitio.
  - Adjetivos del tipo "Enterprise" y "production-grade", y emojis.
- **Por qué importa:** el ingeniero salta del sitio a GitHub y encuentra dos versiones de los hechos.
- **Arreglo:** reescribir el README de perfil con los mismos datos del sitio, sin adjetivos y con enlace al portfolio.

**F-12 · "hybrid-rag-api" se presenta como "motor de producción" sin despliegue ni evaluación**

- Severidad: P1. Estado: V (repo) / I (impacto). Esfuerzo: M. (R-07)
- **Evidencia:** 5 commits, todos del 2026-09-24. Tests sueltos en la raíz. Un grep de `eval|recall|benchmark` no da resultados. El README dice "Motor de producción".
- **Por qué importa:** "production" sin despliegue ni métricas es lo primero que se desmonta en una entrevista ("¿cómo sabes que RRF mejora a la suma ponderada?").
- **Arreglo:** quitar "producción". Añadir una mini evaluación (recall@k de RRF frente a suma ponderada sobre unas 20 preguntas) y su tabla en el README y en el caso.

**F-13 · Sobreventa del rol FDE**

- Severidad: P1. Estado: V (texto) / I (lectura). Esfuerzo: S. (R-09, R-10)
- **Dónde:** `kb.json:43`: "Ernesto Contreras **is** an AI Engineer and Forward Deployed Engineer…". Es la misma línea que en el JSON-LD (`jobTitle`).
- **Por qué importa:** no ha tenido un rol FDE. Para FDE el criterio central es el trabajo con cliente, y no hay ninguna evidencia de ello en el sitio.
- **Arreglo:** "is looking for AI Engineer and Forward Deployed Engineer roles". Añadir una pieza de evidencia FDE: un trabajo con stakeholder real, un despliegue para un brief de cliente o el resultado de la hackathon.

**F-30 · Afirmaciones técnicas que el código contradice**

- Severidad: P1. Estado: V. Esfuerzo: S (copy) / M (código). (C-03)
- **Dónde:** casos `cases.hybrid.*` en EN/ES, `diagramDesc`, `kb.json` (rag) y `projects.json`.
- **Evidencia** (verificada en el clon del repo):
  - "runs dense and lexical search **concurrently / in parallel**": `hybrid-rag-api/src/services/vector_store.py:103-108` hace dos `await` secuenciales.
  - "batches, with **exponential backoff** on rate limits": `src/services/embeddings.py:79-97` usa `asyncio.sleep(0.5)` fijo y no tiene reintentos.
  - `pytest` en el stack: los `test_*.py` son scripts con `print`, sin asserts, y pytest no está en requirements.
  - `llms.txt` dice "Every project fact on it comes from the linked repositories", lo que es falso por las tres anteriores.
- **Por qué importa:** son detalles que un entrevistador comprueba abriendo un archivo, y cada uno resta credibilidad a lo que sí es cierto.
- **Arreglo:** borrar esas tres afirmaciones, o implementarlas de verdad (`asyncio.gather` con dos sesiones, reintentos ante 429, tests reales con pytest).

**F-31 · Sobreventa en meta, llms y KB**

- Severidad: P1. Estado: I (desde el código). Esfuerzo: S. (C-04)
- **Evidencia:**
  - "agents on Amazon Bedrock" (plural) y "Agentic workflows". Ring hace una sola llamada `invoke_model` más un reintento (`concierge.py:732`), sin tool-use ni bucle de agente: grep de `converse` y `toolConfig` vacío.
  - "end to end" aparece en 4 ficheros, y ningún repo está desplegado ni tiene CI de despliegue.
- **Arreglo:** "a diagnostic pipeline on Amazon Bedrock (Claude Haiku 4.5) and a hybrid RAG engine built without frameworks".

**F-32 · Lo más convincente no se ve**

- Severidad: P1. Estado: V. Esfuerzo: S. (C-05)
- **Evidencia:**
  - `projects.*.fact` (por ejemplo "869 pytest + 195 Node tests" de Ring) no lo renderiza ningún componente (grep vacío). Solo sale si se pregunta al agente.
  - No hay demo de Ring (`links.video: ""`), resultado del hackathon ni papel personal (solo o en equipo).
- **Arreglo:** mostrar `fact` en cada tarjeta y añadir autoría ("Solo project"), pero solo si lo confirmas (§9).

**F-33 · Datos básicos de formación y nivel ausentes o sin confirmar**

- Severidad: P1. Estado: V. Esfuerzo: S (requiere que respondas). (C-07, C-08)
- **Evidencia:**
  - No consta la materia ni el año del BSc, ni el centro ni el año del DAM, ni un nivel de inglés.
  - La única métrica de impacto, "data retrieval from days to near-instant" (CEU), aparece como "pending" en `PROGRESS.md`.
  - "available now" tiene registros contradictorios en la spec y en PROGRESS.
- **Arreglo:** confirmar o eliminar. "BSc (Hons) <materia>, First Class, <año>".

**F-34 · Contacto frágil**

- Severidad: P1. Estado: V. Esfuerzo: S. (C-10)
- **Evidencia:**
  - La sección de contacto no muestra el email en texto (solo dentro de la ProfileCard, en el menú y en el pie), aunque la KB dice "Email is fastest".
  - El formulario depende de formsubmit.co, que devolvió **522** en dos intentos (5-nov, ~20:15; puede ser temporal).
  - El campo para responder es "(optional)", así que pueden llegar mensajes sin forma de contestar.
- **Arreglo:** email visible y copiable, campo de respuesta obligatorio y validado, y el email junto al mensaje de error.

**F-35 · Repos enlazados con mala presentación**

- Severidad: P1. Estado: V. Esfuerzo: M. (C-06)
- **Evidencia:**
  - El README de WakeMap empieza con la plantilla de Flutter ("A new Flutter project."). Tiene ficheros sueltos (`taskkill`, `Microsoft/…/ModuleAnalysisCache`), fuentes SF Pro de Apple dentro del repo (problema de licencia) y un commit con autor "Codex".
  - hybrid-rag-api se presenta como "Production-ready" y "Enterprise" (ver F-12).
- **Arreglo:** limpiar WakeMap o bajarlo a "Also built" hasta que esté limpio.

### P2

**F-36 · Cadencia de eslogan en el copy (lo que suena a IA)**

- Severidad: P2. Estado: V. Esfuerzo: M. (C-12)
- **Citas:**
  - Estructura "not X, Y": "Not here to follow. Here to build." / "No vengo a seguir. Vengo a construir.".
  - Fórmulas "X, not Y" o "X rather than Y": "Structured retrieval, not embeddings", "Refuse rather than invent", "Measure first, reason second".
  - Tres decisiones aforísticas por caso, sin explicación visible: "The key stays on the server", "Useful without the model", "Pay for reasoning only when needed".
  - Títulos que no dicen nada: "Three systems, from the inside", "The answer, in short" (seguido de 103 palabras).
  - Guiños: "status 200 · 4 stages · the agent sends 0 network requests".
  - Contradicción: "the tests that say what still breaks", cuando hybrid-rag-api no tiene tests.
  - No hay rayas largas.
- **Arreglo:** frases declarativas con un dato cada una. Por ejemplo, "Severity comes from OpenCV thresholds; Claude only explains anomalies."

**F-37 · La metáfora del pipeline está a medias**

- Severidad: P2. Estado: V/I. Esfuerzo: S. (C-13)
- **Evidencia:**
  - Las claves `stages.*` (Input/Retrieval/Generate/Output) ya no se renderizan.
  - La numeración del menú (01 Home, 02 Work, 03 About, 04 Contact) no coincide con la de las secciones (03 = casos, 04 = About).
  - El README ES habla de 5 etapas. Hay claves `rerank.*` y `retrieval.stars/updated/language` que nadie usa.
  - "Incoming query", "Query expanded to" y "Five repositories retrieved" son ruido para quien no es técnico.
- **Arreglo:** etiquetas planas (Projects / Case studies / About / Contact) con la metáfora como capa secundaria, una sola numeración (o ninguna) y borrar las claves muertas.

**F-38 · Llamar "agent" a un bot con guion**

- Severidad: P2. Estado: V. Esfuerzo: S. (C-14)
- **Por qué importa:** en el CTA principal de un AI Engineer, "Ask my hologram"/"agent" promete un LLM. La explicación "No LLM" está bien, pero llega tarde, y F-01 lo agrava.
- **Arreglo:** "Ask the site" o similar. Otra opción es conectar un LLM real, pero choca con la restricción de coste cero.

**F-39 · Meta description ES demasiado larga**

- Severidad: P2. Estado: V. Esfuerzo: S. (C-15)
- **Evidencia:** unos 178 caracteres en ES (se truncará en Google). og:title anuncia FDE, pero la imagen OG solo dice "AI Engineer".
- **Arreglo:** dejarla en 155 caracteres o menos.

**F-14 · La lista de retrieval muestra scores incoherentes**

- Severidad: P2. Estado: V. Esfuerzo: S. (R-11)
- **Dónde:** stage Retrieval.
- **Evidencia:** 0.448 (Hybrid RAG) aparece encima de 0.484 (WakeMap), y Ring tiene 1.000 (`recruiter/persona-local4180-retrieval-1.png`).
- **Por qué importa:** si la "relevancia" no ordena, parece decorativa, y es el corazón de la metáfora.
- **Arreglo:** ordenar por score o explicar el orden (por ejemplo, rerank posterior visible).

**F-15 · Experiencia de un solo ítem y un hueco sin explicar**

- Severidad: P2. Estado: V (contenido) / I (lectura). Esfuerzo: S. (R-08)
- **Evidencia:** una sola prácticas (CEU, feb–jun 2025) y nada después.
- **Por qué importa:** el hiring manager pregunta "¿qué ha hecho en los 16 meses siguientes?".
- **Arreglo:** entradas fechadas con proyectos y hackathon (con resultado), o una línea honesta sobre ese periodo. **Necesito que lo confirmes** (§9).

**F-16 · Diagrama ilegible a 390 px**

- Severidad: P2. Estado: V. Esfuerzo: M. (D-07)
- **Evidencia:** SVG de 560 px en unos 310 px, con scroll horizontal interno y texto efectivo de unos 10,5 px. El botón "Back" sticky tapa "Architecture" (`design/case-en-390*.png`).
- **Arreglo:** "View as list" por defecto en móvil, o un layout vertical del SVG. "Back" con fondo propio.

**F-17 · Copy que no depende del dispositivo**

- Severidad: P2. Estado: V. Esfuerzo: S. (D-09, R-13)
- **Evidencia:**
  - "[CTRL + K]" aparece en móvil y en táctil (`design/home-en-390.png`).
  - "Desliza para explorar" aparece en escritorio (`design/sheet-es-folds.png`).
  - La pregunta que se escribe sola se captura a medias ("WHAT HAS▌") y es la única pista de que el agente existe.
- **Arreglo:** textos condicionados a `pointer: coarse`. Botón estático "Ask" junto al texto animado.

**F-18 · Desbordes en ES**

- Severidad: P2. Estado: V. Esfuerzo: S. (D-08)
- **Evidencia:**
  - Chip "[TAB]" cortado en "[" en el agente a 390 (`design/home-es-390-agent-answer.png`).
  - Placeholder cortado "…reply to you (optional".
  - Texto a 6 px del borde a 768 (inspector).
- **Arreglo:** ocultar el chip a ≤480 px, acortar el placeholder y revisar el padding a 768.

**F-19 · Densidad mal repartida**

- Severidad: P2. Estado: V. Esfuerzo: S. (D-10)
- **Evidencia:**
  - Output: 221 palabras EN / 253 ES en una columna gris.
  - Los resúmenes de proyecto se repiten literales en Retrieval y en el caso.
  - Viñetas de experiencia a 23–29 caracteres por línea a 1366 (columna de 273 px).
  - Unos 30 iconos de stack visibles.
- **Arreglo:** about en 2 frases, no duplicar resúmenes, columna de experiencia más ancha, stack agrupado (4 grupos, ≤6 por grupo). *(Recuentos por sección en §4.)*

**F-20 · Áreas táctiles pequeñas**

- Severidad: P2. Estado: V. Esfuerzo: S. (D-06, A-07)
- **Evidencia:** "Back to the top" 139×16 px (por debajo de los 24 px de WCAG 2.5.8), enlaces del pie de 24 px, "Read the case studies" de 26 px, títulos de proyecto de 28 px (`design/states-measure.json`).
- **Arreglo:** `min-h-11` (44 px) en los enlaces táctiles.

**F-21 · reduced-transparency incompleto**

- Severidad: P2. Estado: V. Esfuerzo: S. (A-08)
- **Evidencia:** con `prefers-reduced-transparency: reduce` emulado por CDP, `.masthead-blur` (3 capas) y la ProfileCard (`blur(20px) saturate(1.6)`) mantienen `backdrop-filter`.
- **Arreglo:** añadir esos selectores al `@media` que ya existe en `global.css`.

**F-22 · Foto blanda y sin `srcset`**

- Severidad: P2. Estado: V. Esfuerzo: S. (A-06, D-11)
- **Evidencia:** se sirve solo `ernesto-640.webp` (640×621), recortada a 320×416, con lazy. AVIF y 400/960 existen en `dist/photo` y no se usan. En móvil la foto real aparece en la pantalla 9 de 13.
- **Arreglo:** `<picture>` con AVIF + `srcset`/`sizes`. Valorar la foto junto al nombre en el hero móvil.

**F-23 · `<title>` sin rol**

- Severidad: P2. Estado: V. Esfuerzo: S. (A-09)
- **Evidencia:** `<title>Ernesto Contreras</title>`. Es el texto de la pestaña y del resultado de Google.
- **Arreglo:** "Ernesto Contreras · AI Engineer" y su equivalente en ES.

**F-24 · El loader se repite en cada recarga**

- Severidad: P2. Estado: V. Esfuerzo: S. (D-13)
- **Evidencia:**
  - 10 palabras × 190 ms + 560 ms de fundido. Medido: 1 988–2 076 ms.
  - `public/boot.js` lo repite una vez por sesión **y en cada F5**.
  - Se puede saltar con clic o tecla, y no aparece con reduced-motion. Bien.
  - Nota: la otra sesión estaba alargando el fundido (de 3 s a 4,5 s) en cambios sin commitear.
- **Arreglo:** no repetirlo en recargas (`sessionStorage`) y dejarlo por debajo de 1 s.

**F-25 · Subdominio con dígitos invertidos respecto al usuario de GitHub**

- Severidad: P2. Estado: V. Esfuerzo: S. (A-12)
- **Evidencia:** `ernesto2406.pages.dev` frente a `github.com/ernesto2604`.
- **Por qué importa:** quien lo teclee de memoria (desde el CV o una entrevista) cae en el sitio equivocado.
- **Arreglo:** renombrar el proyecto de Cloudflare a `ernesto2604` y actualizar `siteUrl`, canonical, sitemap y OG. **Pregunta abierta** (§9): ¿fue intencionado?

### P3

**F-26 · 12 tamaños tipográficos**

- Severidad: P3. Estado: V. Esfuerzo: M. (D-12)
- Arreglo: reducir a unos 5.

**F-27 · Sin skip link ni landmark banner**

- Severidad: P3. Estado: V. Esfuerzo: S. (A-10)
- Detalle: el masthead entero está `aria-hidden`. Solo hay 2 paradas de Tab antes del contenido.

**F-28 · Detalles de semántica**

- Severidad: P3. Estado: V. Esfuerzo: S. (A-11)
- Detalles:
  - h3 "status 200 · …" usado como nombre de una nav de un solo enlace.
  - Nombre redundante en el botón del holograma ("3D hologram of Ernesto Ask my hologram"). Quitar `role=img` del canvas.
  - 13 botones muertos sin JS (chips, carpetas, Send).

**F-29 · JSON-LD sin `image`; OG idéntico en EN y ES**

- Severidad: P3. Estado: V. Esfuerzo: S.
- Detalle: md5 igual en las dos imágenes OG. Aceptable porque la imagen no tiene texto que dependa del idioma. *(Ver la descripción de la imagen en §4.)*

---

## 4. Contenido: fact-check, densidad y paridad

### 4.1 Tabla de verificación de afirmaciones

- Copy de `a268bcb` (`en.json`, `es.json`, `kb.json`, `projects.json`, `profile.json`, `llms.txt` y head prerenderizado).
- Repos clonados en solo lectura en el scratchpad.
- Estados posibles: verificado, sin verificar, contradicho, exagerado.

| # | Afirmación | Dónde | Fuente | Estado | Nota |
|---|---|---|---|---|---|
| 1 | "builds AI systems end to end" / "de principio a fin" | meta.description, about, kb who, llms.txt | — | **exagerado** | Ningún repo está desplegado ni tiene CI de despliegue. |
| 2 | "hybrid RAG" | meta, stack, projects | `hybrid-rag-api/src/services/vector_store.py` (`search_hybrid`) | verificado | RRF manual sobre pgvector y GIN. |
| 3 | "agents on Amazon Bedrock" (plural) | meta EN/ES, kb who, llms.txt | `ring-telemetryops/src/agent/concierge.py:732` (`invoke_model`) | **exagerado** | Es un solo proyecto, con una llamada y un reintento. No hay tool-use ni bucle de agente. |
| 4 | "Agentic workflows" / "Flujos agénticos" | stack | ídem | **exagerado** | Pipeline determinista con un único LLM. |
| 5 | "Based in Madrid" | meta, about, JSON-LD, kb | spec 2026-10-23 §1 | verificado (por el dueño) | El README del perfil de GitHub dice "Based in Spain & UK". |
| 6 | "available now" / "incorporación inmediata" | meta, about, contact.status, kb | spec §1 frente a spec l.356 y PROGRESS ("not confirmed… review those") | **registros contradictorios** | Pregunta abierta. |
| 7 | "open to relocation or hybrid" | about, kb | spec §1 | verificado (por el dueño) | |
| 8 | First Class BSc (Hons), York St John | about, education, kb | README del perfil | sin verificar (lo afirma el dueño) | No consta la materia del grado. |
| 9 | Técnico Superior DAM, "Spain" | education | README del perfil | sin verificar | Sin centro ni fechas. |
| 10 | Prácticas CEU feb–jun 2025: tutor con IA, Snowflake + OpenAI en Azure | experience, kb | README del perfil | sin verificar | |
| 11 | "data retrieval from days to near-instant" | experience.points[1], kb | PROGRESS: "Confirmation of the CEU claim… pending" | **sin verificar** | Es la única métrica de impacto del sitio. |
| 12 | "structured XML prompting… more deterministic" | experience | README del perfil | sin verificar | |
| 13 | Ring creado para el Amazon Developer Hackathon 2026 | projects, kb, llms | ring README l.10 | verificado | No se conoce el resultado. |
| 14 | OpenCV mide frame rate, bitrate, brillo, nitidez y bandas | cases | `analyzer.py` l.6-7, 58 | verificado | |
| 15 | Pre-check determinista que fija la gravedad; umbrales en un único JSON | projects, cases | `src/config/severity_thresholds.json` | verificado | |
| 16 | Si todo es normal, no se llama al modelo | cases | README l.74 | verificado | |
| 17 | 15 procedimientos de KB ordenados | cases, kb | 15 IDs `KB-RING-*` | verificado | El propio README los marca como "unverified" (l.170). |
| 18 | Claude Haiku 4.5 en Bedrock | todo el sitio | README l.17, `BEDROCK_MODEL_ID` | verificado | El README del perfil dice "Claude 3 Haiku" (F-11). |
| 19 | Contrato de informe con un reintento correctivo | cases | `concierge.py:812-843` | verificado | |
| 20 | Fallback local con el mismo esquema | projects, cases | `concierge.py:854` | verificado | |
| 21 | "869 pytest + 195 Node tests" | projects.ring.fact, kb | README l.409 | verificado según el README | No se ejecutaron. Hay 509 `def test_` y 106 parametrize, así que es plausible. **No se muestra en la UI.** |
| 22 | "Digital Twin" | cases | README l.1, 67 | verificado | |
| 23 | RAG desde cero, sin LangChain ni LlamaIndex | projects, cases, kb, llms | requirements y código | verificado | |
| 24 | pgvector HNSW + GIN tsvector, PostgreSQL 16 | ídem | init_db, `models.py:32`, docker-compose | verificado | La FTS está fijada a `'spanish'`. |
| 25 | RRF con k = 60 | ídem | `vector_store.py:97` | verificado | |
| 26 | Búsqueda densa y léxica "concurrently / in parallel" | cases.hybrid.steps[3], diagramDesc, kb | `vector_store.py:103-108` (dos `await` secuenciales) | **contradicho** | Verificado por el lead. |
| 27 | "exponential backoff on rate limits" | cases.hybrid.steps[1] | `embeddings.py:79-97` (`sleep(0.5)` fijo) | **contradicho** | Verificado por el lead. |
| 28 | Gemini a temperatura 0, con historial | cases | `rag_generator.py:88, 108` | verificado | El historial se recorta a 6 turnos. |
| 29 | Cita obligatoria de documento y página; "Refuse rather than invent" | projects, cases | `rag_generator.py:69-83` | verificado (en el prompt) | La cita no se valida después. |
| 30 | Chunks solapados | cases | `chunking.py`, overlap = 150 | verificado | |
| 31 | `pytest` en el stack de hybrid-rag-api | projects.json | scripts sin asserts; pytest no está en requirements | **contradicho** | |
| 32 | HNSW elegido frente a IVFFlat | cases.decisions | README l.117 | verificado | |
| 33 | Vídeo demo del RAG | projects.links.video | user-attachments, responde 200 | verificado | |
| 34 | WakeMap es un prototipo "from my dissertation" | projects, cases, kb | ningún README lo menciona | sin verificar | |
| 35 | Geofencing de 100 a 1 000 m | cases, kb | `create_alarm_screen.dart:75` `clamp(100,1000)` | verificado | |
| 36 | Voz "transcribed on the device" | cases.wakemap.steps[2] | `speech_to_text` sin `onDevice` | **dudoso (I)** | El reconocedor del sistema operativo puede enviar el audio a la nube. |
| 37 | Proxy Node/Express que guarda la clave de Gemini; salida JSON estructurada | projects, cases | `backend/src/server.js:220-246` | verificado | |
| 38 | Nominatim, OSRM y teselas OSM | cases | `places_service.dart`, `route_service.dart` | verificado | |
| 39 | "Android and iOS builds" | projects.wakemap.fact | carpetas `android/` e `ios/`, `ios-build.yml` | verificado en parte | Solo hay CI para iOS. |
| 40 | "Useful without the model" | cases.decisions | — | sin verificar | |
| 41 | Surveillance: Arduino → Pi → YOLOv8 → Telegram → Flask | projects, kb | README del repo l.3-22 | verificado | Token en el historial (F-00). |
| 42 | Secure Auth Go: bcrypt, sesiones en servidor, CSRF, CSP, roles, límite de intentos, net/http | projects, kb | `auth.go:16-30`, `main.go:74-86` | verificado | Sin tests. |
| 43 | "hosted on GitHub Pages" | footer.built EN/ES, kb site | el canónico es Cloudflare Pages | **contradicho** | F-06. |
| 44 | "No cookies, no trackers" | footer.built | beacon de Cloudflare en live | **contradicho en live** | F-06. |
| 45 | "No backend" / "nothing is sent anywhere" | kb site / kb agent | POST a formsubmit.co | **matizable** | Es cierto para el agente, no para el sitio. |
| 46 | "the agent sends 0 network requests" | footer.status | red local: 0 peticiones a terceros | verificado | |
| 47 | "Every project fact on it comes from the linked repositories" | llms.txt | filas 11, 26, 27, 31 y 34 | **contradicho** | |
| 48 | "Five repositories retrieved", BM25 real | retrieval | `src/lib/search.ts` | verificado | La consulta está fijada y el orden mostrado no coincide con los scores (F-14). |
| 49 | Datos de repos desde la API de GitHub en el build | kb site | `repos.generated.json`, fetchedAt | verificado | |
| 50 | "The CV is not published on the site" | kb cv | no existe `dist/cv`; profile.json sin `cv` | verificado | README y PROGRESS dicen lo contrario ("CV PDFs are in"). |
| 51 | "The full list is highlighted in the About section" | kb stack | el stack está en `#skills` | **inexacto** | |
| 52 | "Yes" a "deployed anything to production?" | agente (intent availability) | — | **contradicho** | F-01. |
| 53 | "is an AI Engineer and Forward Deployed Engineer" | kb.json:43, JSON-LD jobTitle | sin rol FDE previo | **exagerado** | F-13. |

### 4.2 Densidad (recuento de palabras)

**A. Texto visible en el flujo principal** (Playwright sobre `:4180`, 1440×900, líneas únicas visibles a lo largo del scroll, sin diálogos):

- **EN:** unas 620 palabras, más unas 52 de nav y pie (≈ 670).
- **ES:** unas 705 palabras, más unas 53 (≈ 760).

**B. Inventario de copy por sección**, sumado desde el JSON (EN / ES):

| Sección | EN | ES | Objetivo EN |
|---|---|---|---|
| Hero | 17 | 18 | unas 20, con rol y frase de valor |
| Retrieval (UI) | 45 | 50 | ≤ 30 |
| Tarjetas de proyecto | 206 | 244 | ≤ 110 (unas 20 por resumen; Ring tiene 47) |
| Generate (sección) | 65 | 73 | ≤ 30 |
| Diálogos de casos | 401 | 459 | unas 200 (quitar nodos duplicados en los pasos) |
| Stack | 61 | 62 | igual, agrupado |
| About/Output | 184 | 224 | ≤ 100 (los 3 párrafos de about, de 103 a ≤ 50) |
| Contact (todos los estados) | 60 | 41 | — |
| Footer | 37 | 36 | ≤ 12 (quitar "status 200…" y "Built with…") |
| Texto "how" del agente | 50 | 58 | — |
| **Total sin KB** | **1 150** | **1 292** | **unas 650; página principal visible ≤ 400** |
| Respuestas de la KB | 640 | 737 | puede quedarse; solo se lee si se pregunta |

### 4.3 Paridad EN/ES y erratas (literal, sin corregir)

**Paridad estructural**

- Claves y placeholders: paridad completa (0 claves solo EN y 0 solo ES; arrays de igual longitud).
- El ES tiene entre un 12 % y un 19 % más de palabras en todas las secciones.

**Erratas y redundancias**

- "con un BSc (Hons) con First Class Honours": dos "con" seguidos.
- La misma frase repite "(Reino Unido)… la máxima calificación en el Reino Unido".
- **El ES añade información que el EN no tiene:** "la máxima calificación en el Reino Unido" (about, kb who, kb education).

**Inglés sin traducir en ES**

- "status 200 · 4 etapas…", "Email", "Cloud y despliegue", "Mi stack".
- "fallback local", "stream", "Digital Twin", "bitrate", "geofencing", "Builds para Android e iOS", "backoff", "rankings", "Top-K".
- Algunos son tecnicismos aceptables. "Mi stack" choca con "Tecnologías" (C-16).

**Inconsistencias**

- Terminología: la meta dice "los backends que los sostienen" y la KB "los backends que los rodean".
- Calcos y registro:
  - "casos de estudio": mejor "casos prácticos".
  - "Sano: informe sin llamar al modelo": mejor "Correcto…".
  - "Soy Ernesto, ingeniero": en España sugiere una titulación de ingeniería (C-07).

**Lo que está bien**

- No faltan tildes ("solo" sin tilde es correcto según la RAE).
- Los títulos en ES no usan title case.
- El EN usa ortografía británica de forma coherente (Optimised, analysed, Traveller).

### 4.4 Enlaces

| URL | Estado |
|---|---|
| GitHub (perfil y 5 repos) | 200 |
| Vídeo del RAG | 200 |
| `ernesto2604.github.io` | 200 |
| pages.dev `/`, `/es/`, og-*.png, llms.txt, sitemap | 200 |
| pages.dev `/nope` | 404 (con noindex) |
| `github.com/ernesto2604/portfolio` | redirige (301) a `ernesto2604.github.io` |
| LinkedIn | 999 (bloqueo antibot; sin verificar) |
| formsubmit.co | **522** en dos intentos (F-34) |
| Enlace a CV | no existe ninguno (F-03) |

### 4.5 Selección de proyectos

- **Orden actual:** Ring > Hybrid RAG > WakeMap > Surveillance > Secure Auth Go. Es correcto: Ring es el más sólido (README honesto con "not re-verified" y "fixtures only", y tests).
- **Hybrid RAG:** el código es bueno, pero el repo es débil (5 commits en un día, sin tests reales, "Production-ready").
- **WakeMap:** el más arriesgado. README de plantilla, claves en el historial, ficheros sueltos y fuentes de Apple. Bajarlo a "Also built" hasta limpiarlo.
- **Surveillance:** tiene un token en el historial. Revocarlo antes de seguir enlazándolo.

---

## 5. Lo que funciona y NO hay que cambiar

- **La metáfora del pipeline.** Input → Retrieval → Rerank/Generate → Output, con scores y un agente que enseña sus tool calls (`match_intent()`, `get_profile()`). Es la idea más propia del sitio y la que recordará un ingeniero. Hay que arreglar los fallos (F-01, F-14), no quitarla.
- **Las páginas de caso abiertas.** Titular, "Source on GitHub", diagrama con alternativa textual ("View as list") y "Key decisions" con lenguaje de quien ha decidido: "The model never decides severity", "RRF instead of a weighted sum", fallback local.
- **Honestidad del agente fuera de alcance.** Responde "I can't answer that…" y la inyección de prompt no hace nada (R).
- **El holograma en tinta, como imagen.** Hay que cambiar cómo se carga (F-05), no la estética.
- **Accesibilidad de base:**
  - 0 violaciones axe en 37 estados.
  - Orden de foco igual al visual.
  - `<dialog>` modales con Esc y devolución del foco.
  - Churn animado oculto al lector de pantalla con copia sr-only.
  - `aria-live` solo con la respuesta final.
  - reduced-motion completo: sin loader, pin, Lenis ni morph, y holograma estático.
- **Sin JS el contenido es legible:** el loader está oculto y hay 25 enlaces.
- **0 peticiones a terceros** en la build local durante la carga y el uso del agente.
- **SEO técnico:** canonical, hreflang recíproco, sitemap con xhtml:link, 404 real con noindex en live y JSON-LD válido.
- **Paridad de claves EN/ES garantizada por test.**
- **Sin scroll horizontal** en 390, 768, 844, 1366, 1440 y 1920.

---

## 6. Plan de arreglos priorizado (top 10 por impacto/esfuerzo)

Cada instrucción está pensada para pegarla en una sesión nueva de Claude Code dentro de esta carpeta.

**0. Antes de nada (lo haces tú, fuera del sitio):** revocar las dos claves de Google (consola de Google Cloud) y el token de Telegram (BotFather `/revoke`). Después decidir si reescribes el historial de `lastVersionWakeMap`, `AI_surveillance_hub` y `ernesto2604.github.io` (F-00). Es irreversible y requiere force-push, así que no lo delegues sin revisarlo.

1. **Agente: matcher honesto (F-01, F-13).**
   > En `src/agent/match.ts` y `src/content/agent/kb.json`: las keywords de varias palabras (por ejemplo "forward deployed") solo deben puntuar con coincidencia de frase completa, no por tokens sueltos. Hoy "Has he deployed anything to production?" casa con `availability` (score 2.05) y responde "Yes…". Añade un intent `production` con respuestas EN/ES honestas que te dictaré (pregúntamelo antes de escribir el texto). Cambia `kb.json:43` de "is an AI Engineer and Forward Deployed Engineer" a "is looking for AI Engineer and Forward Deployed Engineer roles" (y su ES). Añade tests unitarios con preguntas trampa: production, salary, years of experience, "is he senior", "has he worked with clients". No toques otros intents. Ejecuta `npm test`.

2. **Hero: quién, qué, CTA (F-02, F-17).**
   > En el hero (`src/sections/Story.tsx`, claves `hero.*` de `en.json`/`es.json`): nombre completo y rol fijos ("Ernesto Contreras", "AI Engineer"), sin depender del morph (el morph puede quedarse solo como decoración `aria-hidden`, nunca escondiendo el rol). Recupera una frase concreta de qué construye (partir de la de la versión publicada: "I build AI systems end to end: RAG, agents and the backend that makes them reliable") y tres acciones visibles: "See the work", "CV", "Contact". El eslogan "Not here to follow. Here to build." se quita. "[CTRL + K]" solo con `(pointer: fine)`. Verifica a 390 y 1366, EN y ES, también con prefers-reduced-motion, y adjunta capturas.

3. **CV descargable (F-03).** *(Requiere que aportes los PDFs.)*
   > He dejado `public/cv/ernesto-contreras-cv-en.pdf` y `…-es.pdf`. Añade `"cv"` a `src/content/profile.json` según el README, y enlaza el CV del idioma correcto en el hero, el menú y el bloque de contacto (`/` → EN, `/es/` → ES). Añade un test e2e que compruebe que cada idioma enlaza su PDF y que devuelve 200.

4. **Afirmaciones verdaderas: pie, casos, meta y contraste (F-06, F-30, F-31, F-10, F-28).**
   > Corrige el copy para que coincida con el código (sin tocar los repos): en `cases.hybrid.*` (EN/ES), `diagramDesc` y `kb.json` elimina "concurrently/in parallel" (las búsquedas son secuenciales en `vector_store.py:103-108`) y "exponential backoff" (es un `sleep(0.5)` fijo); quita `pytest` del stack de hybrid-rag-api en `projects.json`; en `meta.description`, `kb.json` (who) y `public/llms.txt` cambia "agents on Amazon Bedrock" por "a diagnostic pipeline on Amazon Bedrock (Claude Haiku 4.5)", "Agentic workflows" por algo verificable, y retira "Every project fact on it comes from the linked repositories" o hazlo cierto. En `footer.*` de `en.json`/`es.json` y `kb.json:512`: sustituye "hosted on GitHub Pages. No cookies, no trackers" por un texto verdadero: el sitio se sirve desde Cloudflare Pages (espejo en GitHub Pages) y el formulario usa FormSubmit (formsubmit.co); menciona Cloudflare Web Analytics solo si te confirmo que sigue activo. Elimina el h3 "status 200 · 4 stages…". En `HalftoneWordmarkFooter.tsx` sube las opacidades de texto a ≥0,7 (o usa `--muted`), el tamaño mínimo a 12 px y pasa los encabezados a sentence case. Mide el contraste resultante (≥4,5:1) y adjunta la captura.

5. **Rendimiento: GLB solo bajo demanda (F-05).**
   > En `src/components/Hologram.tsx` y el loader del modelo: cuando `lite` sea true (móvil, `pointer: coarse` o ≤4 núcleos), no descargues `/models/ernesto.glb` al cargar. Muestra un póster estático (genera un PNG/AVIF del holograma en tinta) y carga el modelo solo tras tocarlo o pasar el ratón. En escritorio, diferir la descarga con `requestIdleCallback`. Después, saca una traza de Performance para identificar el long task de unos 1 s que aparece hacia los 3,7 s (sospechosos: pin de GSAP, halftone del pie) y difiere lo que no sea visible. Ejecuta Lighthouse móvil 3 veces por idioma sobre `npm run preview` y reporta el rango. Objetivo: ≥90.

6. **Casos visibles sin carpetas (F-07, F-19).**
   > En `#generate` sustituye FolderFloat por una lista de los 3 casos, cada uno con titular, una línea de resultado, el diagrama y 3 decisiones clave visibles, y "Read more" para abrir el detalle actual. No dupliques los resúmenes que ya salen en Retrieval. Renderiza `projects.*.fact` (por ejemplo, el número de tests de Ring) en cada tarjeta; hoy ningún componente lo usa. Mantén "View as list" del diagrama y ponlo por defecto en <480 px. Verifica a 390, 768 y 1440, EN y ES.

7. **Foco visible (F-09).**
   > Añade `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px }` al botón "Send message"/"Enviar mensaje" (`src/sections/Output.tsx` o `ProfileCard`/`StarBorder`). En `.menu-dialog` usa un outline claro con ≥3:1 sobre #17191E. Recorre la página con Tab y adjunta capturas del foco en esos dos sitios.

8. **Quitar tics de plantilla (F-08).**
   > Quita del sitio: los superíndices 01–04 del menú (`Nav.tsx`), los numerales fantasma "03"/"04", los corchetes de las etiquetas mono ("[SCROLL TO EXPLORE]" → "Scroll"), el scramble del reloj del masthead (reloj estático o fuera) y ProfileCard + StarBorder en contacto (sustitúyelo por una lista sobria: email, LinkedIn, GitHub, CV, más el formulario). Borra `FoldText.tsx`, que no se usa. Sin cambiar textos fuera de esos elementos. Capturas antes y después a 390 y 1440.

9. **Retrieval coherente + `<title>` + foto (F-14, F-23, F-22).**
   > Ordena la lista de Retrieval por score descendente (o muestra el paso de rerank que justifica el orden). Cambia `<title>` a "Ernesto Contreras · AI Engineer" (ES: "Ernesto Contreras · AI Engineer", y si prefieres traducirlo, pregúntamelo). Sirve la foto con `<picture>` (AVIF + WebP, `srcset` 400/640/960 y `sizes` correcto). Actualiza los tests de SEO.

10. **Pulido móvil y ES (F-16, F-18, F-20, F-21, F-24).**
    > Arregla: el chip "[TAB]" cortado en el agente a ≤480 px (ocúltalo), el placeholder "…reply to you (optional" cortado, el padding de ES a 768, las áreas táctiles por debajo de 44 px ("Back to the top", enlaces del pie, títulos de proyecto), el `backdrop-filter` de `.masthead-blur` y de ProfileCard dentro de `prefers-reduced-transparency: reduce`, y que el loader no se repita al recargar en la misma sesión ni dure más de 1 s. Ejecuta `npm test` y `npm run test:e2e` tras `npm run build`.

**Fuera del sitio:**

- Reescribir el README de perfil de GitHub con los mismos datos que el sitio (F-11).
- Quitar "producción" de hybrid-rag-api y añadirle una mini evaluación (F-12).
- Desactivar Web Analytics en Cloudflare si no lo usas (F-06).
- Desplegar **después** de los puntos 1–4 (F-04).

---

## 7. Lo que no pude verificar

- **Dispositivos y navegadores:** móviles reales, Safari/iOS (WebGL, `backdrop-filter`, `<dialog>`) y Firefox.
- **Lectores de pantalla reales** (NVDA, VoiceOver): solo se inspeccionó el árbol ARIA.
- **Red y rendimiento:** redes lentas reales y el coste de GPU en gama baja. Los tiempos de los agentes no son fiables porque compartían máquina; las cifras de rendimiento son solo las de Lighthouse.
- **Zoom de texto al 200 %.**
- **Long task:** su causa exacta, sin una traza de DevTools.
- **Formulario:** el envío real y sus estados de error. No se envió nada.
- **LinkedIn:** el perfil (requiere login) y el estado del enlace (devuelve 999 a curl, que es un bloqueo antibot).
- **Tests de los repos:** si pasan. No se ejecutaron. Ring dice "869 pytest" y se cuentan 509 `def test_`; la diferencia puede venir de parametrize.
- **El resultado de la hackathon.**
- **Scroll pinned a 1440:** con Playwright las capturas salen desordenadas (I: Lenis frente a `scrollTo`). No se puede afirmar que sea un fallo.
- **404 local:** `vite preview` devuelve 200 para rutas inexistentes. En live la 404 es real.

---

## 8. Live vs local: diferencias

Las secciones son las mismas. Los textos de casos, stack, about, experiencia y contacto no cambian.

| Elemento | Live (pages.dev, ~2026-10-28) | Local (`a268bcb`) |
|---|---|---|
| Fondo | Gradiente gris-azulado con halo ámbar | Papel cálido con guías de columna discontinuas |
| Masthead | No hay | Reloj "MADRID 19:16 CET" con scramble |
| Título del hero | "AI Engineer" fijo + "Hi, I'm Ernesto. I build AI systems end to end…" | Morph "I'm Ernesto" ↔ "AI Engineer"; nunca juntos |
| Subtítulo | Frase de valor | "NOT HERE TO FOLLOW. HERE TO BUILD." |
| CTAs | "See the work" y "Ask the agent Ctrl K" | No hay; texto mono que se escribe solo y "[SCROLL TO EXPLORE]" |
| Holograma | Verde neón en panel oscuro, "ernesto.glb · live render" | Tinta gris sin panel |
| Interstitials | "Thinking… / Reading the query…" antes del hero y entre secciones | Eliminados |
| Agente | Modal clásico | Orbe que se estira hasta una barra mono, con [TAB]/[ESC] |
| Footer | Línea simple y wordmark marrón | 4 columnas mono en mayúsculas, wordmark halftone y enlace EMAIL |
| Terceros | Beacon de Cloudflare Analytics | Ninguno (salvo FormSubmit al enviar el formulario) |
| Perf móvil | 43–69 | 64–69 |

Capturas: `recruiter/live-*` frente a `recruiter/local-*`, y `recruiter/timeline-*`.

---

## 9. Preguntas que solo tú puedes responder

1. **Seguridad:** ¿están revocadas ya las dos claves de Google (WakeMap) y el token de Telegram (Surveillance)? ¿Quieres reescribir el historial de esos repos y del repo del sitio (teléfono)?
2. ¿Tienes los PDFs del CV en EN y ES para enlazarlos?
3. ¿Sigue siendo cierta hoy la "incorporación inmediata"?
4. ¿Cuál es la materia del BSc y el año de graduación? ¿Y el centro y el año del DAM? ¿Qué nivel de inglés pones?
5. Sobre la métrica del CEU ("de días a casi instantáneo"): ¿qué consulta era, cuánto tardaba antes y cuánto después? Si no se puede concretar, se quita.
6. ¿Qué resultado tuviste en el hackathon? ¿Ring lo hiciste en solitario?
7. ¿WakeMap es tu TFG? ¿Cuál es el repo bueno, `lastVersionWakeMap` o `wakeMap_submission`?
8. ¿Qué has hecho desde junio de 2025? ¿Hay algo fechable que añadir a Experience?
9. ¿Has desplegado algo con usuarios reales? Lo necesito para la respuesta honesta del intent `production`.
10. ¿Tienes alguna experiencia de cara a cliente o stakeholder (para FDE) que no esté en el sitio?
11. ¿Tienes Cloudflare Web Analytics activado a propósito?
12. ¿El subdominio `ernesto2406` frente al usuario `ernesto2604` es intencionado?
13. ¿El canal principal de contacto es el email o el formulario?
14. ¿Prefieres el título en ES como "AI Engineer" o traducido?
