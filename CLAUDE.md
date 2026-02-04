# CLAUDE.md - AI Assistant Guidelines for Inspector Project

This document provides comprehensive guidance for AI assistants working on this codebase.

## Project Overview

**Inspector** is a TypeScript monorepo application using **Robustive-ts** framework for building layered architecture applications based on robustness diagrams and use case scenarios.

- **Frontend**: Vue 3 + Vite + Vuetify + Axios
- **Backend**: Express 5 + Node-postgres + Passport (OpenID Connect)
- **Database**: PostgreSQL 16
- **Package Manager**: Yarn 4.1.1 (workspaces)

## Quick Commands

```bash
# Start development (frontend build watch + backend start)
yarn serve

# Build all packages
yarn build

# Format code
yarn format

# Lint and fix
yarn lint

# Backend only
yarn workspace backend start

# Frontend dev server
yarn workspace frontend dev

# Generate typed SQL queries (pgtyped)
yarn workspace backend pgtyped

# Database connection
psql --host=localhost --user=inspectoruser --db=inspectordb
```

## Directory Structure

```
.
├── containers/                    # Docker container files
│   └── postgres/                  # PostgreSQL DDL and init scripts
├── dist/                          # Build output
├── packages/                      # Yarn workspaces
│   ├── backend/                   # Backend package config
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── pgtyped.config.json    # SQL type generation config
│   └── frontend/                  # Frontend package config
│       ├── package.json
│       ├── tsconfig.app.json
│       └── vite.config.ts
├── public/                        # Static assets
├── src/
│   ├── dependencies/              # Infrastructure layer (data access)
│   │   └── postgres/              # PostgreSQL repositories and queries
│   ├── domain/                    # Domain layer (shared by frontend/backend)
│   │   ├── actors/                # Use case actors (AuthenticatedUser, Nobody, Service)
│   │   ├── errors/                # Domain error definitions
│   │   ├── models/                # Domain models
│   │   └── usecases/              # Use case scenario definitions
│   ├── implementation/            # Application layer
│   │   ├── backend/               # Backend implementation
│   │   │   ├── behaviors/         # Use case behaviors by domain
│   │   │   ├── controllers/       # Route definitions
│   │   │   ├── identityProviders/ # SSO providers
│   │   │   ├── middlewares/       # Express middlewares
│   │   │   ├── observers/         # Event observers
│   │   │   ├── sessionManagers/   # Session management (JWT/SessionStore)
│   │   │   └── main.ts            # Backend entry point
│   │   ├── frontend/              # Frontend implementation
│   │   │   ├── stores/            # State management and choreographies
│   │   │   └── interfaces.ts
│   │   └── shared/                # Shared implementation code
│   │       ├── config.ts          # Application configuration
│   │       └── scenarioDelegate.ts
│   └── presentation/              # Presentation layer (frontend only)
│       ├── assets/                # Vue assets
│       ├── components/            # Vue components
│       ├── plugins/               # Vue plugins (router, vuetify)
│       ├── views/                 # Page views
│       ├── App.vue                # Root Vue component
│       └── main.ts                # Frontend entry point
├── compose.yaml                   # Docker Compose for PostgreSQL
├── index.html                     # Frontend root HTML
└── package.json                   # Root package.json
```

## Architecture: Robustive-ts Layered Architecture

