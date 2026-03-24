# Imports and Modularity

Organize types, functions, and exports for scalability and clarity.

## Named Exports vs Default Exports

### ✅ GOOD: Named Exports for Utilities

```typescript
// lib/types.ts
export interface GolfScore {
  id: string;
  score: number;
  played_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export type UserId = string & { readonly brand: 'UserId' };
export type ScoreId = string & { readonly brand: 'ScoreId' };
```

**Why:**
- Multiple imports possible: `import { GolfScore, User } from 'lib/types'`
- Refactoring shows all usages (IDE can rename safely)
- Tree-shaking removes unused exports
- Clear what each export is

### ❌ AVOID: Default Export for Utilities

```typescript
// ❌ DON'T: Default export for types
export default interface GolfScore {
  // ...
}

// Usage is awkward
import GolfScore from 'lib/types'; // What is GolfScore? Unclear
```

---

## Export Organization

### ✅ GOOD: Central Types File

```typescript
// lib/types.ts — Single source of truth
export interface GolfScore {
  id: string;
  score: number; // 1-45
  played_at: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  subscription_status: 'active' | 'inactive';
}

export interface Draw {
  id: string;
  draw_date: string;
  winning_numbers: number[];
}

export type ApiError = {
  code: string;
  message: string;
};

// Utilities for these types
export type ScoreUpdate = Partial<Omit<GolfScore, 'id' | 'created_at'>>;
export type UserPublic = Pick<User, 'id' | 'full_name'>;
```

**Usage throughout codebase:**
```typescript
import type { GolfScore, User, Draw, ApiError, ScoreUpdate } from 'lib/types';

// All types come from one place
```

---

## lib/index.ts Pattern

Create an index file to re-export commonly used exports:

```typescript
// lib/index.ts
export { GolfScore, User, Draw } from './types';
export { supabase } from './db';
export { useAuth } from './hooks';
export { validateScore } from './validators';
```

**Usage:**
```typescript
// Import multiple exports from one line
import { GolfScore, supabase, useAuth } from 'lib';
```

---

## Organize Related Functions

### ✅ GOOD: Group Related Functions in Modules

```typescript
// lib/api-helpers.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse(code: string, message: string): ApiResponse<never> {
  return { success: false, error: { code, message } };
}

export function throwApiError(status: number, code: string, message: string): never {
  throw new Error(JSON.stringify({ status, code, message }));
}
```

**Usage in route handler:**
```typescript
import { ApiResponse, successResponse, errorResponse } from 'lib/api-helpers';

export async function GET(): Promise<Response> {
  try {
    const data = await fetchData();
    return NextResponse.json(successResponse(data));
  } catch (err) {
    return NextResponse.json(errorResponse('FETCH_ERROR', 'Failed to fetch'), { status: 500 });
  }
}
```

---

## Import Organization

Order imports logically at the top of files:

```typescript
// 1. External packages
import { useEffect, useState } from 'react';
import { NextRequest, NextResponse } from 'next/server';

// 2. Internal types
import type { GolfScore, User } from 'lib/types';

// 3. Internal utilities
import { supabase } from 'lib/db';
import { validateScore } from 'lib/validators';

// 4. Components
import { Card } from 'components/ui/Card';

// 5. Styles (if not Tailwind)
import styles from './MyComponent.module.css';
```

---

## Re-export Pattern for API Routes

### ✅ GOOD: Domain-Scoped API Exports

```typescript
// app/api/scores/index.ts (or route.ts)
import { GolfScore } from 'lib/types';
import { supabase } from 'lib/db';

export async function GET(req: NextRequest) {
  const scores = await supabase.from('golf_scores').select('*');
  return NextResponse.json(scores);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase.from('golf_scores').insert(body);
  return NextResponse.json({ data, error });
}
```

**Not exported:** Implementation details. Only `GET` and `POST` are used by Next.js.

---

## Barrel Exports (Careful!)

### ⚠️ USE SPARINGLY: Barrel Exports Can Inflate Bundle Size

