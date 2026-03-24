---
name: typescript-best-practices
description: "TypeScript best practices for Golf Charity Platform. Use when: writing type definitions, creating reusable components, designing APIs, avoiding type errors. Covers modularity, proper typing, utility types, generics, and avoiding `any`."
---

# TypeScript Best Practices

Follows Golf Charity Platform standards for type-safe, modular, and maintainable TypeScript code.

## When to Use

- Writing API route handlers or type-safe responses
- Creating reusable components with prop interfaces
- Designing database query results
- Implementing complex type logic (generics, utility types)
- Avoiding `any` types and improving type safety
- Structuring domain entities and forms

## Core Principles

1. **Type everything** — no implicit `any` types
2. **Compose types** — use utility types (Partial, Omit, Pick, Record, etc.)
3. **Modularity** — export named types, group related types together
4. **Generics for reuse** — avoid code duplication with proper generic constraints
5. **Strict mode** — `strict: true` in `tsconfig.json`

---

## Quick Reference

| Scenario | Pattern | Link |
|----------|---------|------|
| Defining component props | Interface with focused properties | [types-and-interfaces.md](./types-and-interfaces.md) |
| Reusing parts of a type | `Partial`, `Omit`, `Pick` | [utility-types.md](./utility-types.md) |
| Eliminating implicit `any` | Default parameters, return types | [avoiding-any.md](./avoiding-any.md) |
| Abstracting over types | Generic functions, constraints | [generics.md](./generics.md) |
| Organizing code | Named exports, module boundaries | [imports-and-modularity.md](./imports-and-modularity.md) |

---

## Essential Files

See the reference docs for detailed examples and anti-patterns:

- **[types-and-interfaces.md](./types-and-interfaces.md)** — Define interfaces for components, APIs, and domain models
- **[utility-types.md](./utility-types.md)** — Use `Partial`, `Omit`, `Pick`, `Readonly`, `Record`, `Extract`, `Exclude`
- **[avoiding-any.md](./avoiding-any.md)** — Eliminate implicit `any` with defaults, return types, and type guards
- **[generics.md](./generics.md)** — Build reusable functions and components with generic constraints
- **[imports-and-modularity.md](./imports-and-modularity.md)** — Organize types and exports for scalability

---

## Common Patterns

### ✅ Type Component Props Tightly

```typescript
// ✅ GOOD: Focused, strict typing
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', isLoading, children, ...props }: ButtonProps) {
  // ...
}
```

### ❌ AVOID: Over-General Interfaces

```typescript
// ❌ AVOID: Too loose
interface ButtonProps {
  [key: string]: any;
  onClick?: any;
}
```

### ✅ Use Utility Types for Common Patterns

```typescript
// ✅ GOOD: Compose types with utilities
type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
type ReadonlyUser = Readonly<User>;
type UserKeys = keyof User; // 'id' | 'email' | 'name' | ...
```

### ❌ AVOID: Repeating Full Type Definitions

```typescript
// ❌ AVOID: Duplicated properties
interface UserUpdate {
  email?: string;
  name?: string;
  phone?: string;
}
// Just use Partial<Omit<User, 'id' | 'created_at'>>
```

### ✅ Generic Functions for Reuse

```typescript
// ✅ GOOD: Generic with constraints
function fetchData<T extends BaseEntity>(endpoint: string): Promise<T[]> {
  return fetch(endpoint).then(r => r.json());
}

interface User extends BaseEntity {
  id: string;
  email: string;
}

const users = await fetchData<User>('/api/users');
```

---

## TypeScript Configuration (tsconfig.json)

Enforce strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## Review Checklist

When reviewing TypeScript code or writing new features:

- [ ] No implicit `any` types — explicit types on all declarations
- [ ] Function parameters have type annotations
- [ ] Function return types are explicit (not inferred)
- [ ] Interfaces are focused (not bloated with optional fields)
- [ ] Utility types (`Partial`, `Omit`, etc.) are used where applicable
- [ ] Generics avoid duplication without over-complicating
- [ ] Exports are named, not default (except for React components)
- [ ] No unused imports or type definitions
- [ ] Readonly prevents accidental mutations where appropriate

---

## Next Steps

- Review [types-and-interfaces.md](./types-and-interfaces.md) for component & function prop patterns
- Check [utility-types.md](./utility-types.md) for type composition strategies
- Explore [generics.md](./generics.md) for building reusable abstractions
