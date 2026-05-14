# ID Card Design — Implementation Plan

## 1. Component Overview

**File:** `src/components/IdCard.jsx`

Single component with three rendering modes controlled by the `forceSide` prop:

| `forceSide` | Behavior |
|---|---|
| `"front"` | Renders only `FrontFace` (used for PDF capture) |
| `"back"` | Renders only `BackFace` (used for PDF capture) |
| `undefined` | Default — interactive 3D card, click to flip |

**Props:**
- `student` — object containing `name`, `matric_number`, `department`, `level`, `photo_url`
- `enrolledCourses` — array (unused in design, passed for parent convenience)
- `forceSide` — string or undefined

---

## 2. Interactive 3D Flip (default mode)

CSS `perspective` + `preserve-3d` creates the flip animation:

```
.id-card-scene
  perspective: 1200px

  .id-card-inner
    preserve-3d
    transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)

    &.flipped → rotateY(180deg)

    .id-card-container  (front face)
      backface-visibility: hidden

    .id-card-back  (back face)
      backface-visibility: hidden
      rotateY(180deg)  — starts hidden behind front
```

Click handler toggles `isFlipped` state. No drag or swipe — simple click flip.

---

## 3. Card Dimensions (CR80 Format)

Standard CR80 card size (85.6mm × 54mm) mapped to pixels:

- **Width:** 540px
- **Height:** 340px
- **Border-radius:** 12px
- **Box-shadow:** `0 8px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)`
- Overflow: hidden

Both faces are absolutely positioned within the inner wrapper.

---

## 4. Visual Design & Branding

### Fonts
- **Family:** Poppins (Google Fonts `@import` in `index.css`)
- Weights used: 300, 400, 500, 600, 800

### Colors
| Usage | Value |
|---|---|
| Primary (header) | `#12bca2` |
| Secondary (name, accents) | `#6d15df` |
| Card body gradient | `rgba(133, 217, 243, 0.84)` → `rgba(255, 255, 255, 0.625)` |
| Body text | `#333` |
| Labels | `#64748b` |
| Values | `#1e293b` |

### Card Background
Linear gradient layered underneath all content with `z-index` isolation via `isolation: isolate`.

---

## 5. Watermark Security Background

Repeated diagonal "MTU" text overlay as a visual anti-tamper feature:

- **Implementation:** Inline data-URI SVG embedded via CSS `background-image`
- **SVG params:** 120×120 viewBox, Poppins 800, secondary color `#6d15df`, rotated -45°
- **Sizing:** `200% × 200%` (covers full card with overflow)  
- **Position:** `z-index: 1` (behind content at `z-index: 10`)
- **Opacity:** 0.45
- **Print adjustment:** `print-color-adjust: exact` in `@media print`

---

## 6. Front Face Layout

### Header (`id-card-header`)
- Background: primary (`#12bca2`)
- Bottom border: 4px solid secondary (`#6d15df`)
- Text: white, center-aligned
  - Title: "MOUNTAIN TOP UNIVERSITY" (18px, 800 weight)
  - Subtitle: "STUDENT IDENTITY CARD" (12px, 500 weight)
- Padding: 10px
- `z-index: 10` above watermark

### Body (`id-card-body`)
- Flex row, padding 15px, gap 15px, center-aligned vertically
- `z-index: 10`

### Left — Photo (`id-card-left`)
- Fixed width: 130px
- Photo wrapper: 130×150px, border-radius 12px, shadow, overflow hidden
- `<img>` with `object-fit: cover`, no border

### Right — Details (`id-card-right`)
- Flex column, centered vertically
- Each row (`id-detail-row`): flex row, bottom dashed border 1.5px black
  - **Label** (40% width): uppercase, `#64748b`, 600 weight, 15px
  - **Value** (remaining space): right-aligned, `#1e293b`, 700 weight, word-wrap
- **Name row special:** value gets secondary color `#6d15df`, 800 weight, 16px

---

## 7. Back Face Layout

- White background (`#fff`)
- `justify-content: center`, `align-items: center`, text-align center
- Padding: 20px
- Border: `1px solid #e2e8f0`

### Content stack (top to bottom):
1. Ownership text: "This card remains the property..." (10px)
2. Full-width black banner: "MOUNTAIN TOP UNIVERSITY" (20px, white on black, 800 weight)
3. Warning: "This card must be in owner's possession..." (10px)
4. "IF FOUND, PLEASE RETURN TO:" (14px, bold)
5. Address: "Registry Department / Mountain Top University" (12px, `#444`)
6. Validity: `currentYear + 1` (14px, 800 weight, `#d32f2f`, uppercase)
7. CODE128 barcode with white background chip

### Barcode (`react-barcode`)
- Value: `window.location.origin + "/verify/" + student.id`
- Format: `CODE128`, width 0.7, height 40
- `displayValue: false`, transparent background

---

## 8. Responsive Scaling

The card has a fixed pixel size (540×340) that doesn't natively shrink. A scaler wrapper handles smaller viewports.

### Structure
```
id-card-responsive-wrapper  (centers card, overflow hidden)
  id-card-scaler  (transform-origin: center top)
    student-card + IdCard
```

### Breakpoints
| Viewport | Scale factor |
|---|---|
| > 580px | 1.0 (no transform) |
| ≤ 580px | 0.65 |
| ≤ 400px | 0.55 |

The scaler uses `transform-origin: center top` so the card shrinks from its center on small screens.

### Print mode overrides
```css
@media print {
  .id-card-inner { transform: none; transition: none; }
  .id-card-back { border: 1px solid #ccc; }
  .id-card-bg-pattern { print-color-adjust: exact; }
  button, .id-card-notice { display: none; }
}
```
