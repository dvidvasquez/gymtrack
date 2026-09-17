# GymTrack — guía de diseño visual

Este archivo define las guías visuales que debe seguir cualquier pantalla o componente nuevo en GymTrack. Es la referencia para maquetar UI de forma consistente entre sesiones, aunque el proyecto sea chico.

Usa las clases de Tailwind v4 con la paleta por defecto (no hay `tailwind.config.js` ni tema custom — ver [CLAUDE.md](CLAUDE.md)). No inventar valores hexadecimales sueltos ni clases arbitrarias (`bg-[#...]`) salvo necesidad real.

## 1. Filosofía general

- **Minimalista y plano.** Superficies planas: nada de gradientes, sombras decorativas, glassmorphism, blur ni efectos de neón.
- **Mucho espacio en blanco.** Preferir padding y espaciado generoso antes que comprimir contenido.
- **Bordes finos en vez de separaciones pesadas.** Usar `border` de 1px (`border-gray-200` / `border-gray-800` en oscuro) para separar secciones, no `shadow-lg` ni fondos de color para marcar límites.
- Esta app es una herramienta personal de uso rápido en el gimnasio, no una marca corporativa. Cada decisión visual debe priorizar claridad y velocidad de lectura sobre "personalidad" de marca.

## 2. Paleta de colores

Set reducido, usando tokens estándar de Tailwind (sin custom theme):

| Uso | Modo claro | Modo oscuro |
|---|---|---|
| Fondo de pantalla | `bg-gray-50` | `dark:bg-gray-950` |
| Superficie de card | `bg-white` | `dark:bg-gray-900` |
| Borde | `border-gray-200` | `dark:border-gray-800` |
| Texto principal | `text-gray-900` | `dark:text-gray-100` |
| Texto secundario | `text-gray-500` | `dark:text-gray-400` |
| Fondo de botón primario | `red-500` (hover: `red-600`) | igual en oscuro |
| Acento de texto/badge (interactivo / estado activo) | `red-600` (`text-red-600`) | `dark:red-500` |
| Anillo de foco (inputs, botones, ícono de menú) | `gray-400` | `dark:gray-600` |

El rojo del acento sale de la identidad del gimnasio (logo de Full Trainer Gym: rojo sobre negro) — `red-500`/`red-600` de Tailwind, no un hex inventado. El fondo de los botones usa `red-500` (más suave) en vez de `red-600` a propósito — probado y ajustado a pedido del usuario, `red-600` se sentía muy intenso para un fondo sólido grande.

Reglas:
- El rojo es el **único** color de acento. No mezclar con azul, verde, morado, naranja, etc. para indicar "interactivo" o "activo".
- **El foco (`:focus`) no usa el color de acento.** Inputs, botones y el ícono de menú muestran un anillo gris neutro (`ring-gray-400` / `dark:ring-gray-600`), no rojo — decisión explícita del usuario. Los inputs tampoco cambian el color del borde al enfocarse, solo aparece el anillo.
- Colores semánticos (error, éxito) se usan solo cuando son estrictamente necesarios (ej. validación de formulario, confirmación de guardado) — **`amber-600` para error** (no `red-600`: como el rojo ya es el acento de marca, un error en rojo se mezclaría visualmente con botones/estados activos y perdería la señal de alerta) y **`green-600`/`bg-green-50 dark:bg-green-950` para éxito** (banner de confirmación, ej. "registro guardado" en Home). No agregar una paleta semántica completa sin necesidad concreta — solo error y éxito, nada de "info"/"warning" separados.
- Modo oscuro: soportarlo con el prefijo `dark:` de Tailwind desde que se cree cada componente, aunque el toggle de tema no esté implementado todavía — así no hay que retocar cada pantalla después.

## 3. Tipografía

Un solo peso regular (`font-normal`) para texto general y un peso medio (`font-medium`) para énfasis. Nada de `font-bold` ni `font-black`.

| Elemento | Clases |
|---|---|
| Título de pantalla | `text-2xl font-medium text-gray-900 dark:text-gray-100` |
| Subtítulo / sección | `text-lg font-medium text-gray-900 dark:text-gray-100` |
| Cuerpo de texto | `text-base font-normal text-gray-700 dark:text-gray-300` |
| Label de formulario / texto pequeño | `text-sm font-normal text-gray-500 dark:text-gray-400` |

