# GymTrack — guía para Claude Code

Este archivo es la referencia que debe leer un agente de IA (Claude Code) antes de tocar este repo, para mantenerlo consistente entre sesiones aunque el proyecto sea chico.

## Propósito del proyecto

GymTrack es una PWA personal para trackear progreso en el gimnasio mediante códigos QR por máquina.

Flujo central: el usuario escanea el QR pegado en una máquina → la app identifica la máquina → muestra el último registro (peso/reps/series) del usuario en esa máquina → el usuario guarda un nuevo registro.

Es un side project con dos objetivos explícitos, ambos igual de importantes al tomar decisiones:
1. Practicar el flujo completo de construir una app con ayuda de IA.
2. Servir de terreno de prueba para principios de arquitectura que permitan a un agente de IA mantener el proyecto de forma consistente a largo plazo, **incluso siendo un proyecto pequeño**.

Esto último significa: preferir claridad y límites explícitos sobre "menos archivos", porque el costo que se está optimizando no es la cantidad de líneas sino la facilidad de que un agente sin memoria de sesiones anteriores entienda dónde va cada cosa.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4 (integrado vía `@tailwindcss/vite`, **sin** `tailwind.config.js` — la v4 configura todo por CSS con `@import "tailwindcss"` en `src/index.css`)
- Supabase (auth + Postgres) vía `@supabase/supabase-js`
- react-router-dom

## Principio de separación de capas

El proyecto sigue tres capas estrictas, cada una con una carpeta dedicada:

```
UI (pages/, components/)
   ↓ usa
Lógica de negocio (hooks/)
   ↓ usa
Acceso a datos (lib/services/, lib/supabaseClient.ts)
```

1. **UI (`src/pages/`, `src/components/`)** — Solo renderizado y eventos de usuario. No llaman a Supabase directamente. No contienen reglas de negocio (ej. "no se puede loggear un peso negativo"). Reciben datos y callbacks vía props o hooks.
   - `pages/` = una página por ruta, es el punto de entrada de cada pantalla.
   - `components/` = piezas de UI reutilizables entre páginas (botones, cards, inputs específicos del dominio como `MachineCard`).

2. **Lógica de negocio (`src/hooks/`)** — Hooks custom (`useMachineLogs`, `useLastEntry`, etc.) que orquestan llamadas a `lib/services/`, manejan estado local (loading/error/data) y aplican reglas de negocio. Es la capa intermedia: no sabe cómo se renderiza nada, no sabe cómo se hace una query SQL.

3. **Acceso a datos (`src/lib/services/`, `src/lib/supabaseClient.ts`)** — Funciones puras que reciben parámetros y devuelven datos tipados desde Supabase (ej. `getLastLogEntry(machineId, userId)`). No conocen React, no conocen hooks ni componentes. Un archivo de servicio por entidad (`machines.ts`, `logEntries.ts`, `profiles.ts`).

`src/types/` es transversal: tipos de dominio (`Machine`, `LogEntry`, `Profile`) usados por las tres capas. `src/router/` solo define el mapeo ruta → página.

### Por qué esta separación (para un agente de IA)

- **Cambios localizados y predecibles.** Si hay que cambiar una query a Supabase, el cambio vive en `lib/services/`, nunca dentro de un componente. Si hay que cambiar cómo se ve una pantalla, el cambio vive en `pages/` o `components/`, sin tocar lógica de datos. Esto reduce el "blast radius" de cada edición: un agente puede tocar una capa con alta confianza de no romper las otras.
- **Contexto acotado por tarea.** Cuando la tarea es "agregar un campo a `LogEntry`", el agente sabe que debe tocar: `types/domain.ts` → `lib/services/logEntries.ts` → el hook que lo consume → el componente que lo muestra, en ese orden y sin sorpresas en otros archivos.
- **Nombres de archivo como índice.** No hace falta leer todo el proyecto para saber dónde está algo: el nombre de la carpeta ya dice la capa, el nombre del archivo ya dice la entidad.

## Convenciones de código

- **Componentes**: `PascalCase`, un componente por archivo, nombre de archivo = nombre del componente + sufijo de rol (`LoginPage.tsx`, `MachineCard.tsx`).
- **Hooks**: `camelCase` con prefijo `use` (`useLastEntry.ts`), un hook por archivo.
- **Servicios**: `camelCase`, un archivo por entidad de dominio en `lib/services/` (`machines.ts`, no `machineService.ts` — la carpeta ya indica que es un servicio).
- **Tipos**: viven en `src/types/`, se importan siempre desde ahí (nunca redefinidos localmente en un componente o hook).
- **Exports**: named exports, no default exports (excepción: `App.tsx`, por convención de Vite/React).
- **Estilos**: solo utilidades de Tailwind en JSX. No crear archivos `.css` por componente salvo necesidad real (animaciones complejas, etc.).
- **Variables de entorno**: siempre con prefijo `VITE_`, documentadas en `.env.example`, tipadas en `src/vite-env.d.ts`.

