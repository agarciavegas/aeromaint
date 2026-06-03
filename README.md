# AeroMaint - Sistema de Gestión de Aeronavegabilidad

Aplicación web para la gestión integral del mantenimiento y aeronavegabilidad de aeronaves de aviación general.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-components-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)

## Características

- **Panel Principal** — Dashboard con estadísticas de cumplimiento, gráficos y órdenes recientes
- **Aeronaves** — Gestión de aeronaves con árbol jerárquico de partes y reglas de mantenimiento
- **Reglas de Mantenimiento** — Intervalos en horas, meses y ciclos (aterrizajes) con tracking automático
- **Órdenes de Trabajo** — Creación desde reglas seleccionadas o con items manuales
- **Modelos Predefinidos** — Plantillas de Cessna 172, Piper PA-28 y Beechcraft Bonanza
- **Cálculo de Cumplimiento** — Recálculo automático al actualizar horas/ciclos de vuelo
- **Referencias FAR** — Basado en normativas reales (FAR 91.409, 91.411, 91.413, 91.207)
- **Capítulos ATA** — Clasificación estándar de partes (ATA 61, 72, 73, 74, etc.)

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Base de Datos**: Prisma ORM con SQLite
- **UI**: shadcn/ui + Tailwind CSS 4
- **Gráficos**: Recharts
- **Estado**: Zustand
- **Lenguaje**: TypeScript 5

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/agarciavegas/aeromaint.git
cd aeromaint

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Crear la base de datos
npx prisma db push

# Cargar datos de ejemplo (opcional)
npx prisma db seed

# Iniciar en desarrollo
npm run dev
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/                    # API Routes REST
│   │   ├── aircraft/           # CRUD aeronaves
│   │   ├── models/             # CRUD modelos
│   │   ├── rules/              # CRUD reglas
│   │   ├── workorders/         # CRUD órdenes de trabajo
│   │   ├── stats/              # Estadísticas dashboard
│   │   └── seed/               # Carga de datos de ejemplo
│   ├── page.tsx                # Página principal
│   ├── layout.tsx              # Layout raíz
│   └── globals.css             # Estilos globales
├── components/
│   ├── airworthiness/          # Componentes de la aplicación
│   │   ├── dashboard-panel.tsx
│   │   ├── aircraft-panel.tsx
│   │   ├── aircraft-detail.tsx
│   │   ├── part-tree.tsx
│   │   ├── work-orders-panel.tsx
│   │   ├── models-panel.tsx
│   │   ├── rule-badge.tsx
│   │   ├── sidebar-nav.tsx
│   │   ├── create-aircraft-dialog.tsx
│   │   ├── create-work-order-dialog.tsx
│   │   └── update-hours-dialog.tsx
│   └── ui/                     # Componentes shadcn/ui
├── store/
│   └── app-store.ts            # Estado global (Zustand)
└── lib/
    ├── db.ts                   # Cliente Prisma
    └── utils.ts                # Utilidades

prisma/
├── schema.prisma               # Esquema de base de datos
└── seed.ts                     # Datos de ejemplo (3 modelos + 2 aeronaves)
```

## Modelo de Datos

```
AircraftModelTemplate ──┬── PartTemplate (jerárquico) ──── RuleTemplate
                        │
Aircraft ───────────────┬── Part (jerárquico) ──────────── Rule
                        │
                        └── WorkOrder ──── WorkOrderItem ── (Rule)
```

### Tipos de Reglas

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `hard_time` | Reemplazo/overhaul obligatorio | Overhaul motor cada 2000h |
| `on_condition` | Mantenimiento por condición | Cambio de aceite cada 50h |
| `inspection` | Inspección programada | Inspección anual cada 12 meses |

### Estados de Cumplimiento

| Estado | Color | Criterio |
|--------|-------|----------|
| `compliant` | 🟢 Verde | < 80% del intervalo |
| `due_soon` | 🟡 Amarillo | 80-100% del intervalo |
| `overdue` | 🔴 Rojo | > 100% del intervalo |

## Modelos Incluidos

### Cessna 172 Skyhawk
- Motor: Lycoming O-360-A4M (Overhaul 2000h / 12 años)
- Hélice: McCauley (Overhaul 2000h / 60 meses)
- Sub-partes: Carburador, Magnetos, Bomba de combustible

### Piper PA-28 Cherokee
- Motor: Lycoming O-320-E3D (Overhaul 2000h / 12 años)
- Hélice: Sensenich (Overhaul 2000h / 60 meses)

### Beechcraft Bonanza
- Motor: Continental IO-520-B (Overhaul 1700h / 12 años)
- Tren retráctil (Inspección 500h / Overhaul 3000h)
- Pernos del ala NDT cada 5 años

## Licencia

MIT
