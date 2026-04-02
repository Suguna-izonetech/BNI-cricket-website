# Cricket Score - IPL Themed Application

A modern, premium cricket score tracking application built with React, Vite, and Tailwind CSS featuring an IPL-inspired gold and navy theme.

## Tech Stack

- **React** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library (inspired)

## Color System

This project uses a sophisticated gold-based color system with IPL (Indian Premier League) themed colors. All colors are defined as CSS variables for easy theming and dark mode support.

### Primary Colors

| Color Name | CSS Variable | Hex Value | Usage |
|------------|--------------|-----------|-------|
| Primary | `--primary` | `#735C00` | Main brand color, primary buttons |
| Primary Light | `--primary-light` | `#D4AF37` | Highlights, accents, gradients |
| Secondary | `--secondary` | `#6D5D2F` | Secondary actions, muted elements |
| Accent | `--accent` | `#415BA4` | Links, highlights, focus states |
| Error | `--error` | `#BA1A1A` | Error states, delete actions |

### Background & Surface Colors

| Color Name | CSS Variable | Hex Value | Usage |
|------------|--------------|-----------|-------|
| Background | `--background` | `#FFF8F0` | Main background |
| Surface | `--surface` | `#FFF8F0` | Card and component backgrounds |
| Surface Dim | `--surface-dim` | `#E1D9CC` | Dimmed surfaces, secondary backgrounds |
| Dark Surface | `--dark-surface` | `#343027` | Dark mode backgrounds, shadows |

### Text Colors

| Color Name | CSS Variable | Hex Value | Usage |
|------------|--------------|-----------|-------|
| Text Main | `--text-main` | `#1F1B13` | Primary text, headings |
| Text Secondary | `--text-secondary` | `#4D4635` | Secondary text, captions |

## Color Palette Preview

```
Primary Colors:
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   #735C00   │ │   #D4AF37   │ │   #6D5D2F   │ │   #415BA4   │ │   #BA1A1A   │
│   Primary   │ │Primary Light│ │  Secondary  │ │    Accent   │ │    Error    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

Background & Surface:
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   #FFF8F0   │ │   #FFF8F0   │ │   #E1D9CC   │ │   #343027   │
│  Background │ │   Surface   │ │Surface Dim  │ │Dark Surface │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

Text Colors:
┌─────────────┐ ┌─────────────┐
│   #1F1B13   │ │   #4D4635   │
│  Text Main  │ │Text Secondary│
└─────────────┘ └─────────────┘
```

## Typography

The application uses a premium typography system:

| Element | Font Family | Weights |
|---------|-------------|---------|
| Headings | Oswald | 400, 500, 600, 700 |
| Body | Inter | 400, 500, 600, 700 |
| Display/Premium | Bebas Neue, Oswald, Teko | 600, 700 |

## Custom CSS Classes

### Utility Classes

- `.text-gradient-gold` - Gold gradient text effect
- `.bg-gradient-card` - Premium card background gradient
- `.glow-gold` - Gold glow shadow effect
- `.gold-panel` - Premium panel with border and shadow
- `.gold-button` - Primary gold button with hover effects
- `.gold-outline-button` - Outlined gold button
- `.font-premium` - Premium display font with letter-spacing

### Animation Classes

- `.animate-vs-clash` - VS clash animation for match headers
- `.animate-team-left` - Team entry animation from left
- `.animate-team-right` - Team entry animation from right

## Project Structure

```
cricket-score/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── index.css       # Global styles and CSS variables
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── tailwind.config.js  # Tailwind configuration
├── vite.config.js      # Vite configuration
└── tsconfig.json       # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Design Philosophy

This application embodies a **premium, gold-themed design language** inspired by the IPL (Indian Premier League) branding. The color system is built around warm gold tones (`#D4AF37`, `#735C00`) contrasted with deep navy blues (`#415BA4`) to create a luxurious, sports-centric aesthetic.

Key design principles:
- **Premium Feel**: Gold gradients and subtle shadows create depth
- **High Contrast**: Ensures readability with dark text on light backgrounds
- **Consistent Spacing**: Uses Tailwind's spacing scale for rhythm
- **Smooth Animations**: Subtle transitions and entrance animations
- **Responsive**: Mobile-first design with breakpoints for all screen sizes

## Dark Mode

The application supports dark mode via the `dark:` class on the root element. All colors are defined as CSS variables that can be easily swapped for dark mode variants.

## License

MIT