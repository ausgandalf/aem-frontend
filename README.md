# WRBLO — Application Management (Frontend)

Next.js single-page app for WRBLO's grant application platform: public Quick Apply intake, applicant dashboard, self-service profile/settings, and the admin console (user & organization management). It talks to the Laravel API in `../backend` over cookie-based Sanctum auth.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI runtime | React 19 · TypeScript |
| Styling | Tailwind CSS v4 (CSS-variable theme tokens, light/dark) |
| Auth transport | Sanctum SPA — httpOnly session cookie + CSRF |

---

## Requirements

- Node.js **20+**
- The backend API running (default `http://localhost:8000`)

---

## Setup

```bash
cd frontend
npm install
```

Create `.env.local` pointing at the backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then run the dev server:

```bash
npm run dev        # http://localhost:3000
```

> Auth needs the backend up **and** its `SANCTUM_STATEFUL_DOMAINS` / `FRONTEND_URL` to include `localhost:3000` (see the backend README).

---

## Scripts

```bash
npm run dev     # dev server (Turbopack)
npm run build   # production build (also type-checks)
npm run start   # serve the production build
npm run lint    # ESLint
```

---

## Routes

Public (no shell):
```
/login   /signup   /forgot-password   /reset-password   /apply   (public Quick Apply)
```

Authenticated — grouped under the `(app)` route group, which renders the shared **AppShell** (sidebar + mobile hamburger, avatar menu):
```
/dashboard
/applications                 applicant dashboard (cards, edit/progress drawers)
/profile   /settings          self-service profile + change password
/admin/users                  admin: user management
/admin/organizations          admin: organization management
```

Sidebar items are role-gated (e.g. "My Applications" for applicants, admin items for admins).

---

## Auth model

- `lib/api.ts` wraps `fetch` with `credentials: 'include'`. Before any POST/PUT/PATCH/DELETE it calls `GET {API_URL}/sanctum/csrf-cookie` and sends the `X-XSRF-TOKEN` header — the standard Sanctum SPA flow.
- `context/AuthContext` loads the current user from `/api/me` on mount and exposes `login`, `logout`, `refresh`, plus `user` and `roles`.
- `AppShell` redirects unauthenticated visitors to `/login`; admin pages additionally redirect non-admins.

---

## Project layout

```
app/
  page.tsx                     landing / redirect
  login, signup,               public auth pages
  forgot-password, reset-password
  apply/                       public Quick Apply page
  (app)/                       authenticated route group
    layout.tsx                 wraps children in <AppShell>
    dashboard, profile, settings
    applications/              applicant dashboard + drawers
    admin/users/               list + UserDrawer + ChangePasswordModal
    admin/organizations/       list + OrganizationDrawer
components/
  AppShell, UserMenu, ThemeToggle, Spinner, OrganizationCombobox, Logo
  apply/                       shared Quick-Apply building blocks (reused by the
                               authenticated "New / Edit application" drawers):
                               QuickApplyForm, AboutYouStep, AboutOrganizationStep,
                               ProjectDetailsStep, AddressFields, LabelWithTip, tips.ts,
                               StatusBadge, ApplicationEditDrawer, ApplicationProgressDrawer,
                               types.ts, PublicOrganizationCombobox
context/                       AuthContext, RolesContext, ThemeContext
lib/                           api.ts (fetch + CSRF), useStages.ts
```

### Reuse note
The Quick Apply flow is component-driven. `QuickApplyForm` (public) and `ApplicationEditDrawer` (authenticated) share the same `AboutOrganizationStep` + `ProjectDetailsStep`; the drawer simply drops the "About You" step (`includeAboutYou={false}`) and swaps the single submit for **Save** / **Submit**.

---

## Theming

Colors are CSS variables defined in `app/globals.css` (`:root` for light, `.dark` for dark) and exposed to Tailwind as tokens like `bg-surface`, `text-text-primary`, `border-border-token`, `bg-primary`, `text-primary-text`. The theme toggle (`ThemeToggle`) switches light / system / dark by toggling the `.dark` class on `<html>`.

---

## Building on this

- **Add a page**: create `app/(app)/<name>/page.tsx` (authenticated) or `app/<name>/page.tsx` (public). Add a sidebar entry in `components/AppShell.tsx` if it should appear in nav.
- **Call the API**: always go through `api()` from `lib/api.ts` so cookies + CSRF are handled.
- **New form field**: the Quick Apply data shape and payload builder live in `components/apply/types.ts`.
