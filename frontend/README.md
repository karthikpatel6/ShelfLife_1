# ShelfLife Frontend

React + TypeScript (Vite) library management frontend interface.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios (typed with request/response interceptors)
- **UI & Styling**: Custom CSS with Dark Glassmorphism, HSL color tokens, Inter & Outfit typography
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## State Management Rationale & Architecture
For ShelfLife, state is managed using **Local Component State + React Context (for Authentication only)**.

### Why Context + Local State was chosen:
1. **Scope of Global State**: In this application, authentication (`token` and `user` profile) is the *only* truly global state required across multiple route trees.
2. **Server State vs Application State**: Book catalogs, inventory counts, and borrow histories represent **server state**. Fetching fresh data directly on component mount ensures accurate availability counts (especially critical after issuing/returning books).
3. **Simplicity & Zero Boilerplate**: Adding heavy state stores like Redux Toolkit or Zustand for a 4-page CRUD app introduces unnecessary complexity without performance benefits.

### When to Upgrade State Management:
We would upgrade to:
- **TanStack Query (React Query)**: If we add offline caching, automatic background polling/revalidation, or optimistic UI updates across multiple screens.
- **Zustand or Redux**: If the app grows to support multi-step book reservation workflows, persistent cart/batch checkout drawers, or complex multi-filter dashboard state shared across unmounted components.

## Mock Mode
Set `VITE_USE_MOCK=true` in `.env` to run the frontend independently with mock data without connecting to a running backend.

## Commands
```bash
npm install
npm run dev     # Start Vite dev server on http://localhost:5173
npm run build   # Run TypeScript check (tsc) and Vite production build
```
