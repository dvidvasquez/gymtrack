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
- **Fase 2 — Autenticación:** login con Google vía Supabase Auth, pantalla de onboarding que guarda datos en `profiles`.
- **Fase 3 — Escaneo y registro:** integrar lectura de QR con la cámara, mostrar el último registro de esa máquina, formulario para guardar un log nuevo.
- **Fase 4 — Progreso:** pantalla de progreso por máquina con gráfico, pantalla Home con resumen básico.
- **Fase 5 — Generación de QR físicos:** script para exportar un PNG de QR por cada máquina, para imprimir.
- **Fase 6 — Demo:** deploy en Vercel, prueba end-to-end antes de mostrárselo al dueño del gimnasio.
- **Fase 7 (futura, no MVP) — Offline-first:** guardado local con IndexedDB y sincronización en segundo plano cuando el usuario recupera conexión. No implementar hasta que se indique explícitamente.

**Regla importante:** en cada sesión, trabajar únicamente en la fase que el usuario indique como "actual" (ver "Estado actual" abajo). Si una tarea pedida pertenece a una fase posterior a la actual, señalarlo y preguntar si se quiere adelantar, en vez de hacerla directamente.

## Decisiones de arquitectura

- **SQL de esquema vive en `supabase/migrations/`, fuera de `src/`.** No es parte de la estructura de capas de la app (esa regla aplica a código de la UI/lógica/datos en `src/`). Es la convención estándar de Supabase para versionar el esquema, y no hay Supabase CLI instalado en este entorno — los archivos `.sql` ahí son para copiar/pegar en el SQL Editor del dashboard de Supabase, no para correr con `supabase db push`.
- **`machines` no tiene `user_id`.** Se modela como catálogo compartido de equipamiento físico del gimnasio (coherente con `src/types/domain.ts`, que no le da owner), no como dato propio de cada usuario. Si en el futuro se soporta multi-gimnasio por usuario, esta tabla necesita agregar `user_id` y políticas RLS por dueño — no implementar hasta que se pida.

## Estado actual (mantener actualizado)

Fases 0 y 1 completadas. Scaffolding de Vite + React + TS, Tailwind v4, cliente de Supabase (`src/lib/supabaseClient.ts`), tipos de dominio base (`src/types/domain.ts`: `Machine`, `LogEntry`, `Profile`), rutas placeholder (`/login`, `/onboarding`, `/home`, `/scan`, `/log`, `/progress`, `/profile`).

Esquema de base de datos aplicado en Supabase desde `supabase/migrations/20260912000000_initial_schema.sql`: tablas `profiles`, `machines`, `log_entries` con relaciones a `auth.users` y RLS habilitado (cada usuario accede solo a sus propios `profiles`/`log_entries`; `machines` es catálogo compartido, legible/editable por cualquier usuario autenticado).

Sin lógica de negocio, sin servicios en `lib/services/` (carpeta creada pero vacía) — corresponde a la Fase 2 en adelante.

**Fase actual: Fase 2 — Autenticación**, todavía no iniciada.
