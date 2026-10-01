# GymTrack — guía para Claude Code

Este archivo es la referencia que debe leer un agente de IA (Claude Code) antes de tocar este repo, para mantenerlo consistente entre sesiones aunque el proyecto sea chico. Describe **cómo es el proyecto hoy**; el detalle de cómo se llegó hasta acá vive en `git log` (cada fase es uno o pocos commits con mensaje descriptivo).

Guía visual (colores, tipografía, componentes): [DESIGN.md](DESIGN.md).

## Propósito del proyecto

GymTrack es una web app personal para trackear progreso en el gimnasio mediante códigos QR por máquina.

Flujo central: el usuario escanea el QR pegado en una máquina → la app identifica el ejercicio → muestra su último registro (peso/reps/series) en ese ejercicio → el usuario guarda un nuevo registro. Para ejercicios sin QR físico (mancuernas, barra) el ejercicio se elige de una lista.

Es un side project con dos objetivos explícitos, ambos igual de importantes al tomar decisiones:
1. Practicar el flujo completo de construir una app con ayuda de IA.
2. Servir de terreno de prueba para principios de arquitectura que permitan a un agente de IA mantener el proyecto de forma consistente a largo plazo, **incluso siendo un proyecto pequeño**.

Esto último significa: preferir claridad y límites explícitos sobre "menos archivos", porque el costo que se está optimizando no es la cantidad de líneas sino la facilidad de que un agente sin memoria de sesiones anteriores entienda dónde va cada cosa.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4 (integrado vía `@tailwindcss/vite`, **sin** `tailwind.config.js` — la v4 configura todo por CSS con `@import "tailwindcss"` en `src/index.css`)
- Supabase (auth con Google + Postgres) vía `@supabase/supabase-js`
- react-router-dom v7
- `html5-qrcode` (lectura de QR), `recharts` (gráfico), `@tabler/icons-react` (íconos)
- Deploy: Vercel — **https://gym-full-tracker.vercel.app/** (`vercel.json` reescribe todas las rutas a `index.html`)

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
   - `components/` = piezas de UI reutilizables entre páginas. `components/ui/` son las primitivas genéricas (`Button`, `LinkButton`, `Card`, `Input`, `Badge`, `SegmentedControl`); el resto son piezas del dominio (`ExerciseCard`, `ExerciseLogForm`, guards de ruta, etc.).

2. **Lógica de negocio (`src/hooks/`)** — Hooks custom que orquestan llamadas a `lib/services/`, manejan estado local (loading/error/data) y aplican reglas de negocio. No sabe cómo se renderiza nada, no sabe cómo se hace una query SQL.

3. **Acceso a datos (`src/lib/services/`, `src/lib/supabaseClient.ts`)** — Funciones que reciben parámetros y devuelven datos tipados desde Supabase (ej. `getLastLogEntry(exerciseId, userId)`). No conocen React. Un archivo de servicio por entidad (`exercises.ts`, `logEntries.ts`, `profiles.ts`, más `auth.ts`). Cada servicio convierte filas `snake_case` a tipos de dominio `camelCase` (`toExercise`, `toLogEntry`, `toProfile`).

`src/types/domain.ts` es transversal: tipos de dominio (`Exercise`, `LogEntry`, `Profile`) usados por las tres capas. `src/router/AppRouter.tsx` solo define el mapeo ruta → página.

### Por qué esta separación (para un agente de IA)

- **Cambios localizados y predecibles.** Si hay que cambiar una query a Supabase, el cambio vive en `lib/services/`, nunca dentro de un componente. Si hay que cambiar cómo se ve una pantalla, el cambio vive en `pages/` o `components/`, sin tocar lógica de datos. Esto reduce el "blast radius" de cada edición.
- **Contexto acotado por tarea.** Cuando la tarea es "agregar un campo a `LogEntry`", el agente sabe que debe tocar: `types/domain.ts` → `lib/services/logEntries.ts` → el hook que lo consume → el componente que lo muestra, en ese orden y sin sorpresas en otros archivos.
- **Nombres de archivo como índice.** El nombre de la carpeta ya dice la capa, el nombre del archivo ya dice la entidad.

