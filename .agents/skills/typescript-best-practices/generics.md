# Generics

Generics enable reusable, type-safe abstractions that work with any type while maintaining strict type checking.

## When to Use Generics

- **Avoid duplication** — same logic for multiple types
- **Enable type safety** — caller specifies type, TypeScript enforces it
- **Build abstractions** — utilities, hooks, API patterns

---

## Generic Functions

### ✅ GOOD: Basic Generic Function

```typescript
// Generic function: T can be any type
function getFirstItem<T>(items: T[]): T | undefined {
  return items[0];
}

// Usage: TypeScript infers T from argument
const firstScore: GolfScore | undefined = getFirstItem(scores);
const firstName: string | undefined = getFirstItem(names);

// Can also be explicit
const first = getFirstItem<User>(users);
```

**Why:**
- Single implementation handles any type
- Return type matches input element type
- No unnecessary `any` or casting

### ❌ AVOID: Duplicating for Each Type

```typescript
// ❌ DON'T: Repeat for each type
function getFirstScore(items: GolfScore[]): GolfScore | undefined {
  return items[0];
}

function getFirstUser(items: User[]): User | undefined {
  return items[0];
}

// vs. Generic version:
function getFirstItem<T>(items: T[]): T | undefined {
  return items[0];
}
```

---

## Generic Constraints

Constrain generic types when you need specific properties or behavior.

### ✅ GOOD: Constrained Generic with Extends

```typescript
// Constraint: T must have an id property
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Usage: Works with any type that has id
findById(scores, '123');
findById(users, '456');
findById([{ id: '1', name: 'test' }], '1'); // Works with objects that have id

// ❌ This would fail because string doesn't have id property
// findById(['a', 'b'], '123'); // TypeScript Error
```

### ✅ GOOD: Keyof Constraint

```typescript
// Generic function that picks a single property from an object
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const score: GolfScore = { id: '1', score: 42, played_at: '2026-01-01' };

// TypeScript knows the return type based on key
const id: string = getProperty(score, 'id');
const points: number = getProperty(score, 'score');

// ❌ TypeScript Error: 'invalid_prop' is not in GolfScore
// const val = getProperty(score, 'invalid_prop');
```

---

## Generic Interfaces

### ✅ GOOD: Generic Response Wrapper

```typescript
// Generic response type that wraps any data
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

// Usage: Type-safe responses for different endpoints
function handleScoresResponse(response: ApiResponse<GolfScore[]>): void {
  if (response.success && response.data) {
    console.log(`Fetched ${response.data.length} scores`);
  }
}

function handleUserResponse(response: ApiResponse<User>): void {
  if (response.success && response.data) {
    console.log(`User: ${response.data.email}`);
  }
}

// API routes use it
export async function GET(): Promise<Response> {
  const scores = await fetchScores();
  return NextResponse.json<ApiResponse<GolfScore[]>>({
    success: true,
    data: scores,
    metadata: { timestamp: new Date().toISOString(), requestId: 'req-123' },
  });
}
```

### ✅ GOOD: Generic Paginated Response

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Works with any data type
async function fetchPaginatedScores(page: number, pageSize: number): Promise<PaginatedResponse<GolfScore>> {
  const { data, count } = await supabase
    .from('golf_scores')
    .select('*', { count: 'exact' })
    .range((page - 1) * pageSize, page * pageSize - 1);
  
  return {
    items: data || [],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > page * pageSize,
  };
}

