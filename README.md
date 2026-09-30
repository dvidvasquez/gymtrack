# GymTrack

Web app personal para trackear progreso en el gimnasio: escaneás el código QR pegado en una máquina, la app la identifica, te muestra tu último registro (peso/reps/series) y te deja guardar uno nuevo. Los ejercicios sin QR (mancuernas, barra) se eligen de una lista.

En producción: **https://gym-full-tracker.vercel.app/**

Side project con dos objetivos: practicar el flujo de construir una app con ayuda de IA, y aplicar principios de arquitectura que le permitan a un agente de IA mantener el proyecto de forma consistente a largo plazo.

## Qué hace

- **Login con Google** y perfil con nombre, peso, estatura y fecha de nacimiento (se piden una vez y se editan desde el menú → Perfil).
- **Registrar un ejercicio:** el botón del footer ofrece escanear el QR de la máquina o elegir el ejercicio de la lista. Se muestra el último registro y se carga peso, repeticiones y series.
- **Actividad reciente** en Home: último registro de cada ejercicio.
- **Progreso por ejercicio:** gráfico de peso en el tiempo y lista de registros (se puede borrar uno cargado por error).
- **Catálogo de ejercicios** con búsqueda. Solo los usuarios con rol `owner` pueden crear, editar o borrar ejercicios; el rol se otorga a mano por SQL.
- **QR imprimibles:** `npm run qr:generate` genera un PNG por máquina (la lista está en el script).

## Stack

- **React + Vite + TypeScript** — UI y build tooling
- **Tailwind CSS v4** (plugin de Vite, sin `tailwind.config.js`) — estilos
- **Supabase** — auth (Google) + base de datos Postgres con RLS
- **React Router** — navegación
- **html5-qrcode** (lectura de QR) y **Recharts** (gráfico)
- **Vercel** — deploy

## Estructura de carpetas

```
src/
├── pages/       # Una página por ruta
├── components/  # Piezas de UI reutilizables (ui/ = primitivas: Button, Card, Input...)
├── hooks/       # Lógica de negocio y estado: puente entre UI y servicios
├── lib/
│   ├── supabaseClient.ts  # Cliente único de Supabase
│   └── services/          # Acceso a datos: funciones que hablan con Supabase, una por entidad
├── types/       # Tipos de dominio compartidos (Exercise, LogEntry, Profile)
└── router/      # Configuración de rutas y guards
supabase/
├── migrations/  # Esquema SQL, en orden de aplicación
└── seed.sql     # 3 máquinas de prueba
scripts/
└── generate-qr-codes.mjs  # Genera los PNG de QR para imprimir
```

**Por qué esta separación:** cada carpeta representa una capa distinta (UI, lógica de negocio, acceso a datos). Esto mantiene los cambios localizados: tocar una consulta a Supabase no debería requerir tocar un componente, y viceversa. Ver [.claude/CLAUDE.md](.claude/CLAUDE.md) para el detalle completo de capas, convenciones y decisiones — es la referencia que usa Claude para mantener el proyecto consistente entre sesiones — y [.claude/DESIGN.md](.claude/DESIGN.md) para la guía visual.

## Cómo correr el proyecto localmente

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar el archivo de variables de entorno y completar tus credenciales de Supabase:
   ```bash
   cp .env.example .env
   ```
3. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

Otros comandos: `npm run build` (typecheck + build), `npm run lint` (oxlint), `npm run qr:generate`.

## Conectar con Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **Project Settings → API**, copiar la **Project URL** y la **anon public key** y pegarlas en tu `.env` (no se commitea):
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```
3. Aplicar las migraciones de `supabase/migrations/` **en orden** (por nombre de archivo) pegándolas en el **SQL Editor** del dashboard. Opcionalmente, `supabase/seed.sql` para tener 3 máquinas de prueba.
4. Habilitar el proveedor **Google** en Authentication → Providers, y en Authentication → URL Configuration → Redirect URLs permitir `http://localhost:5173/**` (y el dominio de producción con `/**`).
5. Para poder editar el catálogo de ejercicios, darte el rol `owner` desde el SQL Editor:
   ```sql
   update profiles set role = 'owner'
     where user_id = (select id from auth.users where email = 'tu-email@ejemplo.com');
   ```

## Estado actual

MVP completo y en uso (fases 0 a 9 del plan en `.claude/CLAUDE.md`): login, perfil, escaneo y registro, registro manual sin QR, progreso con gráfico, catálogo editable con roles, generación de QR y deploy en Vercel.

Último checkpoint: el rol ya no se puede autoasignar desde la app (migración `20260930000000_protect_profile_role.sql`), manejo de errores de carga del perfil con "Reintentar", y borrado de registros desde la pantalla de progreso.

Pendiente a futuro (no MVP): modo offline con sincronización (Fase 10) e instalación como PWA.