## Convenciones de código

- **Componentes**: `PascalCase`, un componente por archivo, nombre de archivo = nombre del componente + sufijo de rol (`LoginPage.tsx`, `ExerciseCard.tsx`).
- **Hooks**: `camelCase` con prefijo `use` (`useLastEntry.ts`), un hook por archivo.
- **Servicios**: `camelCase`, un archivo por entidad de dominio en `lib/services/` (`exercises.ts`, no `exerciseService.ts` — la carpeta ya indica que es un servicio).
- **Tipos**: viven en `src/types/`, se importan siempre desde ahí (nunca redefinidos localmente en un componente o hook).
- **Exports**: named exports, no default exports (excepción: `App.tsx`, por convención de Vite/React).
- **Estilos**: solo utilidades de Tailwind en JSX, siguiendo `DESIGN.md`. No crear archivos `.css` por componente salvo necesidad real.
- **Variables de entorno**: siempre con prefijo `VITE_`, documentadas en `.env.example`, tipadas en `src/vite-env.d.ts`.
- **Textos de UI** en español rioplatense (voseo: "Escaneá", "Reintentá").

## Reglas para mantener consistencia al crecer

- Antes de crear un componente nuevo, revisar si algo similar ya existe en `components/` para reutilizar o extender en vez de duplicar.
- Toda llamada a `supabase.from(...)` vive en `lib/services/`. Si aparece un `supabase.from` dentro de un componente o un hook, falta extraer un servicio.
- Toda regla de negocio (validaciones, cálculos, decisiones de flujo) vive en `hooks/`, no en componentes ni en servicios.
- Si un tipo de dominio cambia, actualizar `src/types/domain.ts` primero y dejar que TypeScript señale todos los lugares afectados.
- Mantener actualizados la sección "Estado actual" de este archivo **y** la del `README.md` a medida que se agregan features.
- Cualquier decisión de arquitectura no trivial debe quedar registrada en "Decisiones vigentes" (abajo), no solo en el historial de commits. Si una decisión deja de ser cierta, **editarla o borrarla** — no agregar una nota nueva que la contradiga más abajo. Una afirmación vieja escrita como vigente confunde más que no tener nada.

## Flujo de trabajo con PRs (pedido explícito del usuario)

- Cada cambio se trabaja en la rama asignada por la sesión, se pushea y se abre un PR contra `main` (título y descripción en español, con sección de cambios y de verificación).
- **Mergear el PR sin preguntar** cuando: los checks del head actual están en verde (hoy: el deploy de preview de Vercel), no hay conflictos con `main` y no quedan comentarios de revisión sin resolver. Método: merge commit (`merge`), igual que los PRs anteriores. Vercel despliega `main` a producción solo.
- **Excepción — no mergear sin confirmación del usuario** si el PR incluye una migración nueva en `supabase/migrations/`: las migraciones se aplican a mano en el SQL Editor, y mergear antes publicaría código que depende de un esquema que producción todavía no tiene. Pedir que la aplique, esperar el "ok" y recién ahí mergear.
- Si un check falla o hay un conflicto, arreglarlo y pushear antes de mergear; nunca mergear en rojo.
- Después de un merge, el trabajo siguiente arranca con la rama recreada desde `main` actualizado (el PR mergeado no se reutiliza).

## Qué NO hacer (evitar over-engineering)

Este es un proyecto chico y personal. Los siguientes patrones son deliberadamente evitados por ahora — no agregarlos "por si acaso":

- **No** state management global (Redux, Zustand, Jotai). El estado del servidor lo maneja cada hook con `useState`/`useEffect` (o `@tanstack/react-query` si en el futuro la cantidad de fetches lo justifica, pero no antes de necesitarlo).
- **No** capa de "repository" o "abstracción de base de datos" desacoplada de Supabase. Los servicios llaman a Supabase directamente.
- **No** generación de código, CLIs internas, ni monorepo/workspaces. Es un único paquete en la raíz del repo.
- **No** testing exhaustivo. Priorizar shippear features del flujo core antes que cobertura de tests.
- **No** sistema de diseño propio ni librería de componentes UI genérica. Usar utilidades de Tailwind directo; extraer un componente reutilizable solo cuando se repite 2+ veces.
- **No** crear carpetas nuevas de nivel superior sin necesidad concreta. Si algo no encaja en `pages/components/hooks/lib/types/router`, es más probable que falte pensar bien la ubicación que que falte una carpeta nueva.

