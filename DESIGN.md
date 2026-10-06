---
version: "1.0.0"
name: "Rimjhim Roams Design System"
description: "Editorial travel intelligence system combining serene monsoon warmth, Indian geographic heritage, crisp typographic contrast, and GPU-accelerated spatial mapping."
colors:
  primary: "#0f172a"
  primary-hover: "#1e293b"
  primary-subtle: "#f1f5f9"
  accent-blue: "#2563eb"
  accent-blue-hover: "#1d4ed8"
  accent-blue-subtle: "#eff6ff"
  monsoon-teal: "#0d9488"
  warm-amber: "#d97706"
  surface-page: "#f8fafc"
  surface-card: "#ffffff"
  surface-elevated: "#ffffff"
  surface-muted: "#f1f5f9"
  surface-dark: "#0b0f19"
  text-primary: "#0f172a"
  text-secondary: "#334155"
  text-muted: "#64748b"
  text-on-primary: "#ffffff"
  border-default: "#e2e8f0"
  border-subtle: "#f1f5f9"
  border-strong: "#cbd5e1"
  safety-optimal: "#10b981"
  safety-caution: "#f59e0b"
  safety-alert: "#ef4444"
  emergency-crimson: "#dc2626"
  lost-mode-orange: "#ea580c"
  weather-sunny: "#f59e0b"
  weather-rainy: "#0284c7"
  weather-aqi-good: "#10b981"
  weather-aqi-moderate: "#f59e0b"
  weather-aqi-poor: "#ef4444"
typography:
  display-hero:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "56px"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  display-title:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  heading-1:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  heading-2:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  heading-3:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.01em"
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.005em"
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0em"
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.05em"
  mono-stat:
    fontFamily: "JetBrains Mono, SF Mono, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.02em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "28px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  24: "96px"
elevation:
  none: "none"
  subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)"
  card: "0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 2px 4px -2px rgba(15, 23, 42, 0.04)"
  dropdown: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)"
  modal: "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)"
components:
  button-primary:
    background: "{colors.primary}"
    text: "{colors.text-on-primary}"
    borderRadius: "{rounded.full}"
    padding: "10px 22px"
    hoverBackground: "{colors.primary-hover}"
  button-secondary:
    background: "{colors.surface-card}"
    border: "1px solid {colors.border-default}"
    text: "{colors.text-primary}"
    borderRadius: "{rounded.full}"
    padding: "9px 20px"
  pill-badge:
    borderRadius: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.caption}"
  card-itinerary:
    background: "{colors.surface-card}"
    border: "1px solid {colors.border-default}"
    borderRadius: "{rounded.xl}"
    boxShadow: "{elevation.card}"
  map-popup:
    background: "rgba(255, 255, 255, 0.98)"
    backdropFilter: "blur(12px)"
    border: "1px solid {colors.border-default}"
    borderRadius: "{rounded.lg}"
    boxShadow: "{elevation.dropdown}"
---

# Rimjhim Roams Design System

> **Spec Version**: 1.0.0  
> **Standard**: Google Stitch / Design Extractor (`DESIGN.md`) Specification  
> **Consuming Agents**: Claude, Cursor, Google Antigravity, GitHub Copilot

---

## 1. Overview

**Rimjhim Roams** (*रिमझिम* — Hindi for gentle, refreshing raindrops) is an AI-orchestrated travel intelligence platform for discovering, navigating, and planning immersive journeys across the Indian subcontinent and global destinations.

### Brand Character & Aesthetic Anchor
- **Serene Editorial Warmth**: Combines classic travel literature elegance (*Instrument Serif* display headlines) with crisp, high-density modern tooling (*Inter* body copy).
- **Subtle Monsoon Tone**: Crisp cool slates, translucent glassmorphic surfaces, and fresh accents reflecting morning moisture and coastal tranquility.
- **Calm, High-Utility Decision Support**: Avoids chaotic dashboard clutter. Focuses on spatial clarity (MapLibre GL JS interactive maps), deterministic budgets, and decisive traveler safety modes (*"I'm Lost"*, *"Emergency"*, *"Place Comfort"*).

---

## 2. Colors

The color palette is anchored in a neutral-first hierarchy with restrained, purposeful accents:

### Surface & Canvas
- **Page Background (`#f8fafc`)**: Crisp, soothing slate canvas that reduces screen fatigue.
- **Card Surface (`#ffffff`)**: Pure white elevated panels providing high contrast for itineraries and transit nodes.
- **Dark Mode Surface (`#0b0f19`)**: Deep obsidian-navy night canvas for evening route planning and high-contrast night maps.

### Brand Primaries & Accents
- **Primary Charcoal (`#0f172a`)**: Dominant action surface for primary CTAs, main titles, and active nav items.
- **Accent Azure (`#2563eb`)**: Reserved for live GPS coordinates, active map routes, and links.
- **Monsoon Teal (`#0d9488`)**: Cultural circuits, eco-stays, and regenerative travel tags.

### Specialized Safety & Mode Signaling
- **Emergency Crimson (`#dc2626`)**: Exclusive to the **Emergency Mode** button, hospital markers, and critical advisories.
- **Lost Mode Amber (`#ea580c`)**: Exclusive to the **"I'm Lost / What Now?"** guidance flow.
- **Optimal Comfort Emerald (`#10b981`)**: Positive place safety ratings, open attractions, and good air quality (AQI < 50).
- **Caution Yellow (`#f59e0b`)**: Moderate weather concerns, high crowd density, and closing-soon sights.

