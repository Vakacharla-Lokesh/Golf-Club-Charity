# Avoiding `any`

The `any` type defeats TypeScript's safety. Use proper types, defaults, and type guards instead.

## Why `any` is Problematic

```typescript
// ❌ AVOID: any defeats type safety
function processScore(score: any) {
  return score * 2; // What if score is a string?
}

processScore("45"); // Returns "4545" (string concatenation, not math!)
processScore({ score: 45 }); // Returns NaN silently
```

**Consequences:**
- Compiler can't catch errors
- IDE autocomplete doesn't work
- Refactoring becomes risky
- Maintenance burden increases

---

## Function Parameters

Always type function parameters explicitly.

### ✅ GOOD: Explicit Parameter Types

```typescript
// Typed parameters
function removeExpiredScores(scores: GolfScore[], expiryDate: Date): GolfScore[] {
  return scores.filter(score => new Date(score.played_at) > expiryDate);
}

// Usage: IDE knows what to pass
const active = removeExpiredScores(allScores, new Date('2026-01-01'));
```

### ❌ AVOID: Implicit Any Parameters

```typescript
// ❌ Implicit any when no type is specified
function removeExpiredScores(scores, expiryDate) {
  return scores.filter(score => new Date(score.played_at) > expiryDate);
}

// ❌ Explicit any
function removeExpiredScores(scores: any, expiryDate: any) {
  // ...
}
```

---

## Function Return Types

Specify return types explicitly. Don't rely on inference.

### ✅ GOOD: Explicit Return Type

```typescript
// Clear what the function produces
function calculatePrizePool(activeUsers: number, amountPerUser: number): number {
  return activeUsers * amountPerUser * 0.40; // 40% goes to prize pool
}

const pool: number = calculatePrizePool(100, 50); // Type-safe
```

### ❌ AVOID: Implicit Return Types

```typescript
// ❌ Inferred return type is 'any'  
function calculatePrizePool(activeUsers, amountPerUser) {
  return activeUsers * amountPerUser * 0.40;
}

// ❌ Explicit any return
function calculatePrizePool(activeUsers: number, amountPerUser: number): any {
  return activeUsers * amountPerUser * 0.40;
}

// Now caller doesn't know it's a number
const pool = calculatePrizePool(100, 50);
pool.toFixed(2); // Looks OK, but pool could be anything
```

---

## Default Parameters

Provide default values for optional parameters to avoid implicit `any`.

### ✅ GOOD: Typed Default Parameters

```typescript
// Default value infers type
function createScore(score: number, playedAt: Date = new Date()): GolfScore {
  return {
    id: crypto.randomUUID(),
    score,
    played_at: playedAt.toISOString(),
  };
}

// Usage: Type is inferred from default
const s1 = createScore(42); // playedAt defaults to now
const s2 = createScore(42, new Date('2026-01-01')); // Explicit date
```

### ❌ AVOID: Untyped Optional Parameters

```typescript
// ❌ playedAt type is any
function createScore(score: number, playedAt?) {
  return {
    score,
    played_at: playedAt?.toISOString(), // playedAt could be anything
  };
}

// ❌ Explicit any
function createScore(score: number, playedAt: any = new Date()) {
  // ...
}
```

---

## Object Properties

Type object property accesses to avoid implicit `any`.

### ✅ GOOD: Typed Object Access

```typescript
// Define shape upfront
interface ApiResponse {
  success: boolean;
  data?: GolfScore[];
  error?: string;
}

async function fetchScores(): Promise<GolfScore[]> {
  const response: ApiResponse = await fetch('/api/scores').then(r => r.json());
  
  if (!response.success) {
    throw new Error(response.error || 'Unknown error');
  }
  
  return response.data || []; // Type is known, no any
}
```

### ❌ AVOID: Untyped Object Access

```typescript
// ❌ response is any
async function fetchScores() {
  const response = await fetch('/api/scores').then(r => r.json());
  
  // All properties are implicitly any
  if (response.success) {
    return response.data; // type is any
  }
}
```

---

## Array Operations

Type array contents to avoid `any` in mapped values.

### ✅ GOOD: Explicitly Type Array Contents