## Reglas para mantener consistencia al crecer

- Antes de crear un componente nuevo, revisar si algo similar ya existe en `components/` para reutilizar o extender en vez de duplicar.
- Toda llamada a `supabase.from(...)` vive en `lib/services/`. Si aparece un `supabase.from` dentro de un componente o un hook, es una señal de que falta extraer un servicio.
- Toda regla de negocio (validaciones, cálculos, decisiones de flujo) vive en `hooks/`, no en componentes ni en servicios.
- Si un tipo de dominio cambia, actualizar `src/types/domain.ts` primero y dejar que TypeScript señale todos los lugares afectados.
- Mantener el README.md del proyecto (raíz) actualizado en la sección "Estado actual" a medida que se agregan features — es la fuente de verdad rápida de en qué fase está el proyecto.
- Cualquier decisión de arquitectura no trivial (por qué se eligió X en vez de Y) debe quedar registrada en este archivo, no solo en el historial de commits.

## Qué NO hacer (evitar over-engineering)

Este es un proyecto chico y personal. Los siguientes patrones son deliberadamente evitados por ahora — no agregarlos "por si acaso":

- **No** state management global (Redux, Zustand, Jotai). El estado del servidor lo maneja cada hook con `useState`/`useEffect` (o `@tanstack/react-query` si en el futuro la cantidad de fetches lo justifica, pero no antes de necesitarlo).
- **No** capa de "repository" o "abstracción de base de datos" desacoplada de Supabase. Los servicios llaman a Supabase directamente; no hay que diseñar para "poder cambiar de base de datos" hipotéticamente.
- **No** generación de código, CLIs internas, ni monorepo/workspaces. Es un único paquete en la raíz del repo.
- **No** testing exhaustivo desde el día uno. Priorizar shippear features del flujo core (QR → última marca → nuevo registro) antes que cobertura de tests.
- **No** sistema de diseño propio ni librería de componentes UI genérica. Usar utilidades de Tailwind directo; extraer un componente reutilizable solo cuando se repite 2+ veces.
- **No** crear carpetas nuevas de nivel superior sin necesidad concreta. La estructura de capas (`pages/components/hooks/lib/types/router`) ya cubre el dominio esperado; si algo no encaja, es más probable que falte pensar bien la ubicación que que falte una carpeta nueva.

Regla general: si una decisión de arquitectura solo se justifica por "esto es lo que se hace en apps grandes", no aplica acá. Se justifica por el problema concreto que resuelve en este proyecto, hoy.

## Plan de fases

Este proyecto avanza en fases secuenciales. Cada fase tiene un estado (COMPLETADA / EN CURSO / pendiente) que se actualiza a medida que se avanza.

- **Fase 0 — Setup del entorno (COMPLETADA):** proyecto Vite + React + TypeScript, Tailwind, Supabase client configurado, rutas placeholder, estructura de carpetas.
- **Fase 1 — Base de datos (COMPLETADA):** crear las tablas `machines`, `profiles`, `log_entries` en Supabase con sus columnas y relaciones, y configurar las políticas RLS para que cada usuario solo acceda a sus propios datos.
- **Fase 2 — Autenticación (COMPLETADA):** login con Google vía Supabase Auth, pantalla de onboarding que guarda datos en `profiles`.
- **Fase 3 — Escaneo y registro (COMPLETADA):** integrar lectura de QR con la cámara, mostrar el último registro de esa máquina, formulario para guardar un log nuevo.
- **Fase 4 — Progreso (COMPLETADA):** pantalla de progreso por máquina con gráfico, pantalla Home con resumen básico.
- **Fase 5 — Generación de QR físicos (COMPLETADA):** script para exportar un PNG de QR por cada máquina, para imprimir.
- **Fase 6 — Perfil extendido (COMPLETADA):** agregar peso, estatura y fecha de nacimiento al perfil del usuario — se piden al iniciar sesión si todavía no los tiene (una sola vez), y se pueden ver/editar después desde una pantalla de Perfil real, accesible desde el menú hamburguesa. Pensado para más adelante generar informes cruzando esta info con los registros de la app.
- **Fase 7 — Demo:** deploy en Vercel, prueba end-to-end antes de mostrárselo al dueño del gimnasio.
- **Fase 8 (futura, no MVP) — Offline-first:** guardado local con IndexedDB y sincronización en segundo plano cuando el usuario recupera conexión. No implementar hasta que se indique explícitamente.