// Usage: Type-safe pagination for different entities
const scoresPaginated = await fetchPaginatedScores(1, 10);
// scoresPaginated.items is GolfScore[]
```

---

## Generic Hooks (React)

### ✅ GOOD: Generic Async Hook

```typescript
// Generic hook for fetching any data
function useFetch<T>(url: string) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    fetch(url)
      .then(r => r.json())
      .then((data: T) => {
        if (isMounted) setState({ data, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (isMounted) setState({ data: null, loading: false, error });
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return state;
}

// Usage: Type-safe data fetching
function ScoresComponent() {
  const { data: scores, loading, error } = useFetch<GolfScore[]>('/api/scores');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!scores) return <div>No data</div>;
  
  return (
    <div>
      {scores.map(score => (
        <div key={score.id}>{score.score}</div>
      ))}
    </div>
  );
}
```

---

## Generic Utility Functions

### ✅ GOOD: Generic Memoization

```typescript
// Generic memoization helper
function memoize<Args extends any[], R>(fn: (...args: Args) => R): (...args: Args) => R {
  const cache = new Map<string, R>();

  return (...args: Args): R => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Usage: Memoize expensive computations
function calculatePrizePool(activeUsers: number, amountPerUser: number): number {
  console.log('Calculating...');
  return activeUsers * amountPerUser * 0.40;
}

const memoizedCalculate = memoize(calculatePrizePool);

memoizedCalculate(100, 50); // Calculates: "Calculating..."
memoizedCalculate(100, 50); // Returns cached result (no log)
memoizedCalculate(100, 60); // Calculates again: different args
```

---

## Conditional Types

Use conditional types for complex type logic.

### ✅ GOOD: Conditional Type for API Paths

```typescript
// Map endpoint paths to response types
type ApiPathToResponse = {
  '/api/scores': GolfScore[];
  '/api/user': User;
  '/api/draws': Draw[];
};

// Return type depends on the path
type ResponseOf<Path extends keyof ApiPathToResponse> = ApiPathToResponse[Path];

async function fetchApi<Path extends keyof ApiPathToResponse>(path: Path): Promise<ResponseOf<Path>> {
  const response = await fetch(path);
  return response.json();
}

// Usage: Return type is inferred from path
const scores = await fetchApi('/api/scores'); // scores is GolfScore[]
const user = await fetchApi('/api/user'); // user is User
const draws = await fetchApi('/api/draws'); // draws is Draw[]

// ❌ Wrong path: TypeScript error
// const data = await fetchApi('/invalid/path');
```

---

## Generic Reduction Pattern

### ✅ GOOD: Generic Object Mapping

```typescript
// Transform properties of an object
function mapObject<T, U>(
  obj: Record<string, T>,
  transform: (value: T) => U
): Record<string, U> {
  const result: Record<string, U> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    result[key] = transform(value);
  }
  
  return result;
}

// Usage: Convert strings to numbers
const scoreStrings = { alice: '42', bob: '35', charlie: '41' };
const scoreNumbers = mapObject(scoreStrings, (s) => parseInt(s, 10));
// scoreNumbers: { alice: 42, bob: 35, charlie: 41 }
```

---

## Real-World Example: Type-Safe API Handler

```typescript
// Define API endpoints and their types
interface ApiEndpoints {
  'POST /api/scores': {
    request: Omit<GolfScore, 'id' | 'created_at'>;
    response: GolfScore;
  };
  'PATCH /api/user': {
    request: Partial<Omit<User, 'id' | 'created_at'>>;
    response: User;
  };
  'GET /api/draws': {
    request: undefined;
    response: Draw[];
  };
}

// Generic handler that ensures request/response match
async function apiCall<Method extends keyof ApiEndpoints>(
  method: Method,
  body?: ApiEndpoints[Method]['request']
): Promise<ApiEndpoints[Method]['response']> {
  const response = await fetch(`/api/${method.split(' ')[1]}`, {
    method: method.split(' ')[0],
    body: body ? JSON.stringify(body) : undefined,
  });
  
  return response.json();
}

// Usage: Type-safe request/response
const newScore = await apiCall('POST /api/scores', {
  score: 42,
  played_at: '2026-01-01',
});
// newScore is guaranteed to be GolfScore

const user = await apiCall('PATCH /api/user', {
  email: 'new@example.com',
});
// user is guaranteed to be User

// ❌ TypeScript Error: 'id' not allowed in request
// await apiCall('POST /api/scores', { score: 42, id: '123' });

// ❌ TypeScript Error: 'request' parameter required
// await apiCall('GET /api/draws'); // Missing undefined
```

---

## Anti-Patterns

### ❌ AVOID: Over-Constraining Generics

```typescript
// ❌ Too specific
function process<T extends { id: string; name: string; email: string; phone: string }>(items: T[]) {
  // This constraint is too tight
}

// ✅ Use keyof constraint instead
function process<T, K extends keyof T>(items: T[], key: K) {
  // Works with any object and any property
}
```

### ❌ AVOID: Generics When Concrete Type is Needed

```typescript
// ❌ Generic when specific type is fine
function calculateScoreAverage<T extends number[]>(scores: T): number {
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// ✅ Use concrete type
function calculateScoreAverage(scores: number[]): number {
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
```

### ❌ AVOID: Generic Type Parameters That Aren't Used

```typescript
// ❌ Generic parameter never used
function fetchData<T>(url: string): Promise<any> {
  // T is specified but never referenced in function body
  return fetch(url).then(r => r.json());
}

// ✅ Use generic in return type
function fetchData<T>(url: string): Promise<T> {
  return fetch(url).then(r => r.json());
}
```