```typescript
// components/ui/index.ts — Re-export all UI components
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export { Modal } from './Modal';
```

**Pro:** Shorter import statements
```typescript
import { Button, Input, Card } from 'components/ui';
```

**Con:** Entire `components/ui` module loads even if you only use `Button`

**Better approach:** Import directly
```typescript
import { Button } from 'components/ui/Button';
```

---

## Avoid Circular Imports

### ❌ AVOID: Circular Dependencies

```typescript
// lib/helpers.ts
import { User } from './types'; // types.ts imports CAN'T also import helpers
import { formatUser } from './formatters'; // ❌ RISK: formatters might import types, types imports helpers = cycle

export function createUser(email: string): User {
  // ...
}

// lib/formatters.ts
import { User } from './types'; // ❌ If types also imports from helpers, this is circular
```

**Rule:** Dependency should flow one direction:
```
components → hooks → lib/utilities → lib/types
```

Never have types import from utilities, or utilities import components.

---

## Import Type Annotation

### ✅ GOOD: Use `import type` for Type-Only Imports

```typescript
// This import is only for TypeScript — removed at build time
import type { GolfScore, User } from 'lib/types';

interface ScoresResponse {
  scores: GolfScore[];
  user: User;
}

// No value imported here, only types
```

**Why:**
- Signals "this is only for type-checking"
- Improves bundle size (no runtime import)
- prevents accidental circular imports

### ❌ AVOID: Mixing Runtime and Type Imports

```typescript
// ❌ Unclear which parts are types vs values
import { GolfScore, validateScore } from 'lib/types';

// GolfScore is type-only, validateScore is a function
// Better to separate:
import type { GolfScore } from 'lib/types';
import { validateScore } from 'lib/validators';
```

---

## Real-World Module Structure

```typescript
// lib/types.ts — All type definitions
export interface GolfScore { /* ... */ }
export interface User { /* ... */ }
export type ScoreUpdate = Partial<Omit<GolfScore, 'id'>>;

// lib/db.ts — Database client
export const supabase = createClient(...);

// lib/validators.ts — Input validation
import type { GolfScore } from './types';
export function validateScore(score: unknown): score is GolfScore { /* ... */ }

// lib/api-helpers.ts — API utilities
import type { GolfScore } from './types';
export function successResponse<T>(data: T): ApiResponse<T> { /* ... */ }

// app/api/scores/route.ts — Route handler
import type { GolfScore } from 'lib/types';
import { supabase } from 'lib/db';
import { validateScore } from 'lib/validators';
import { successResponse, errorResponse } from 'lib/api-helpers';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!validateScore(body)) {
    return NextResponse.json(errorResponse('INVALID_SCORE', 'Score must be 1-45'), { status: 400 });
  }
  const { data } = await supabase.from('golf_scores').insert(body);
  return NextResponse.json(successResponse(data));
}
```

---

## Import Path Aliases

### ✅ GOOD: Use TypeScript Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/lib/*": ["./lib/*"],
      "@/components/*": ["./components/*"],
      "@/app/*": ["./app/*"]
    }
  }
}
```

**Usage:**
```typescript
import { GolfScore } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/db';
```

**Benefits:**
- No relative imports (`../../../../lib/types` → `@/lib/types`)
- Moves/renames are easier (IDE refactoring works)
- More readable

---

## Bundle Analysis

Check what's being imported:

```bash
# Analyze bundle size
npm run build  # Next.js build

# or use interactive analyzer
npm install --save-dev webpack-bundle-analyzer
```

**Look for:**
- Unused exports being included
- Circular dependency chains
- Heavy dependencies in unexpected places

---

## Review Checklist

- [ ] No `import * as` (use specific named imports)
- [ ] No default exports for utilities (named exports only)
- [ ] `import type` used for type-only imports
- [ ] Path aliases configured and used consistently
- [ ] No circular import chains
- [ ] Related functions grouped in same module
- [ ] barrels used sparingly, with clear intent
- [ ] All imports ordered: external → types → internal → components