**Regla importante:** en cada sesión, trabajar únicamente en la fase que el usuario indique como "actual" (ver "Estado actual" abajo). Si una tarea pedida pertenece a una fase posterior a la actual, señalarlo y preguntar si se quiere adelantar, en vez de hacerla directamente.

## Decisiones de arquitectura

- **SQL de esquema vive en `supabase/migrations/`, fuera de `src/`.** No es parte de la estructura de capas de la app (esa regla aplica a código de la UI/lógica/datos en `src/`). Es la convención estándar de Supabase para versionar el esquema, y no hay Supabase CLI instalado en este entorno — los archivos `.sql` ahí son para copiar/pegar en el SQL Editor del dashboard de Supabase, no para correr con `supabase db push`.
- **`machines` no tiene `user_id`.** Se modela como catálogo compartido de equipamiento físico del gimnasio (coherente con `src/types/domain.ts`, que no le da owner), no como dato propio de cada usuario. Si en el futuro se soporta multi-gimnasio por usuario, esta tabla necesita agregar `user_id` y políticas RLS por dueño — no implementar hasta que se pida.
- **QR con `html5-qrcode`.** Elegida sobre alternativas (`@yudiel/react-qr-scanner`, etc.) por ser la más madura/estable para lectura por cámara en mobile. Es una dependencia pesada (agrega ~250kb gzip al bundle, ver warning de `vite build`); si el tamaño del bundle se vuelve un problema, la solución es code-splitting de `ScanPage` con `React.lazy` (no implementado todavía, no hacía falta para el alcance de la Fase 3).
- **No hay UI para crear `machines` todavía.** Ninguna fase del plan la pide explícitamente. Las máquinas de prueba se cargan a mano vía `supabase/seed.sql` (INSERT directo). Si en algún momento se pide gestionar máquinas desde la app, es una decisión a tomar explícitamente (probablemente amerite su propia fase), no algo para agregar de paso.
- **El QR codifica el valor de `machines.qr_code`** (un string corto como `machine-press-banca`), no el `id` (uuid) ni una URL completa. `ScanPage` navega a `/log/:qrCode` con ese valor tal cual, y `LogPage` resuelve la máquina vía `getMachineByQrCode`. La Fase 5 (generación de QR físicos) debe imprimir un QR por cada `qr_code`, no por `id`.
- **Gráfico con `recharts`.** Elegida sobre dibujar un line chart a mano en SVG por dar ejes/tooltips/responsive sin reinventar nada — a costa de otra dependencia de tamaño moderado (el bundle ya pasó los 500kb gzip advertidos por `vite build` sumando `html5-qrcode` + `recharts`). Si el tamaño se vuelve un problema real, la solución sigue siendo code-splitting de `ScanPage`/`ProgressPage` con `React.lazy` (ninguna de las dos se cargaría en el bundle inicial), no cambiar de librería.
- **`ProgressPage` usa `/progress/:machineId`** (el `id` de la máquina), no el `qrCode` como `LogPage`. Tiene sentido porque a esta pantalla se llega navegando desde `MachineCard` en Home (que ya tiene el `machine.id` a mano, no hace falta re-resolver por QR). Por eso existe `getMachineById` en `lib/services/machines.ts` además de `getMachineByQrCode` — son dos formas de entrada distintas, no redundancia.
- **`scripts/generate-qr-codes.mjs` vive fuera de `src/`**, mismo criterio que `supabase/migrations/`: es una herramienta de build/tooling, no código de runtime de la app. Genera los PNG en `scripts/output/` (gitignorado, son artefactos). La lista de máquinas está **hardcodeada en el script**, duplicando a mano `supabase/seed.sql` — decisión consciente para no leer Supabase (necesitaría la service role key para saltar el RLS de `machines`, que exige usuario autenticado) mientras solo hay 3 máquinas de prueba. Si la cantidad real de máquinas crece, reconsiderar que el script lea de Supabase directamente.
- **El QR sigue codificando el `qr_code` pelado (no una URL) por ahora, a propósito.** Se evaluó hacer que el QR codifique una URL completa (`https://dominio/log/:qrCode`) para que la cámara nativa del celular abra la app directo en la máquina escaneada — pero eso requiere una URL de producción real (Fase 6, deploy), y el usuario decidió explícitamente no adelantar esa fase. Quedan pendientes para cuando se llegue a Fase 6, **si se retoma esta idea**: (1) cambiar el QR a codificar la URL completa y regenerar los PNG; (2) arreglar que el login con Google actualmente siempre redirige a `/home` después de autenticarse (`redirectTo: window.location.origin` en `lib/services/auth.ts`), perdiendo la máquina originalmente escaneada si el usuario no tenía sesión iniciada — hay que preservar la ruta de destino original a través del login; (3) GymTrack todavía no es instalable como PWA (sin `manifest.json` ni service worker), lo cual limita que el link "abra la app" en vez de una pestaña del navegador, especialmente en iOS — no cubierto por ninguna fase del plan actual, habría que agregarlo si se decide perseguir esto.
- **`AppShell` (`components/AppShell.tsx`) envuelve Home/Scan/Log/Progress/Profile** con un header fijo (marca "GymTrack", tap → `/home`) y un footer fijo (`position: fixed`) con "Escanear máquina" y "Cerrar sesión" siempre visibles — pedido explícito del usuario para que ninguna pantalla (en particular `ScanPage`, donde no había forma de volver) deje sin salida. Login y Onboarding quedan fuera del shell a propósito (son gates de una sola pantalla, no necesitan nav persistente). Cualquier página nueva que cuelgue de `RequireProfile` entra automáticamente al shell por estar anidada bajo esa ruta en `AppRouter.tsx` — no hace falta tocar nada más.
- **`components/ui/LinkButton.tsx`** existe porque varias páginas anidaban `<Button>` (un `<button>`) dentro de `<Link>` (un `<a>`) para navegar con el look de un botón — HTML inválido (elemento interactivo dentro de otro). `LinkButton` es un `<Link>` estilizado igual que `Button` vía la función compartida `buttonClasses` (en `ui/buttonStyles.ts`, separada de `Button.tsx` porque tenerlas en el mismo archivo rompía el Fast Refresh de React — el linter lo marca con `react/only-export-components`). Regla: usar `Button` solo para acciones (`onClick`), `LinkButton` para navegación.
- **Transiciones de página con la View Transitions API nativa** (`viewTransition` en los `<Link>`/`navigate()` de navegación entre pantallas, soportado nativamente por `react-router-dom` v7 sin librerías adicionales) en vez de Framer Motion u otra librería de animación — el bundle ya está en ~350kb gzip por `html5-qrcode` + `recharts`, y la View Transitions API no agrega peso. El CSS de la transición (fade corto, 180ms) vive en `src/index.css`. Se degrada sin romper nada en navegadores sin soporte (Safari/iOS viejo). Los redirects de los guards (`RequireAuth`, `RequireProfile`, `<Navigate>`) no usan `viewTransition` a propósito — son bounces automáticos, no navegación iniciada por el usuario.

