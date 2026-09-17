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
- **Fase 5 — Generación de QR físicos:** script para exportar un PNG de QR por cada máquina, para imprimir.
- **Fase 6 — Demo:** deploy en Vercel, prueba end-to-end antes de mostrárselo al dueño del gimnasio.
- **Fase 7 (futura, no MVP) — Offline-first:** guardado local con IndexedDB y sincronización en segundo plano cuando el usuario recupera conexión. No implementar hasta que se indique explícitamente.

**Regla importante:** en cada sesión, trabajar únicamente en la fase que el usuario indique como "actual" (ver "Estado actual" abajo). Si una tarea pedida pertenece a una fase posterior a la actual, señalarlo y preguntar si se quiere adelantar, en vez de hacerla directamente.

## Decisiones de arquitectura

- **SQL de esquema vive en `supabase/migrations/`, fuera de `src/`.** No es parte de la estructura de capas de la app (esa regla aplica a código de la UI/lógica/datos en `src/`). Es la convención estándar de Supabase para versionar el esquema, y no hay Supabase CLI instalado en este entorno — los archivos `.sql` ahí son para copiar/pegar en el SQL Editor del dashboard de Supabase, no para correr con `supabase db push`.
- **`machines` no tiene `user_id`.** Se modela como catálogo compartido de equipamiento físico del gimnasio (coherente con `src/types/domain.ts`, que no le da owner), no como dato propio de cada usuario. Si en el futuro se soporta multi-gimnasio por usuario, esta tabla necesita agregar `user_id` y políticas RLS por dueño — no implementar hasta que se pida.
- **QR con `html5-qrcode`.** Elegida sobre alternativas (`@yudiel/react-qr-scanner`, etc.) por ser la más madura/estable para lectura por cámara en mobile. Es una dependencia pesada (agrega ~250kb gzip al bundle, ver warning de `vite build`); si el tamaño del bundle se vuelve un problema, la solución es code-splitting de `ScanPage` con `React.lazy` (no implementado todavía, no hacía falta para el alcance de la Fase 3).
- **No hay UI para crear `machines` todavía.** Ninguna fase del plan la pide explícitamente. Las máquinas de prueba se cargan a mano vía `supabase/seed.sql` (INSERT directo). Si en algún momento se pide gestionar máquinas desde la app, es una decisión a tomar explícitamente (probablemente amerite su propia fase), no algo para agregar de paso.
- **El QR codifica el valor de `machines.qr_code`** (un string corto como `machine-press-banca`), no el `id` (uuid) ni una URL completa. `ScanPage` navega a `/log/:qrCode` con ese valor tal cual, y `LogPage` resuelve la máquina vía `getMachineByQrCode`. La Fase 5 (generación de QR físicos) debe imprimir un QR por cada `qr_code`, no por `id`.
- **Gráfico con `recharts`.** Elegida sobre dibujar un line chart a mano en SVG por dar ejes/tooltips/responsive sin reinventar nada — a costa de otra dependencia de tamaño moderado (el bundle ya pasó los 500kb gzip advertidos por `vite build` sumando `html5-qrcode` + `recharts`). Si el tamaño se vuelve un problema real, la solución sigue siendo code-splitting de `ScanPage`/`ProgressPage` con `React.lazy` (ninguna de las dos se cargaría en el bundle inicial), no cambiar de librería.
- **`ProgressPage` usa `/progress/:machineId`** (el `id` de la máquina), no el `qrCode` como `LogPage`. Tiene sentido porque a esta pantalla se llega navegando desde `MachineCard` en Home (que ya tiene el `machine.id` a mano, no hace falta re-resolver por QR). Por eso existe `getMachineById` en `lib/services/machines.ts` además de `getMachineByQrCode` — son dos formas de entrada distintas, no redundancia.

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

**Fase actual: Fase 5 — Generación de QR físicos**, todavía no iniciada.