Regla general: si una decisión de arquitectura solo se justifica por "esto es lo que se hace en apps grandes", no aplica acá. Se justifica por el problema concreto que resuelve en este proyecto, hoy.

## Plan de fases

El proyecto avanza en fases secuenciales. **Regla importante:** en cada sesión, trabajar únicamente en lo que el usuario indique. Si una tarea pedida pertenece a una fase posterior a la actual, señalarlo y preguntar si se quiere adelantar, en vez de hacerla directamente.

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Setup: Vite + React + TS, Tailwind, cliente Supabase, rutas, carpetas | COMPLETADA |
| 1 | Esquema de base de datos + RLS | COMPLETADA |
| 2 | Login con Google + onboarding (`profiles`) | COMPLETADA |
| 3 | Escaneo de QR, último registro, formulario de registro | COMPLETADA |
| 4 | Pantalla de progreso con gráfico + Home con actividad reciente | COMPLETADA |
| 5 | Script para generar los PNG de QR físicos | COMPLETADA |
| — | Navegación persistente (`AppShell`), paleta roja, footer dinámico (pedido de UI, sin número) | COMPLETADA |
| 6 | Perfil extendido: peso, estatura, fecha de nacimiento | COMPLETADA |
| 7 | Deploy en Vercel + prueba end-to-end en producción | COMPLETADA |
| 8 | Catálogo de ejercicios (con y sin QR) editable desde la app + roles `owner`/`member` | COMPLETADA |
| 9 | Registro manual desde Home (selector escanear / elegir de la lista) + búsqueda en `/exercises` | COMPLETADA |
| — | Revisión y endurecimiento: protección de `role`, errores de carga, borrar registros, docs (sin número) | COMPLETADA (ver "Estado actual") |
| 10 | **Futura, no MVP:** offline-first (IndexedDB + sincronización en segundo plano) | pendiente — no arrancar sin pedido explícito |

## Estado actual (mantener actualizado)

**Fases 0 a 9 completas**, probadas de punta a punta por el usuario en producción con datos reales. No hay fase "en curso": "seguir con la siguiente fase" **no** significa arrancar la Fase 10.