**Nota para el próximo agente:** `Html5Qrcode.stop()` (usado en `hooks/useQrScanner.ts`) tira una excepción **síncrona** (no una promesa rechazada) si se llama antes de que la cámara termine de arrancar o después de ya haber parado. En desarrollo, `StrictMode` monta/desmonta/vuelve a montar los efectos muy rápido, así que el cleanup del hook puede correr antes de que `.start()` resuelva — llamar `.stop()` ahí crasheaba toda la página. La solución es chequear `scanner.isScanning` antes de llamar `.stop()`, y si el cleanup corrió mientras `.start()` todavía estaba pendiente, parar el scanner recién cuando esa promesa resuelva (ver el flag `cancelled` en `useQrScanner.ts`). Cualquier código nuevo que envuelva una librería de cámara/hardware con un ciclo de vida async debe tener este mismo cuidado.

**Nota para el próximo agente (2):** todo hook que hace `algúnServicio(...).then(...)` sin un `.catch()` se queda colgado en `loading: true` para siempre si la promesa se rechaza (pasó en `useMachineById`, `useMachineHistory`, `useLastEntry`, `useRecentActivity` — encontrado probando con un id inválido, que hace que Supabase devuelva 400). Todo hook de fetch nuevo tiene que manejar el `.catch()` explícitamente y bajar `loading` ahí también, no solo en el `.then()`.

**Nota para el próximo agente (4):** en los ejes de `ProgressPage` (`recharts`) **no usar** `stroke="currentColor"` + una clase `text-gray-500 dark:text-gray-400` de Tailwind para colorear el texto de los ticks. Se probó y funcionaba en un repro aislado con Playwright, pero en el navegador real del usuario el texto seguía negro en modo oscuro — la herencia de `color` vía `currentColor` hasta los `<text>` que genera Recharts internamente no es confiable en la práctica. La solución fue usar un color hexadecimal fijo (`AXIS_TEXT_COLOR = '#6b7280'`, gray-500) pasado directo a `stroke`/`fill`, sin depender de clases de Tailwind ni de `currentColor` dentro del SVG de Recharts. Cualquier texto/línea nuevo dentro de un gráfico de Recharts debe seguir este mismo patrón (color fijo, no `currentColor` + `dark:`).

