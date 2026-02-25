# RESPONDR Web

A React + Vite web application for RESPONDR — a role-based emergency response platform. Users authenticate via Firebase and are routed to a role-specific dashboard (resident or official).

## Tech Stack

- **React 19** with React Router v7
- **Firebase Authentication** (email/password)
- **Vite** for bundling and local development
- **Backend API** for user verification and role resolution

## Local Development

### Prerequisites

- Node.js 18+
- A Firebase project with Email/Password sign-in enabled
- A running RESPONDR backend API (default: `http://localhost:4000/api/v1`)

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the project root and fill in your values (see [Environment Variables](#environment-variables) below).

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Firebase project configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Backend API base URL
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

All `VITE_` prefixed variables are exposed to the client bundle by Vite.

## Authentication Flow

1. The user submits their email and password on the `/` (Login) page.
2. Firebase Authentication validates the credentials and returns a signed-in user.
3. The app retrieves a Firebase ID token from the user object.
4. The ID token is sent to the backend `GET /auth/me` endpoint as a `Bearer` token.
5. The backend verifies the token and returns the user record, including their **role** (`resident` or `official`).
6. The user and token are stored in `AuthContext` and the user is redirected to their role-specific dashboard.
7. On subsequent page loads, `onAuthStateChanged` re-runs steps 3–6 automatically so the session is restored without requiring a manual login.

## Role-Based Routing

| Role       | Path         | Component              |
|------------|--------------|------------------------|
| `resident` | `/resident`  | `ResidentDashboard`    |
| `official` | `/official`  | `OfficialDashboard`    |

Both routes are wrapped in `ProtectedRoute`, which redirects unauthenticated users to `/` and redirects users whose role doesn't match the required role back to `/`.

## Available Scripts

| Command           | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start the Vite development server  |
| `npm run build`   | Build for production               |
| `npm run preview` | Preview the production build       |
| `npm run lint`    | Run ESLint                         |

## Styling System (Web + Mobile Consistency)

- Web styling uses **Tailwind CSS** with a shared token preset from `../respondr-design-tokens/web-tailwind-preset.cjs`.
- Reusable UI primitives live in `src/components/ui/`.
- Avoid adding hardcoded colors and fonts in pages; update the token source first.

### Token update checklist

1. Update `../respondr-design-tokens/tokens.json`
2. Validate web UI (`npm run build`)
3. Sync mobile token mappings in `respondr-mobile/respondr-mobile/constants/theme.ts`
4. Verify status colors (`pending`, `verified`, `in_progress`, `resolved`, `rejected`)