## 4. Componentes base

Estos patrones deben vivir como componentes reutilizables en `src/components/ui/` (ver nota final) — no copiar las clases sueltas en cada pantalla.

### Botón primario

```tsx
<button className="w-full h-11 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-2 transition-colors">
  Guardar
</button>
```

### Botón secundario

```tsx
<button className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-2 transition-colors">
  Cancelar
</button>
```

### Input de texto/número

```tsx
<input
  type="number"
  className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
  placeholder="Peso (kg)"
/>
```

### Card

```tsx
<div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
  {/* contenido */}
</div>
```

### Badge / etiqueta pequeña (ej. grupo muscular)

```tsx
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
  Pecho
</span>
```

El `rounded-full` tipo "pill" está reservado **solo** para badges — ver sección 7.

## 5. Iconografía

Usar [Tabler Icons](https://tabler.io/icons) en su variante **outline** (`@tabler/icons-react`), nunca la variante filled. Mantiene consistencia visual en toda la app (trazo fino, sin relleno).

## 6. Reglas de espaciado

Usar siempre la escala de Tailwind, nunca valores arbitrarios (`p-[13px]`, `gap-[7px]`):

- Espaciado entre elementos relacionados (ej. label + input): `gap-2`
- Espaciado entre secciones o elementos de una lista: `gap-4`
- Padding interno de cards y contenedores: `p-4` (compacto) o `p-6` (generoso)
- Padding de pantalla completa: `p-4` en mobile, `md:p-6` en pantallas más grandes

## 7. Qué evitar explícitamente

- Iconos filled (solo outline, ver sección 5).
- Múltiples colores de acento mezclados — solo rojo.
- Sombras pronunciadas (`shadow-lg`, `shadow-xl`) — como mucho `shadow-sm` si hace falta una separación sutil, y solo con justificación concreta.
- Texto en mayúsculas para títulos (`uppercase`).
- Bordes redondeados exagerados tipo "pill" (`rounded-full`) salvo en badges.
- Gradientes, blur (`backdrop-blur`), glassmorphism, efectos de neón.

## 8. Responsividad (mobile-first)

GymTrack se usa principalmente desde el celular, dentro del gimnasio. Toda pantalla se diseña mobile-first y debe verse y funcionar bien en cualquier tamaño.

**Breakpoints:**
- Sin prefijo (mobile, por defecto): layout base, una sola columna, todo a `w-full`.
- `md:` (≥768px, tablet/desktop): ajustes de layout — más columnas en grids, `max-w-md` centrado para formularios, más padding.
- `lg:` (≥1024px, desktop grande): ajustes menores adicionales si hacen falta (ej. más columnas en un grid de progreso). No diseñar features exclusivas de `lg:` — es un ajuste, no un layout paralelo.
- No usar `sm:` como breakpoint principal de diseño — el diseño base ya es mobile-first sin prefijo; `sm:` queda disponible solo para un ajuste puntual entre mobile chico y tablet si surge un caso concreto.

**Reglas concretas:**
- Formularios y botones: `w-full` en mobile, con contenedor `max-w-md mx-auto` a partir de `md:` para que no se estiren a lo ancho completo en desktop.
- Tap targets (botones, inputs, elementos clickeables): mínimo `h-11` (44px) de alto siempre, sin importar el breakpoint.
- Cards y grids: una sola columna por defecto (`grid-cols-1`), múltiples columnas solo desde `md:` (ej. `md:grid-cols-2`).
- Ningún layout debe producir scroll horizontal en ningún tamaño de pantalla — evitar anchos fijos (`w-[Npx]`) y usar `max-w-full` / `overflow-x-hidden` donde haga falta contener contenido.
- Imágenes e iconos deben escalar proporcionalmente (`w-full h-auto` en imágenes; tamaños de icono en unidades relativas de Tabler como `size-5`/`size-6`, nunca px fijos que rompan el layout en pantallas chicas).

---

**Nota:** estas guías aplican a toda pantalla nueva que se cree en `src/pages/`. Cualquier componente de UI reutilizable (botón, input, card, badge, etc.) debe vivir en `src/components/ui/` para no repetir estilos entre pantallas — si una clase de Tailwind se repite 2+ veces en distintas pantallas, es señal de que falta extraer el componente ahí.