This project uses [Robustive-ts](https://github.com/Robustive/robustive-ts), a framework that expresses robustness diagrams and use case scenarios in code.

### Core Concepts

| Term | Definition |
|------|------------|
| **Usecase** | A goal-driven action by an actor |
| **Scene** | A contextual situation within a use case |
| **Scenario** | A sequence of scenes executed in a use case |
| **Behavior** | Concrete processing at a scene (no state change) |
| **Mutation** | Processing at a boundary scene (causes state change) |
| **Choreography** | Collection of behaviors and mutations for a use case |

### Layers

1. **Domain Layer** (`src/domain/`)
   - Domain knowledge, models, and use case scenarios
   - NO references to other layers
   - Dependencies are injected via interfaces
   - Shared by both frontend and backend

2. **Infrastructure Layer** (`src/dependencies/`)
   - Data store access logic (PostgreSQL)
   - Implements domain layer interfaces
   - Can only reference domain layer

3. **Application Layer** (`src/implementation/`)
   - Implements use case behaviors for each scene
   - Uses domain models
   - Separate implementations for frontend/backend

4. **Presentation Layer** (`src/presentation/`)
   - User interface (Vue components)
   - Frontend only
   - Can reference application and domain layers

## Layer Rules (CRITICAL)

AI assistants MUST follow these rules when generating/modifying code:

### Domain Layer (`src/domain/`)
- Define domain models and use case scenarios
- NO imports from other layers
- Use interfaces for data access (dependency injection)
- Referenced by both frontend and backend

### Infrastructure Layer (`src/dependencies/`)
- Implement domain interfaces
- Only import from domain layer
- Can be referenced by frontend and backend

### Application Layer (`src/implementation/`)
- Implement use case behaviors
- Only import from domain layer
- Separate frontend/backend implementations

### Presentation Layer (`src/presentation/`)
- Vue components and views
- Can import from application and domain layers
- Frontend only

## Path Aliases

```typescript
// Backend
@domain/*     -> src/domain/*
@backend/*    -> src/implementation/backend/*
@shared/*     -> src/implementation/shared/*

// Frontend
@domain/*     -> src/domain/*
@frontend/*   -> src/implementation/frontend/*
@shared/*     -> src/implementation/shared/*
```

## Implementation Patterns

### 1. Defining Use Case Scenes

Define scenes and their contexts as TypeScript types in `src/domain/usecases/`:

```typescript
export type BootScenes = {
  basics: {
    ユーザはサイトを開く: Empty
    システムはサインインセッションを確認する: { session: SessionData }
  }
  alternatives: {
    // Alternative course scenes
  }
  goals: {
    システムはホーム画面を表示する: { account: Account }
    システムはサインイン画面を表示する: Empty
  }
}
```

- `basics`: Basic course scenes
- `alternatives`: Alternative course scenes
- `goals`: Boundary scenes (final scenes of any course)

### 2. Implementing Choreography

```typescript
export function createBackendBootChoreography(...): Choreography<...> {
  const { basics: B, goals: G } = R.application.boot.keys

  const behavior = (scenario: Scenario<BootScenes>): Behavior<BootScenes> => {
    return {
      [B.ユーザはサイトを開く]: (): Promise<Context<BootScenes>> => {
        return scenario.just(scenario.basics.システムはサインインセッションを確認する(...))
      },
      // ... other behaviors
    }
  }

  const mutation: Mutation<BootScenes> = {
    [G.システムはホーム画面を表示する]: ({ account }) => {
      // State mutation logic
    }
  }

  return { behavior, mutation }
}
```

### 3. Frontend-Backend Communication (Usecase API)

Frontend uses `handOverToBackend` to delegate processing to backend:

```typescript
// Frontend
return handOverToBackend(
  scenario.basics.システムはサインインセッションを確認する({ session }),
  scenario
)
```

Backend handles via the robustive route:
```
/api/domain/:domain/usecase/:usecase/course/:course/scene/:scene
```

### 4. Frontend State Management

Use Vue's `ref`/`reactive` with `provide`/`inject`. Do NOT use Pinia or Vuex.

```typescript
// Service-level state in stores
const state = reactive<ApplicationState>({ ... })

// Page-level state in Vue files
const state = reactive({ ... })

// Inject service in components
const { helpers: { trigger } } = inject<FrontendService>(SERVICE_KEY)!
```

### 5. Triggering Use Cases

```vue
<script setup lang="ts">
import { R } from "@domain/usecases"

const { helpers: { trigger } } = inject<FrontendService>(SERVICE_KEY)!

const onClickSignIn = () => {
  trigger(R.authentication.signIn.basics.ユーザはサインインボタンを押下する())
}
</script>
```

## Code Style & Formatting

### Prettier Configuration
```json
{
  "singleQuote": false,
  "trailingComma": "none",
  "semi": false,
  "printWidth": 100
}
```

### ESLint Rules
- TypeScript recommended rules
- Vue essential rules (multi-word component names disabled)
- Unused variables: prefix with `_` for args, `__` for vars

### EditorConfig
- Line endings: LF
- Insert final newline: true
- Indent: 2 spaces for JS/JSON/YAML

## Database

- PostgreSQL 16 (Docker)
- Start: `docker compose up -d`
- Connection: `localhost:5432`, user: `inspectoruser`, db: `inspectordb`
- SQL type generation: Use pgtyped (`yarn workspace backend pgtyped`)

## Authentication

- Session management: JWT tokens or Express session store
- SSO: Google OpenID Connect (configured via environment)
- CSRF protection: Double-submit cookie pattern

## UI Design Guidelines

This project follows extensive UI/UX guidelines defined in `.agent/rules/`:

### Key Principles
- Keep it simple - minimize elements and information
- Make it easy - reduce steps and cognitive load
- Use mental models users understand
- Provide clear signifiers for interactive elements
- Maintain consistency in colors, shapes, layouts
- Give users control with undo/redo capabilities
- Provide feedback within 0.1-0.4 seconds
- Use progressive disclosure for complex features

### Psychology-Based Design
- Consider aesthetic-usability effect
- Use appropriate defaults (default bias)
- Respect cognitive load limits
- Apply loss aversion and scarcity appropriately
- Follow peak-end rule for user satisfaction

## Development Workflow

1. **Define Scenes**: Create type definitions in `src/domain/usecases/`
2. **Implement Choreography**: Create behavior/mutation in `src/implementation/`
3. **Register in Store**: Add choreography to appropriate store
4. **Register in Service**: Connect store to FrontendService/BackendService
5. **Trigger from UI**: Call use case from Vue components

## Important Notes for AI Assistants

1. **Always check file path** to determine if code is frontend or backend
2. **Never import across layers** except as specified in layer rules
3. **Scene names are in Japanese** - follow the existing naming convention
4. **Use `scenario.just()` or `scenario.respond()`** for returning contexts
5. **NoImplementationNeeded** for scenes that don't require backend logic
6. **Event-driven patterns** use EventBus for cross-cutting concerns
7. **SQL queries** should be defined in `.sql` files and typed with pgtyped

## File Locations Reference

| Purpose | Location |
|---------|----------|
| Domain models | `src/domain/models/` |
| Use case definitions | `src/domain/usecases/` |
| Backend behaviors | `src/implementation/backend/behaviors/` |
| Frontend stores | `src/implementation/frontend/stores/` |
| Vue components | `src/presentation/components/` |
| Page views | `src/presentation/views/` |
| SQL queries | `src/dependencies/postgres/sqls/` |
| Database repositories | `src/dependencies/postgres/repositories/` |
