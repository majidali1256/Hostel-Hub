---
description: Project rules and coding standards for Hostel Hub - ALWAYS follow these rules
---

# Hostel Hub Project Rules

## MANDATORY Rules - Always Follow

### 1. Responsive Design
- All views MUST be mobile responsive
- Support mobile, tablet and desktop screen sizes
- Use responsive Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`

### 2. Dark Mode Support
- All views MUST be light and dark mode friendly
- Use `dark:` prefix for dark mode styles
- Based on user's system setting

### 3. TailwindCSS v4 Only
- Use TailwindCSS v4 utility classes ONLY
- DO NOT write custom CSS
- Use Tailwind color utility classes only
- DO NOT use custom colors

### 4. Typography
- Use Google Fonts (already installed)

### 5. Icons
- Use Lucide icons (already installed)
- Import from `lucide-react`

## Quick Reference

```tsx
// ✅ CORRECT - Responsive + Dark Mode
<div className="p-4 md:p-6 lg:p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ❌ WRONG - No responsive, no dark mode
<div className="p-4 bg-white text-gray-900">

// ✅ CORRECT - Lucide icon
import { Home, Users, Settings } from 'lucide-react';
<Home className="h-5 w-5" />

// ❌ WRONG - Inline SVG
<svg>...</svg>
```