**Nota para el próximo agente (3):** en `ProgressPage`, el eje X del gráfico de `recharts` usa `entry.createdAt` (el timestamp ISO completo) como `dataKey`, **no** una fecha ya formateada tipo `"17/9"`. Motivo: si dos registros caen el mismo día, el string formateado se repite, y el eje categórico de Recharts trata valores de `dataKey` idénticos como la misma categoría — el tooltip terminaba mostrando siempre el primer punto sin importar dónde se posara el mouse (bug real, reproducido con Playwright barriendo el mouse sobre el gráfico). El formato bonito (`"17/9"`, `"17/9, 14:05"`) se aplica solo para mostrar, vía `tickFormatter` en `XAxis` y `labelFormatter` en `Tooltip` — nunca como el valor real del `dataKey`. Cualquier gráfico nuevo con eje temporal tiene que seguir el mismo patrón.

## Estado actual (mantener actualizado)

Fases 0 y 1 completadas. Scaffolding de Vite + React + TS, Tailwind v4, cliente de Supabase (`src/lib/supabaseClient.ts`), tipos de dominio base (`src/types/domain.ts`: `Machine`, `LogEntry`, `Profile`), rutas placeholder (`/login`, `/onboarding`, `/home`, `/scan`, `/log`, `/progress`, `/profile`).

Esquema de base de datos aplicado en Supabase desde `supabase/migrations/20260912000000_initial_schema.sql`: tablas `profiles`, `machines`, `log_entries` con relaciones a `auth.users` y RLS habilitado (cada usuario accede solo a sus propios `profiles`/`log_entries`; `machines` es catálogo compartido, legible/editable por cualquier usuario autenticado).

Fase 2 completada. Implementado:
- `lib/services/auth.ts` (`signInWithGoogle`, `signOut`, `getSession`, `subscribeToAuthChanges`) y `lib/services/profiles.ts` (`getProfileByUserId`, `createProfile`).
- `hooks/useAuth.ts` (sesión) y `hooks/useProfile.ts` (perfil del usuario actual, con la regla de negocio de nombre no vacío).
- `components/ui/Button.tsx`, `Card.tsx`, `Input.tsx` — primeras primitivas de UI según `DESIGN.md`.
- `components/RequireAuth.tsx` y `RequireProfile.tsx` — guards de ruta anidados en `router/AppRouter.tsx` (sin sesión → `/login`; con sesión sin perfil → `/onboarding`; con perfil → resto de la app).
- `pages/LoginPage.tsx` (botón "Iniciar sesión con Google") y `pages/OnboardingPage.tsx` (form de nombre) con estilos de `DESIGN.md`. `pages/HomePage.tsx` tiene un botón de cerrar sesión mínimo para poder probar el ciclo completo (contenido real de Home es Fase 4).

Probado de punta a punta con una cuenta real de Google: primera vez cae en `/onboarding`, guarda el perfil, y en sesiones siguientes entra directo a `/home`.

**Nota para el próximo agente:** `useProfile` deriva `loading` comparando el `userId` pedido contra el último `userId` para el que ya se tiene respuesta (`fetched.userId`) — no confiar solo en un booleano `loading` simple ahí, porque hubo un bug real de carrera (login → onboarding → home en loop infinito) causado por eso. Cualquier guard/hook nuevo que combine `useAuth()` + otro hook dependiente del `userId` debe esperar explícitamente a que `useAuth().loading` sea `false` antes de decidir con los datos del segundo hook (ver `components/RequireProfile.tsx`).

Fase 3 completada. Implementado:
- `lib/services/machines.ts` (`getMachineByQrCode`) y `lib/services/logEntries.ts` (`getLastLogEntry`, `createLogEntry`).
- `hooks/useMachine.ts`, `hooks/useLastEntry.ts`, `hooks/useLogEntry.ts` (con la validación de negocio: peso ≥ 0, reps/sets enteros > 0) y `hooks/useQrScanner.ts` (wrapper de `html5-qrcode`, maneja el ciclo de vida de la cámara).
- `pages/ScanPage.tsx` (cámara, navega a `/log/:qrCode` al decodificar) y `pages/LogPage.tsx` (nombre + badge de grupo muscular de la máquina, último registro, formulario de peso/reps/series). Ruta actualizada a `/log/:qrCode` en `router/AppRouter.tsx`.
- `supabase/seed.sql` con 3 máquinas de prueba para poder probar el flujo.

