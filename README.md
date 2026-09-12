# GymTrack

PWA personal para trackear progreso en el gimnasio: escaneás el código QR pegado en una máquina, la app la identifica, te muestra tu último registro (peso/reps) en esa máquina y te deja guardar uno nuevo.

Side project con dos objetivos: practicar el flujo de construir una app con ayuda de IA, y aplicar principios de arquitectura que le permitan a un agente de IA mantener el proyecto de forma consistente a largo plazo.

## Stack

- **React + Vite + TypeScript** — UI y build tooling
- **Tailwind CSS v4** (plugin de Vite, sin `tailwind.config.js`) — estilos
- **Supabase** — auth + base de datos Postgres
- **React Router** — navegación

## Estructura de carpetas

```
src/
├── pages/       # Componentes de página (uno por ruta)
├── components/  # Componentes de UI reutilizables (presentacionales)
├── hooks/       # Hooks custom: lógica de negocio / estado, puente entre UI y servicios
├── lib/
│   ├── supabaseClient.ts  # Cliente único de Supabase
│   └── services/          # Acceso a datos: funciones que hablan con Supabase por entidad
├── types/       # Tipos de dominio compartidos (Machine, LogEntry, Profile...)
└── router/      # Configuración de rutas
```

**Por qué esta separación:** cada carpeta representa una capa distinta (UI, lógica de negocio, acceso a datos) y una responsabilidad única. Esto mantiene los cambios localizados: tocar una consulta a Supabase no debería requerir tocar un componente, y viceversa. Ver [.claude/CLAUDE.md](.claude/CLAUDE.md) para el detalle completo del principio de capas y las convenciones de código — es la referencia que uso (Claude) para mantener el proyecto consistente entre sesiones.

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

## Conectar con Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **Project Settings → API**, copiar la **Project URL** y la **anon public key**.
3. Pegarlas en tu `.env` (no se commitea):
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```
4. Crear las tablas `machines`, `log_entries` y `profiles` en Postgres (aún no incluido en este setup — es el siguiente paso de lógica de negocio).

## Estado actual

Solo setup inicial: scaffolding, Tailwind, cliente de Supabase, tipos de dominio y rutas placeholder. Sin lógica de negocio todavía.
