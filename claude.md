> This project was generated from the [Obytes React Native Template](https://github.com/obytes/react-native-template-obytes), a production-ready React Native starter with modern tooling and best practices.

## What: Technology Stack

- **Expo SDK 54** with React Native 0.81.5 - Managed React Native development
- **TypeScript** - Strict type safety throughout
- **Expo Router 6** - File-based routing (like Next.js)
- **TailwindCSS** via Uniwind/Nativewind - Utility-first styling for React Native
- **Zustand** - Lightweight global state management
- **React Query** - Server state and data fetching
- **TanStack Form + Zod** - Type-safe form handling and validation
- **MMKV** - Encrypted local storage
- **Jest + React Testing Library** - Unit testing

## What: Project Structure

```
src/
├── app/              # Expo Router file-based routes (add new routes here)
├── features/         # Feature modules - auth, feed, settings are EXAMPLES
├── components/ui/    # Pre-built UI components (button, input, modal, etc.)
├── lib/              # Pre-configured utilities (api, auth, i18n, storage)
├── translations/     # i18n files (en.json, ar.json - add more languages)
└── global.css        # TailwindCSS configuration

Root Files:
├── env.ts           # Environment config (CUSTOMIZE bundle IDs, API URLs)
├── app.config.ts    # Expo configuration
└── README.md        # Project-specific documentation
```

## How: Development Workflow

**Essential Commands:**
```bash
pnpm start              # Start dev server
pnpm ios/android        # Run on platform
pnpm lint               # ESLint check
pnpm type-check         # TypeScript validation
pnpm test               # Run Jest tests
pnpm check-all          # All quality checks
```

**Environment-Specific:**
```bash
pnpm start:preview              # Preview environment
pnpm ios:production             # Production iOS
pnpm build:production:ios       # EAS production build
```

## How: Key Patterns

- **Create features**: New folder in `src/features/[your-feature]/` with screens, components, API hooks
- **Add routes**: Create files in `src/app/` (file-based routing)
- **Forms**: Use TanStack Form + Zod (see `src/features/auth/components/login-form.tsx`)
- **Data fetching**: Use React Query (see `src/features/feed/api.ts`)
- **Global state**: Use Zustand (see `src/features/auth/use-auth-store.tsx`)
- **Styling**: NativeWind/Tailwind classes (see `src/components/ui/button.tsx`)
- **Storage**: Use MMKV via `src/lib/storage.tsx` for sensitive data
- **Imports**: Always use `@/` prefix, never relative imports

## How: Essential Rules

- ✅ **DO** use absolute imports: `@/components/ui/button`
- ✅ **DO** follow feature-based structure: `src/features/[name]/`
- ✅ **DO** use TanStack Form for forms (not react-hook-form)
- ✅ **DO** use MMKV storage for sensitive data (not AsyncStorage)
- ✅ **DO** use EAS Build for production: `pnpm build:production:ios`
- ✅ **DO** prefix env vars with `EXPO_PUBLIC_*` for app access
- ❌ **DO NOT** modify `android/` or `ios/` directly (use Expo config plugins)

## Component Architecture & State Management Guidelines

### 1. Component Responsibility Boundaries
- **UI / Presentational Components (Atomic UI)** (e.g. `src/components/ui/`):
  - Must remain **100% pure**.
  - Must only receive data and callbacks via `props`.
  - **Forbidden** from accessing global Zustand stores or invoking API query hooks directly.
- **Feature Components** (e.g. `src/features/converter/components/`):
  - Can read and write directly to/from feature-specific Zustand stores (e.g. `useConverterStore`) to reduce prop-drilling.
  - Sourced around a specific, modular business logic block.
- **Container / Screen Components** (e.g. `src/app/`):
  - Orchestrate layout by placing Feature Components.
  - Access TanStack Query hooks (`useQuery`, `useMutation`).
  - Manage route navigation and handle major page-level states (loaders, fallback errors).

### 2. State & Caching Patterns
- **Server State**: Managed strictly through TanStack Query (`useQuery`). Do not copy server state into local state or Zustand unless local edits/overrides are explicitly required.
- **Global Client State**: Use Zustand with `persist` middleware powered by `react-native-mmkv` to automatically save user configurations (e.g. chosen converter list, active base currency, settings, theme preferences) across app restarts.
- **Local UI State**: Use standard React `useState` for state scoped to a single component (e.g. modal search filter query).

### 3. Responsive Layout & Theming
- **Adaptive Layout**: Design components using Flexbox and Nativewind classes. Avoid hardcoding fixed heights/widths for containers to support various device aspect ratios. Wrap root screen views with `SafeAreaView` and use `FocusAwareStatusBar`.
- **Theming**: Define CSS variables in `global.css` for Light and Dark modes. Tailwind utility classes (e.g. `bg-surface`, `text-ink`, `border-line`) will automatically map to active theme styles.
- **Theme Selection**: Maintain a user settings control to toggle between Light, Dark, or System themes, persisted in the settings store.
- **Wallpaper Selection & Theming System**:
  - Implement the appearance settings store and a `ScreenBackground` container component to manage visual themes.
  - Create the default palette matching the prototype's `styles.css` variables:
    - **Light Mode**: `--bg: #F4F2EC`, `--surface: #FFFFFF`, `--surface-2: #F7F6F2`, `--ink: #0E0E10`, `--ink-mute: #6B7077`, `--line: rgba(14,14,16,0.07)`, `--accent: #FFD200`, `--chip: #F1EFE8`, etc.
    - **Dark Mode**: `--bg: #0A0A0C`, `--surface: #131316`, `--surface-2: #1B1B1F`, `--ink: #FAFAFA`, `--ink-mute: #9CA0A8`, `--line: rgba(255,255,255,0.07)`, `--accent: #FFD200`, `--chip: #1F1F23`, etc.
  - The default wallpaper is the flat solid theme background matching these CSS variables. The system structure should allow adding alternative wallpapers/skins in the settings in the future.

### 4. Precision & Rounding Rules
- **Dynamic Precision**: Format values in UI dynamically:
  - **Fiat**: 2 to 4 decimal places depending on settings.
  - **Crypto**: 6 to 8 decimal places for accuracy.
- **Precision Configuration**: Provide a global setting to adjust precision rounding, which must be referenced by formatting helpers.

### 5. Loading & UX UX/UI States
- **Initial Load**: Display a full screen skeleton loader on first API fetch.
- **Background Refresh**: Do not block the screen. Use silent indicators (e.g., small refresh indicators, spinner in header) or pull-to-refresh to fetch updates quietly.

### 6. Localization
- **No Hardcoded Strings**: Use the `i18next` framework immediately. Define all text keys inside JSON translation catalogs (`src/translations/`).

### 7. Code Style & Quality Compliance
- **Mandatory Quality Checks**: Run `pnpm run check-all` (which executes ESLint check, TypeScript validation, translation key matching, and Jest tests) before committing any changes.
- **Strict Function Length Limit**: The ESLint rule `max-lines-per-function` enforces a maximum of **110 lines** per function/component. Decompose complex screen components into small, modular sub-sections within the same file or a dedicated components folder.
- **TypeScript Import Rules**: Import named components in alphabetical order. Double-quotes must be used for string literals.
- **Ignore Generated Code**: Never manually edit auto-generated typing files (such as `uniwind-types.d.ts`). Add them to the ignores array in `eslint.config.mjs` if they violate linter rules.
- **React Performance & Lists**: Always use unique, stable identifiers (e.g. `item.id`, `item.name`) as `key` props when mapping arrays in React. Never use array index (`idx`) as keys.
- **Autofix Utilities**: Proactively execute `pnpm run lint --fix` to resolve standard spacing, indentation, quote usage, and import sorting issues.