---

## 3. Typography

The typographic hierarchy pairs an editorial serif with a high-legibility sans-serif:

| Role | Font Family | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| **Display Hero** | Instrument Serif | 56px | 400 (Regular) | 1.05 | Landing page hero titles, destination title cards |
| **Display Title** | Instrument Serif | 36px | 400 (Regular) | 1.15 | Section anchors, modal titles, day headers |
| **Heading 1** | Inter | 28px | 700 (Bold) | 1.20 | Workspace views, trip overview headers |
| **Heading 2** | Inter | 20px | 600 (Semibold) | 1.30 | Card headers, itinerary block groupings |
| **Heading 3** | Inter | 16px | 600 (Semibold) | 1.40 | Activity titles, hotel names, transit items |
| **Body Large** | Inter | 16px | 400 (Regular) | 1.60 | Destination descriptions, AI copilot answers |
| **Body Standard**| Inter | 14px | 400 (Regular) | 1.50 | Default interface copy, itinerary notes |
| **Caption / Tag**| Inter | 11px | 600 (Semibold) | 1.30 | Category badges, distance tags, pace indicators |
| **Mono Metric** | JetBrains Mono | 13px | 500 (Medium) | 1.40 | Travel times, currency prices, GPS lat/lng |

---

## 4. Layout & Spacing

### 8px Spatial Grid
All margins, paddings, and component heights adhere to an 8px base rhythm:
`4px (0.5x)`, `8px (1x)`, `12px (1.5x)`, `16px (2x)`, `24px (3x)`, `32px (4x)`, `48px (6x)`, `64px (8x)`.

### Grid & Containers
- **Content Max Width**: `1440px` for wide exploratory map views; `1024px` for itinerary workspaces; `720px` for focused narrative articles.
- **Gutters**: `16px` on mobile screens (`<640px`); `24px` on tablet (`640px–1024px`); `32px` on desktop (`>1024px`).
- **Interactive Map Split View**: 55% interactive map canvas on desktop, 45% contextual timeline card drawer.

---

## 5. Elevation & Depth

Rimjhim Roams adopts a **border-first, ambient-shadow depth model**:
- Depth is primarily expressed through subtle border delineation (`1px solid #e2e8f0`) rather than deep drop shadows.
- Ambient shadows are soft and multi-layered (`rgba(15, 23, 42, 0.04)` to `rgba(15, 23, 42, 0.08)`).
- Floating components (MapLibre zoom controls, Lost Mode trigger, navigation bars) use **frosted glassmorphism** with `backdrop-filter: blur(12px)`.

---

## 6. Shapes & Border Radii

A dual-radius language balances warmth and utility:
- **Pills (`rounded-full: 9999px`)**: Interactive buttons, category filter chips, search input containers, and badges.
- **Soft Cards (`rounded-2xl: 20px–24px`)**: Destination cards, day itinerary containers, weather advisory panels.
- **Micro Elements (`rounded-md: 6px–8px`)**: Checkboxes, status dots, icon badges, and timeline connectors.

---

## 7. Components

### 1. Primary Action Buttons
- Full pill radius (`rounded-full`), solid `#0f172a` fill, white text, subtle hover lift (`hover:scale-[1.02] active:scale-[0.98]`).
- Focus rings: 2px offset with `#0f172a`.

### 2. Emergency Mode & Lost Mode Controls
- **🚨 EMERGENCY Button**: Persistent crimson-accented action, high contrast, triggering hospital/police/consulate routing without blocking core UI.
- **🆘 I'm Lost Button**: Amber-tinted quick trigger providing immediate step-by-step reorientation to the next waypoint.

### 3. MapLibre GL JS Overlay
- Map markers utilize category-specific micro-badges (🏨 Hotel, 📍 Attraction, 🍽️ Dining, ✈️ Airport, 🚆 Railway).
- Route polylines use vibrant blue (`#2563eb`) with a translucent halo for high visibility across satellite and terrain layers.

### 4. Place Comfort & Safety Badges
- Display transparent underlying signals: Crowd level, Late-night access, Transit density, Weather concern.
- Clearly states: *"Decision-support guidance, not authoritative emergency directive"*.

---

## 8. Do's and Don'ts

### ✅ Do
- **Always preserve non-interference**: When adding features, respect the token values in this specification.
- **Always include fallback stores**: All remote data operations must gracefully degrade to offline/memory stores.
- **Prioritize accessible contrast**: Ensure text meets WCAG AA 4.5:1 contrast against any background.
- **Use tabular numbers (`tabular-nums`)** for all budget figures, departure clocks, and distances.

### ❌ Don't
- **Never claim authoritative safety scores**: Present comfort signals objectively with underlying data sources.
- **Don't mix sharp (0px) and rounded (20px) card corners** in the same interface view.
- **Never use saturated neon backgrounds** for content cards; reserve high saturation exclusively for emergency and map route cues.
- **Don't hardcode arbitrary colors** outside the semantic tokens defined in this `DESIGN.md`.
