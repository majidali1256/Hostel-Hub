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

## FYP Module List (Official — Always Reference)

This project is a Final Year Project (FYP) consisting of exactly **12 modules**. All development work must align with these modules. Never add features outside this scope without user approval.

1. **Authentication** — Registration, Login, Identity Verification, RBAC, Google OAuth, Password Recovery
2. **Admin and Moderation** — Platform Stats, User Management, Content Moderation Queue, System Settings, Reports Generation
3. **Property Listing** — Create/Edit Listings, Map Integration, Pricing/Amenities/Room Types, Activate/Deactivate, Photo/Video Upload
4. **Scheduling and Booking** — Availability Checking, Online Booking, Confirmation Tracking, Booking History, Cancellation
5. **Reviews and Trust System** — Star Ratings, View Reviews, Rating Stats, Edit/Delete Reviews, Trust Score
6. **Chat and Communication Hub** — Real-time Messaging, Conversation History, Unread Notifications, Chat Dashboard, Socket.io
7. **Search, Filter System and Recommendations** — NLP Smart Search, Advanced Filters, AI Recommendations, Map Search, Personalized Suggestions
8. **Payment Verification Module** — Bank Details, Receipt Upload, Verification Dashboard, Manual Instructions, Transaction Tracking
9. **Notifications Panel** — Real-time Push, Multi-channel Preferences, Type-specific Icons, Management Dashboard, Priority Alerts
10. **Price Guidance (Fair Rent)** — Feature Extraction, Price Prediction, Fairness Label, Area Benchmarks, Owner Hints
11. **Fraud Detection** — Trust Score, Fraud Reports, Identity Verification, Risk Score Display, Admin Fraud Dashboard
12. **Digital Agreements** — Agreement Generation, E-Signature Canvas, Preview/Download, Agreement History, Digital Contracts