Probado de punta a punta con cámara real: escaneo de QR, formulario de log, y el último registro se muestra correctamente al volver a escanear la misma máquina.

Fase 4 en curso. Implementado:
- `lib/services/logEntries.ts`: agrega `getLogEntriesForMachine` (historial para el gráfico) y `getRecentLogEntries` (fetch crudo con el join a `machines`, sin dedupe). `lib/services/machines.ts`: agrega `getMachineById` y exporta `toMachine`/`MachineRow` (los usa `logEntries.ts` para el join).
- `hooks/useMachineHistory.ts`, `hooks/useMachineById.ts` y `hooks/useRecentActivity.ts` (este último aplica la regla de negocio de dedupe por máquina — el fetch crudo lo hace el servicio, el "último registro por máquina" lo decide el hook).
- `components/ui/Badge.tsx` y `components/MachineCard.tsx` — primer caso real de extracción de componente reutilizable (antes el badge estaba en línea en `LogPage` por regla de "no extraer hasta el 2do uso"; ahora se repite en `LogPage` y en la lista de Home).
- `pages/HomePage.tsx` con contenido real (lista de actividad reciente + botón escanear) y `pages/ProgressPage.tsx` con gráfico de `recharts`. Ruta actualizada a `/progress/:machineId`.

Verificado con TypeScript/lint/`vite build` limpios, y con Playwright (montando las páginas fuera de los guards temporalmente) que Home y Progress no crashean en sus estados vacío/error.

El usuario probó con datos reales y encontró dos bugs, ambos arreglados y confirmados: (1) el tooltip del gráfico siempre mostraba el mismo punto — el eje X usaba una fecha ya formateada como `dataKey` y dos registros el mismo día colisionaban en la misma categoría; se usa el timestamp completo como `dataKey` y se formatea solo para mostrar. (2) el texto de los ejes se veía negro en modo oscuro — `currentColor` + clases `dark:` de Tailwind no se heredaba de forma confiable hasta los `<text>` internos de Recharts; se usa un color hex fijo en su lugar (ver "Nota para el próximo agente (3)" y "(4)" arriba).

Probado de punta a punta con datos reales: escaneo → log → actividad reciente en Home → gráfico de progreso con tooltip y colores correctos en claro y oscuro.

Fase 5 completada. `scripts/generate-qr-codes.mjs` (`npm run qr:generate`) genera un PNG de 512×512 por cada una de las 3 máquinas de prueba en `scripts/output/qr-codes/` (gitignorado), codificando el `qr_code` de cada una. Verificado decodificando los 3 PNG generados (con `jsqr`) y confirmando que el texto coincide exacto con el `qr_code` de `supabase/seed.sql`. Ver "Decisiones de arquitectura" arriba para lo que quedó pendiente si más adelante se retoma la idea de que el QR abra la app desde la cámara nativa (requiere Fase 6 primero).

Entre Fase 5 y Fase 6, pedido explícito de UI (no es parte de ninguna fase numerada): navegación persistente. Se agregó `AppShell` (header "GymTrack" + footer fijo) envolviendo todas las páginas post-login, `components/ui/LinkButton.tsx` (y se corrigió HTML inválido preexistente de `<button>` anidado en `<a>`), y transiciones de página con la View Transitions API nativa (`viewTransition`, sin librería nueva). Ver "Decisiones de arquitectura" arriba.

Como consecuencia directa de tener header/footer siempre disponibles, se sacaron los botones "Volver a Home" / "Volver a escanear" / "Escanear otra máquina" que habían quedado redundantes en los estados de error y de éxito de `LogPage` y `ProgressPage` — esas acciones ya las cubren el header (tap "GymTrack" → Home) y el footer (Escanear máquina) en cualquier pantalla. Regla para páginas nuevas: no agregar un botón de navegación de vuelta a Home/Scan si ya vive dentro de `AppShell`, es redundante por diseño.

Ajuste posterior, también pedido explícito: el footer de `AppShell` pasó de texto a **solo ícono** (`IconQrcode` de Tabler, `aria-label="Escanear máquina"` para accesibilidad). "Cerrar sesión" se sacó del footer y de `HomePage`, y ahora vive en `components/HeaderMenu.tsx` — un menú desplegable (ícono `IconMenu2`) en el header, a la derecha de "GymTrack", disponible en **todas** las páginas del shell (no solo Home). Si se agrega otra acción global al footer en el futuro, seguir el mismo patrón: ícono de Tabler outline + `aria-label`, no texto.