Último checkpoint (revisión y endurecimiento, sin número de fase):
- Migración `20260930000000_protect_profile_role.sql`: trigger que impide que un usuario se asigne `role` desde la app (ver "Decisiones vigentes"). Probada contra un Postgres 16 local con stubs de `auth` y **aplicada en el proyecto de Supabase de producción** (confirmado por el usuario: el trigger existe en `pg_trigger`).
- `useProfile` distingue error de carga de "no tiene perfil" (`LoadErrorCard` con "Reintentar"); `useAuth` maneja el error de `getSession`; límites de perfil alineados con los `check` de la base; el peso del registro acepta pasos de 0.25 kg; `useExercises` reconoce errores de Postgres por código.
- `ProgressPage` lista los registros debajo del gráfico y permite borrar uno (con confirmación).
- Verificado con `tsc`, `oxlint`, `vite build` y Playwright (sesión simulada, ver "Notas para el próximo agente"). Mergeado a `main` (PR #1) y desplegado por Vercel. **Falta la prueba en dispositivo real** (borrar un registro, guardar un peso con 0.25 kg).

Pendientes conocidos, sin fase asignada (no implementar sin pedido):
- `scripts/generate-qr-codes.mjs` tiene hardcodeadas las 3 máquinas de `supabase/seed.sql`; los ejercicios con QR creados desde la app no tienen forma de generar su PNG sin editar el script.
- "Actividad reciente" en Home muestra los días que entran en los últimos 200 registros; días más viejos no aparecen (no hay "ver más").
- La app no es instalable como PWA (sin `manifest.json` ni service worker), lo que limita que un QR escaneado con la cámara nativa abra la app en vez de una pestaña, sobre todo en iOS.
- Cada guard/página llama a `useAuth()` + `useProfile()` por su cuenta, así que el perfil se consulta varias veces por navegación. Aceptable hoy; si molesta, un contexto chico de sesión/perfil (no una librería de estado global).

## Rutas

| Ruta | Página | Notas |
|---|---|---|
| `/login` | `LoginPage` | Fuera de guards |
| `/onboarding` | `OnboardingPage` | Requiere sesión; fuera de `AppShell` |
| `/home` | `HomePage` | Actividad reciente agrupada por día (cada ejercicio hecho ese día, con su último registro del día) |
| `/log` | `LogEntryPage` | Selector: "Escanear QR" (`/scan`) o "Elegir de la lista" (`/exercises`) |
| `/scan` | `ScanPage` | Cámara; navega a `/log/:qrCode` |
| `/log/:qrCode` | `LogPage` | Registro, entrando por QR |
| `/log/exercise/:exerciseId` | `LogByExercisePage` | Registro, entrando por id (elegido de la lista) |
| `/progress/:exerciseId` | `ProgressPage` | Gráfico (peso / 1RM estimado / volumen) + lista de registros (borrables) |
| `/exercises` | `ExercisesPage` | Catálogo con búsqueda; alta/edición/borrado solo `owner` |
| `/exercises/new`, `/exercises/:id/edit` | `NewExercisePage`, `EditExercisePage` | Gateadas por `RequireOwner` |
| `/profile` | `ProfilePage` | Edición del perfil |

Guards anidados en `AppRouter.tsx`: `RequireAuth` (sin sesión → `/login`) → `RequireProfile` (perfil incompleto → `/onboarding`; error de carga → `LoadErrorCard`) → `AppShell` → páginas. Toda página nueva anidada ahí entra automáticamente al shell.

## Decisiones vigentes

### Base de datos

- **SQL de esquema vive en `supabase/migrations/`, fuera de `src/`.** No hay Supabase CLI: los archivos `.sql` se pegan **en orden** en el SQL Editor del dashboard. Antes de pegar, confirmar que el dashboard está en el proyecto de la app (el ref de `VITE_SUPABASE_URL`, que también aparece en la URL del dashboard) — un `relation "..." does not exist` casi siempre significa proyecto equivocado. Las migraciones nuevas califican los nombres con `public.` para no depender del `search_path` del editor. `supabase/seed.sql` carga 3 máquinas de prueba.
- **`exercises` (antes `machines`) es un catálogo compartido, sin `user_id`.** Es equipamiento del gimnasio, no dato de cada usuario. Si en el futuro se soporta multi-gimnasio, necesita `user_id` y RLS por dueño — no implementar hasta que se pida.
- **Un solo tipo `exercises` con `qr_code` nullable**, en vez de una tabla aparte para ejercicios sin QR. `qr_code = null` = se elige a mano desde `/exercises`; no-null = se escanea. Una tabla separada hubiera duplicado servicio/hooks/páginas y obligado a una FK polimórfica en `log_entries`, por una diferencia de una sola columna.
- **`log_entries.exercise_id` es `on delete restrict`**: borrar un ejercicio con historial falla (y `useExercises.removeExercise` traduce el error a un mensaje legible) en vez de arrastrar los registros en cascada.
- **Roles `profiles.role` (`'owner' | 'member'`, default `'member'`).** Solo `owner` puede insertar/editar/borrar en `exercises` (RLS); `select` está abierto a cualquier autenticado. El rol se otorga **a mano por SQL** (`update profiles set role = 'owner' where user_id = ...`), nunca al loguearse — decisión explícita del usuario, para poder mostrarle la app a alguien sin que pueda tocar el catálogo.
  - **El trigger `profiles_protect_role`** (migración `20260930000000`) rechaza cambiar `role`, o insertarlo con un valor distinto de `'member'`, cuando quien ejecuta es `authenticated`/`anon`. Sin él, las políticas `profiles_*_own` dejaban que cualquier usuario se autootorgara `owner` desde la consola del navegador. Se eligió trigger en vez de `revoke update (role)` porque Supabase da grants a nivel tabla y un revoke por columna no tiene efecto con esos grants. El SQL Editor corre como `postgres`, así que otorgar el rol a mano sigue funcionando. **Regla:** cualquier columna nueva de `profiles` que el usuario no deba poder editarse a sí mismo necesita el mismo tratamiento — las políticas `_own` permiten escribir todas las columnas.
  - `hooks/useProfile.ts` expone `isOwner(profile)`; `components/RequireOwner.tsx` gatea las rutas de alta/edición en el front (solo para no mostrar un formulario que va a fallar; la seguridad real es RLS + trigger).
- **Perfil "completo"** = nombre + peso + estatura + fecha de nacimiento (`isProfileComplete` en `useProfile.ts`). Las columnas son nullable en la base (perfiles viejos no las tenían); la app decide cuándo pedirlas. Unidades kg/cm. Los límites de validación del hook son **los mismos que los `check` de la migración, con los extremos exclusivos** (peso `< 500`, estatura `< 300`, nacimiento `> 1900-01-01`) — si se cambian en un lado, cambiarlos en el otro.
- **Errores de Postgres se reconocen por `code` (SQLSTATE)**, no por texto del mensaje: `23505` unique, `23503` foreign key (ver `useExercises.ts`).

### QR y flujo de registro

- **Lectura de QR con `html5-qrcode`**, envuelta en `hooks/useQrScanner.ts` (ver notas sobre su ciclo de vida abajo).
- **El QR impreso codifica la URL completa de producción** (`https://gym-full-tracker.vercel.app/log/:qrCode`), para que la cámara nativa del celular abra la app directo en la máquina. `ScanPage.resolveLogPath` extrae el `pathname` de esa URL y navega dentro de la SPA; si el texto no es una URL, cae a `/log/${texto}` (fallback para QR viejos que codificaban solo el `qr_code`).
- **`scripts/generate-qr-codes.mjs`** (`npm run qr:generate`) vive fuera de `src/` por ser tooling, igual que las migraciones. Genera PNG en `scripts/output/qr-codes/` (gitignorado). `APP_URL` y la lista de máquinas están hardcodeados a propósito: leer de Supabase requeriría la service role key para saltar RLS.
- **Login preserva el destino a través del OAuth de Google.** `RequireAuth`/`RequireProfile` guardan la ruta original en `state: { from }`; `LoginPage` se la pasa a `signInWithGoogle(redirectPath)`, que arma `redirectTo = origin + redirectPath` (el `state` de React Router no sobrevive al redirect de página completa). `OnboardingPage` también respeta `from`. Requiere que Supabase (Authentication → URL Configuration → Redirect URLs) acepte un patrón amplio como `https://gym-full-tracker.vercel.app/**` y `http://localhost:5173/**`.
- **Tres entradas al registro, un solo formulario.** `/log` (`LogEntryPage`) es solo un selector entre dos flujos existentes. `LogPage` (por `qrCode`) y `LogByExercisePage` (por `id`) son wrappers finos que resuelven el `Exercise` por el identificador que ya tienen a mano y comparten `components/ExerciseLogForm.tsx`. Mismo criterio para `ProgressPage` (`/progress/:exerciseId`): se llega desde `ExerciseCard`, que ya tiene el `id`.
- **Actividad reciente agrupada por día local.** `useRecentActivity` devuelve `days` (grupos `{ day: 'YYYY-MM-DD', activity }`, del más nuevo al más viejo) usando `toLocalDayKey`, que toma la fecha en la hora local del dispositivo, no en UTC (un registro de las 22:30 en Argentina es de ese día aunque en UTC ya sea el siguiente). El texto del encabezado ("Hoy", "Ayer", "Lunes, 22 de septiembre", con año solo si no es el actual) es presentación y vive en `HomePage` (`formatDayLabel`). **La deduplicación es por (día, ejercicio), no global:** un ejercicio hecho el martes y otra vez ayer aparece en los dos días, cada uno con su último registro de ese día. El hook pide los últimos 200 registros (`RECENT_ENTRIES_LIMIT`); si la respuesta llega al límite, descarta el día más viejo porque puede estar cortado (salvo que sea el único día).
- **El peso de un registro se puede ingresar en kg o lb, pero se guarda y se muestra siempre en kg.** `ExerciseLogForm` tiene un selector kg/lb (la última unidad elegida se recuerda por dispositivo en `localStorage`, vía `hooks/useWeightUnit.ts`; si el almacenamiento no está disponible, arranca en kg) y manda `{ weight, unit }`; `useLogEntry` convierte con `toKg` (1 lb = 0.45359237 kg, redondeado a 2 decimales como `weight_kg numeric(6, 2)`) antes de llamar al servicio. En lb, el form muestra "Se guarda como X kg" usando el mismo `toKg`. `WeightUnit` vive en `types/domain.ts` pero es solo del front: la base, `LogEntry.weightKg`, Home, el gráfico y "Último registro" no saben de libras. El peso del perfil sigue siendo solo kg.
- **El formulario de registro arranca precargado con el último registro** (`suggestedEntry` en `useLogEntry`): peso (convertido a la unidad elegida con `fromKg`), reps y series. Cada campo muestra la sugerencia mientras el usuario no lo toque (estado `null` = "usar sugerencia"), así la sugerencia aparece aunque el último registro cargue después del primer render, y el peso sugerido sigue a la unidad si se cambia kg/lb antes de editarlo. Un botón "+" suma `WEIGHT_INCREMENT` (2.5 kg o 5 lb) al peso actual. Sin último registro, los campos arrancan vacíos.
- **El gráfico de progreso tiene tres métricas** (`ProgressMetric` en `types/domain.ts`, cálculo en `metricValue` de `hooks/useExerciseHistory.ts`): peso; 1RM estimado con la fórmula de Epley (`peso × (1 + reps / 30)`, y el peso mismo si reps = 1), para ver progreso cuando suben las reps sin subir el peso; y volumen (`peso × reps × series`). Todas en kg, redondeadas a 1 decimal (salvo peso). El selector arranca en Peso y no se recuerda. El eje Y usa `domain={['auto', 'auto']}` (ajustado al rango de los datos, no desde 0) para que mejoras chicas se vean.
- **Grupo muscular se elige de una lista fija** (`MUSCLE_GROUPS` en `hooks/useExercises.ts`: Pecho, Espalda, Hombros, Trapecio, Bíceps, Tríceps, Antebrazos, Abdominales, Lumbares, Glúteos, Cuádriceps, Isquiotibiales, Aductores, Abductores, Pantorrillas), con un `<select>` en `ExerciseForm` y "Sin grupo muscular" como opción vacía. Es una regla de la app, **no** de la base: `exercises.muscle_group` sigue siendo texto libre, así los ejercicios viejos con otros valores ("Piernas", "Brazos") siguen siendo válidos. `muscleGroupOptions(current)` agrega el valor actual del ejercicio a las opciones si no está en la lista, para no perderlo al editar; `useExercises` valida contra esas mismas opciones antes de guardar. Para cambiar la lista, editar solo `MUSCLE_GROUPS`.
- **Búsqueda en `/exercises` es client-side** (substring case-insensitive sobre nombre y grupo muscular): la lista completa ya está en memoria y un gimnasio no tiene tantos ejercicios como para justificar una query por tecla.
- **Borrar registros** se hace desde `ProgressPage` (lista debajo del gráfico, con `window.confirm`), mismo patrón de confirmación/alerta que el borrado de ejercicios en `ExercisesPage`. No hay edición de registros: se borra y se vuelve a cargar.

### UI y navegación

- **`AppShell`** envuelve todas las páginas post-login con header sticky (marca "GymTrack" → `/home`, y `HeaderMenu`: Ejercicios / Perfil / Tema claro-oscuro / Cerrar sesión) y un footer fijo con **una sola acción, solo ícono + `aria-label`**. Login y Onboarding quedan fuera (son gates de una pantalla). No agregar botones de "volver a Home" en páginas del shell: el header ya lo cubre.
- **Footer dinámico con `components/FooterActionContext.tsx`.** Por defecto la acción es `register` (ícono `IconBarbell`, → `/log`). Una página la cambia con `useFooterAction(action | null)` mientras está montada: `add` (navega a `to`) o `save` (dispara el submit de un `<form>` con el atributo HTML `form={formId}`, aunque el botón esté en otra rama del DOM). Pasar `null` en estados de loading/error para caer al default en vez de mostrar una acción que fallaría.
- **Los formularios (`ProfileForm`, `ExerciseForm`, `ExerciseLogForm`) no tienen botón propio**; quien los usa decide el trigger (footer con `save`, o un `Button type="submit" form={id}` en Onboarding, que está fuera del shell).
- **Confirmación tras guardar un registro:** `LogPage`/`LogByExercisePage` navegan a `/home` con `state: { justSaved: true }`; `HomePage` muestra un banner verde fijo 4 s y limpia el `state` con `navigate('.', { replace: true, state: null })`. Otras pantallas que quieran "hice algo, volvé a Home con confirmación" siguen este patrón (bandera + mensaje fijo), sin inventar un sistema de toasts. `ProfilePage` es edición, así que muestra el banner en la misma pantalla sin navegar.
- **Errores de carga reintentables:** `components/LoadErrorCard.tsx` (mensaje + "Reintentar"). **Todo hook de fetch cuyo resultado "vacío" tiene un significado para el usuario expone `error` y `retry` separados de "vacío"** — si no, un error de red se muestra como dato real ("Todavía no registraste ningún entrenamiento", "No encontramos ese ejercicio", o peor, `useProfile` → `/onboarding`). Hoy: `useProfile`, `useRecentActivity`, `useLastEntry`, `useExerciseHistory`, `useExerciseById`, `useExerciseByQrCode`, todos con el mismo patrón (`attempt` en las dependencias del effect, `retry` lo incrementa). Las páginas muestran `LoadErrorCard` en vez del estado vacío; en el formulario de registro, si falla solo el último registro, se ve un aviso con "Reintentar" en esa sección y el formulario igual se puede guardar.
- **`components/ui/LinkButton.tsx`** existe para no anidar `<button>` dentro de `<a>` (HTML inválido). `Button` para acciones (`onClick`/submit), `LinkButton` para navegación. Comparten `buttonClasses` en `ui/buttonStyles.ts`, separado porque exportar funciones y componentes del mismo archivo rompe Fast Refresh (`react/only-export-components`).
- **Transiciones con la View Transitions API nativa** (`viewTransition` en `<Link>`/`navigate()`), sin librería de animación. CSS del fade (180 ms) en `src/index.css`. Los redirects de los guards no la usan a propósito (son bounces, no navegación del usuario).
- **Tema claro/oscuro elegible desde el menú.** `src/index.css` redefine la variante `dark` de Tailwind por clase (`@custom-variant dark (&:where(.dark, .dark *))`), así que todos los `dark:` existentes responden a `.dark` en `<html>` en vez de a `prefers-color-scheme`. Un script inline en `index.html` aplica el tema **antes** de que cargue React (sin parpadeo blanco al abrir en oscuro): lo guardado en `localStorage['gymtrack.theme']`, o si no hay elección, el modo del sistema. `hooks/useTheme.ts` lo cambia desde `HeaderMenu`, lo recuerda por dispositivo y, mientras no haya elección, sigue los cambios del sistema en vivo. También fija `color-scheme` en `<html>` para que los controles nativos coincidan. **La clave `gymtrack.theme` y la lógica de elección están duplicadas a propósito** entre `index.html` y `useTheme.ts` (el script tiene que correr antes que el bundle): si se cambia una, cambiar la otra.
- **Paleta:** acento rojo (identidad del gimnasio), error en `amber-600` (no rojo, para no confundirse con el acento), éxito en verde, foco en gris neutro. Fuente de verdad: `DESIGN.md`.

### Dependencias y bundle

- **Gráfico con `recharts`** en vez de SVG a mano (ejes/tooltips/responsive gratis).
- **El bundle pesa ~356 kB gzip** (un solo chunk; `vite build` advierte por pasar 500 kB minificado), casi todo `html5-qrcode` + `recharts`. Si el tamaño se vuelve un problema real, la solución es code-splitting de `ScanPage`/`ProgressPage` con `React.lazy`, no cambiar de librería.

## Notas para el próximo agente

1. **`Html5Qrcode` (en `hooks/useQrScanner.ts`).** `.stop()` tira una excepción **síncrona** si se llama antes de que la cámara termine de arrancar o después de haber parado; en desarrollo, `StrictMode` monta/desmonta efectos tan rápido que el cleanup puede correr antes de que `.start()` resuelva. Además, la propiedad pública `isScanning` puede quedar desincronizada (se vio `isScanning=false` con `getState()=SCANNING`), lo que dejaba la cámara prendida. Por eso: chequear `scanner.getState() !== Html5QrcodeScannerState.NOT_STARTED` (lo mismo que `.stop()` chequea internamente) y, si el cleanup corrió con `.start()` pendiente, parar recién cuando esa promesa resuelva (flag `cancelled`). Cualquier wrapper nuevo de cámara/hardware con ciclo de vida async necesita el mismo cuidado.
2. **Todo hook de fetch necesita `.catch()` explícito** que baje `loading`; sin él, una promesa rechazada (ej. id inválido → 400 de Supabase) deja la pantalla en "Cargando..." para siempre.
3. **Carrera de `userId` en `useProfile`.** `loading` se deriva comparando el `userId` pedido contra el de la última respuesta (`fetched.userId`), no con un booleano simple — hubo un loop real login → onboarding → home por eso. Todo guard/hook que combine `useAuth()` con otro hook dependiente del `userId` debe esperar a que `useAuth().loading` sea `false` antes de decidir (ver `RequireProfile.tsx`).
4. **Recharts, eje X temporal:** usar el timestamp ISO completo (`createdAt`) como `dataKey` y formatear solo para mostrar (`tickFormatter`, `labelFormatter`). Con una fecha ya formateada como `dataKey`, dos registros del mismo día colisionan en la misma categoría y el tooltip siempre muestra el primero.
5. **Recharts, colores:** usar hex fijos (`AXIS_TEXT_COLOR`, `LINE_COLOR` en `ProgressPage`), no `currentColor` + clases `dark:`. La herencia de `color` hasta los `<text>` internos de Recharts no es confiable en navegadores reales (quedaban negros en modo oscuro aunque un repro aislado funcionaba).
6. **`vite build` sin `.env` genera una app vacía.** `supabaseClient.ts` hace `throw` si faltan las variables; sin `.env`, Vite las reemplaza por `undefined` al compilar, el `throw` queda incondicional y el bundler elimina el resto de la app como código muerto (el build "pasa" pero pesa ~85 kB y no contiene ninguna página). Para compilar o probar localmente sin credenciales reales: `VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_ANON_KEY=dummy npx vite build` (o `npx vite` para dev).
7. **Probar pantallas autenticadas con Playwright sin cuenta real:** con el dev server levantado con esas variables de mentira, guardar una sesión falsa en `localStorage['sb-example-auth-token']` (JSON con `access_token` JWT sin firmar con `sub`/`exp`, `expires_at` futuro y `user`) vía `addInitScript`, e interceptar `**/rest/v1/<tabla>**` con `page.route` para devolver filas `snake_case` (o `abort` para simular errores de red). Para pedidos `.single()`/`.maybeSingle()` el header `Accept` incluye `vnd.pgrst.object` y hay que devolver un objeto, no un array. Así se verificó el checkpoint de revisión.
8. **Probar migraciones sin Supabase:** hay Postgres 16 en el entorno (`/usr/lib/postgresql/16/bin`). Con un stub mínimo (roles `authenticated`/`anon`, schema `auth` con tabla `users` y funciones `auth.uid()`/`auth.role()`) se pueden aplicar todas las migraciones en orden y probar políticas con `set role authenticated; set request.jwt.claim.sub = '<uuid>'`.