```typescript
function formatScores(scores: GolfScore[]): string[] {
  return scores.map((score): string => score.score.toString()); // Return type explicit
}

const formatted = formatScores(allScores); // formatted is string[]
```

### ❌ AVOID: Untyped Array Items

```typescript
// ❌ scores is any[]
function formatScores(scores) {
  return scores.map(score => score.score.toString());
}

// ❌ .map callback has implicit any parameter
function formatScores(scores: GolfScore[]) {
  return scores.map(score => score.score.toString());
  // score parameter type is inferred, which is fine here,
  // but should be explicit for clarity
}
```

---

## Async Functions

Always type async function returns, even if Promise-wrapped.

### ✅ GOOD: Explicit Promise Type

```typescript
async function getUser(id: string): Promise<User | null> {
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    return data;
  } catch {
    return null;
  }
}

// Usage: Type is known
const user = await getUser('123'); // user is User | null
if (user) {
  console.log(user.email); // Safe: user is not null
}
```

### ❌ AVOID: Untyped Async Returns

```typescript
// ❌ Return type is any
async function getUser(id: string) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  return data; // type is any
}

// ❌ Explicit any as Promise
async function getUser(id: string): Promise<any> {
  // ...
}
```

---

## Type Guards Instead of Type Casts

Use runtime checks instead of casting to `any` when uncertain.

### ✅ GOOD: Type Guard Function

```typescript
function isGolfScore(obj: any): obj is GolfScore {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.score === 'number' &&
    obj.score >= 1 &&
    obj.score <= 45
  );
}

function processUnknown(data: unknown): GolfScore | null {
  if (isGolfScore(data)) {
    return data; // TypeScript knows data is GolfScore here
  }
  return null;
}
```

### ❌ AVOID: Casting to `as any`

```typescript
// ❌ Cast to any defeats type checking
function processUnknown(data: unknown): GolfScore {
  return data as any; // Loses all type safety
}

// ❌ Using any for JSON parsing
const data: any = JSON.parse(jsonString);
const score: GolfScore = data; // Dangerous: data could be anything
```

---

## React Component Props

Type component props explicitly instead of using `any`.

### ✅ GOOD: Typed Component Props Interface

```typescript
interface CardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({ title, subtitle, children, onClick }: CardProps) {
  return (
    <div onClick={onClick}>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  );
}

// Usage: IDE autocomplete works
<Card title="Scores" subtitle="Your 5 recent scores">
  {/* children */}
</Card>
```

### ❌ AVOID: Using React.FC with any

```typescript
// ❌ React.FC<any> defeats type safety
const Card: React.FC<any> = (props) => {
  // props is any, IDE can't help
  return <div>{props.title}</div>;
};

// ❌ Props parameter untyped
export function Card(props) {
  return <div>{props.title}</div>;
}
```

---

## JSON Parsing

Never trust JSON data without type validation.

### ✅ GOOD: Parse with Validation

```typescript
import { z } from 'zod';

const ScoreSchema = z.object({
  score: z.number().int().min(1).max(45),
  played_at: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  const data = await req.json(); // data is any from JSON
  
  // Parse and validate
  const validated = ScoreSchema.parse(data); // Now typed as Inferred<typeof ScoreSchema>
  
  // Type is known for rest of function
  const insertResult = await supabase
    .from('golf_scores')
    .insert(validated);
}
```

### ❌ AVOID: Trusting JSON Directly

```typescript
// ❌ Never do this
export async function POST(req: NextRequest) {
  const data: any = await req.json();
  
  // Blindly insert unvalidated data
  const insertResult = await supabase
    .from('golf_scores')
    .insert(data);
}
```

---

## Review Checklist

When reviewing code for `any` usage:

- [ ] Function parameters have types (not implicit or explicit `any`)
- [ ] Function return types are explicit (not inferred)
- [ ] Object/array destructuring is typed
- [ ] React component props have defined interface
- [ ] Async function returns are `Promise<T>` not `Promise<any>`
-  [ ] JSON/API responses are parsed with validation (Zod, not `any`)
- [ ] No `as any` type casts (use type guards instead)
- [ ] No implicit `any` warnings from `noImplicitAny` in tsconfig