**Nota para el próximo agente (5):** la propiedad pública `Html5Qrcode.isScanning` puede quedar **desincronizada** del estado interno real de la librería — se confirmó empíricamente (con logs + Playwright + cámara falsa) que justo cuando `.start()` resuelve, `isScanning` puede leer `false` mientras `scanner.getState()` ya dice `SCANNING`. Esto hacía que `useQrScanner` se saltara el `.stop()` de la instancia "descartable" que crea `StrictMode` en desarrollo, dejando esa cámara físicamente prendida para siempre (confirmado inspeccionando `MediaStreamTrack.readyState`, que quedaba en `'live'` en vez de `'ended'`). El fix: chequear `scanner.getState() !== Html5QrcodeScannerState.NOT_STARTED` en vez de `scanner.isScanning` antes de llamar `.stop()` — es exactamente lo mismo que `.stop()` chequea internamente, así que además garantiza que nunca tire la excepción síncrona de la nota anterior. Cualquier código que consulte el estado de este scanner debe usar `getState()`, no `isScanning`.

- **El acento pasó de azul a rojo**, a pedido del usuario, para reflejar la identidad visual del gimnasio real (logo de Full Trainer Gym: rojo sobre negro, compartido como referencia). Actualizado en `DESIGN.md` (fuente de verdad del color) y en todo el código: `buttonStyles.ts`, `Input.tsx`, `Badge.tsx`, `HeaderMenu.tsx`, y el color de la línea del gráfico en `ProgressPage.tsx` (`LINE_COLOR`, hex porque Recharts no resuelve clases de Tailwind). **Efecto colateral necesario:** el color semántico de error pasó de `red-600` a `amber-600` — con el acento ahora en rojo, un mensaje de error en `red-600` se mezclaría visualmente con botones/estados activos y perdería la señal de alerta. Si en el futuro se vuelve a cambiar el acento, revisar si el color de error debería volver a `red-600`.
- **Ajuste posterior, también pedido explícito: el rojo del fondo de botones se suavizó a `red-500`** (hover `red-600`) — `red-600` sólido se sentía muy intenso para un botón grande. El `red-600` de texto/badge (acento no-botón) no cambió. Además, **el foco (`:focus`) dejó de usar el color de acento**: inputs, botones y el ícono de menú muestran un anillo gris neutro (`ring-gray-400` / `dark:ring-gray-600`) en vez de rojo, y los inputs ya no cambian el color del borde al enfocarse (antes `focus:border-red-600`), solo aparece el anillo. Ver `DESIGN.md` sección 2.
- **`ProgressPage` y `LogPage` usan `components/FooterActionContext.tsx`** para cambiar dinámicamente qué acción muestra el footer de `AppShell` — no es más un solo botón fijo de "escanear". `useFooterAction(action | null)` registra la acción mientras la página está montada y la limpia sola al desmontar (vuelve al default de `AppShell`, que es "escanear"). Tres tipos de acción (`kind: 'scan' | 'add' | 'save'`): `scan`/`add` navegan (`to`), `save` dispara el submit de un `<form>` en otra parte del árbol vía el atributo HTML `form={formId}` (el botón del footer no está anidado dentro del `<form>` de la página — están en ramas DOM distintas, header/footer vs. `<main>`, pero el atributo `form` de HTML conecta ambos igual). Por esto `LogPage` ya no tiene su propio botón de submit: el único botón de esa página es el del footer, con `disabled` atado a `saving`. Patrón para páginas nuevas que necesiten una acción de footer distinta a "escanear": llamar `useFooterAction` con la acción real cuando los datos estén listos, y `null` en los estados de loading/error (cae al default en vez de mostrar una acción que fallaría).
- **`LogPage` ya no muestra una pantalla de "guardado" propia.** Al guardar con éxito, navega a `/home` pasando solo una bandera por `navigate(..., { state: { justSaved: true } })` (sin detalle del registro — mensaje genérico a propósito, pedido explícito del usuario). `HomePage` lo lee de `location.state` en su `useState` inicial, muestra un banner verde fijo "Registro guardado" con ícono (`IconCircleCheck`, `green-600`/`bg-green-50 dark:bg-green-950`, ver `DESIGN.md`) por 4 segundos, y limpia el `state` de esa entrada del historial con `navigate('.', { replace: true, state: null })` para que no reaparezca si el usuario navega con back/forward hasta ahí. Cualquier otra página que quiera mostrar "hice algo, mandame a Home con confirmación" puede seguir el mismo patrón (bandera + mensaje fijo, no texto dinámico) en vez de inventar un mecanismo nuevo (toast global, etc.).

Este checkpoint (rediseño de navegación + paleta + footer dinámico) quedó verificado con TypeScript/lint/`vite build` limpios y con Playwright (rutas temporales, cámara falsa donde hizo falta) para cada pieza: header sticky, footer fijo, menú hamburguesa abre/cierra, cámara se libera al salir de Scan, paleta roja legible en claro/oscuro, y el footer dinámico (contexto + submit cross-DOM vía atributo `form`) probado de punta a punta con una página de prueba aislada. El usuario confirmó en dispositivo real que las transiciones y el resto se sienten bien.

## Fase 6 — Perfil extendido

Objetivo: agregar peso, estatura y fecha de nacimiento al perfil, pedidos una sola vez (al iniciar sesión, si faltan) y editables después desde una pantalla de Perfil real, accesible desde el menú hamburguesa. Pensado para generar informes más adelante combinando esto con los `log_entries`.

**Decisiones tomadas** (no se le preguntaron al usuario todas, se asumieron razonablemente y se puede ajustar si hace falta): unidades kg/cm, los tres campos son obligatorios para considerar el perfil "completo" (sin opción de omitir), un solo formulario (no pasos separados), validaciones simples de rango (peso 1–500kg, estatura 1–300cm, fecha de nacimiento entre 1900 y hoy).

**Implementado:**
1. `supabase/migrations/20260917000000_profile_biometrics.sql`: `weight_kg numeric(5,2)`, `height_cm numeric(5,1)`, `birth_date date` en `profiles`, las tres **nullable** con `check` de rango. Aplicada en el proyecto real.
2. `types/domain.ts`: `Profile` con `weightKg`, `heightCm`, `birthDate` (los tres `number | null` / `string | null`).
3. `lib/services/profiles.ts`: `createProfile`/`updateProfile` aceptan los 4 campos juntos (`ProfileDetailsInput`).
4. `hooks/useProfile.ts`: expone `isProfileComplete(profile)` (export, no solo hook — lo usan `RequireProfile` y `LoginPage` además del propio hook) y `saveProfileDetails(input)`, que decide sola si hace `createProfile` o `updateProfile` según si `profile` ya existe — así `OnboardingPage` y `ProfilePage` llaman a lo mismo sin duplicar esa decisión. Validación de rangos vive acá (regla de negocio), no en los componentes. De paso se le agregó el `.catch()` que le faltaba (mismo bug de la Fase 4, ver nota arriba — este hook se había quedado afuera esa vez).
5. **Gating:** `components/RequireProfile.tsx` y `pages/LoginPage.tsx` ahora chequean `isProfileComplete(profile)` en vez de solo `!!profile`. Un perfil que existe pero le faltan datos biométricos se trata igual que "no tiene perfil" — lo manda a `/onboarding`.
6. `components/ProfileForm.tsx` (nuevo, compartido): los 4 campos (nombre, peso, estatura, fecha de nacimiento), **sin botón propio** — mismo patrón que `LogPage`, quien lo usa decide el trigger de guardado vía atributo `form={id}`. `OnboardingPage` le pone un botón "Continuar" normal (está fuera de `AppShell`, sin footer); `ProfilePage` usa el footer dinámico (`useFooterAction` con `kind: 'save'`), y al guardar muestra un banner de confirmación en la misma pantalla (no navega, es edición) en vez del patrón de `LogPage` (que sí navega a Home).
7. `OnboardingPage`: si el perfil ya existe pero está incompleto, prellena nombre y muestra "Completá tu perfil" en vez de "Contanos quién sos"; al guardar navega explícito a `/home` (no depende de esperar un re-render, como antes).
8. `HeaderMenu.tsx`: nuevo ítem "Perfil" (`IconUser`) arriba de "Cerrar sesión".

Verificado con TypeScript/lint/`vite build` limpios, y con Playwright: el formulario completo renderiza bien en Onboarding y en Profile (con el footer mostrando el ícono de guardar), el menú muestra "Perfil", y confirmé que el botón del footer efectivamente dispara el submit del formulario real de `ProfilePage` (sin sesión real esto termina en el error esperado "No hay usuario autenticado", mostrado inline — no un submit de página completa). **Falta la prueba end-to-end con una sesión real**: completar el perfil desde `/onboarding` (usuario nuevo) y desde `/profile` con un perfil ya completo (edición).

Probado de punta a punta por el usuario con sesión real: pide los datos faltantes al iniciar sesión y se pueden editar después desde el menú → Perfil.

**Fase actual: Fase 7 — Demo**, todavía no iniciada.
