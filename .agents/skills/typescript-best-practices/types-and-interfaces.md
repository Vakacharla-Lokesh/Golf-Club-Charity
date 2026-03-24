# Types and Interfaces

Define focused, minimal interfaces that capture the intent of your code.

## Component Props Interfaces

Always create an interface for component props. Keep it focused — only include what the component actually uses.

### ✅ GOOD: Focused Props Interface

```typescript
interface ScoreInputProps {
  defaultValue?: number;
  onSubmit: (score: number) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function ScoreInput({ defaultValue = 0, onSubmit, isLoading, error }: ScoreInputProps) {
  // ...
}
```

**Why:**
- Props are explicitly named
- Easy to see what the component needs
- Helps callers understand requirements

### ❌ AVOID: Vague or Over-General Props

```typescript
// ❌ AVOID: Too loose
interface ScoreInputProps {
  [key: string]: any;
}

// ❌ AVOID: Inheriting unnecessary fields
interface ScoreInputProps extends React.PropsWithChildren {
  defaultValue?: number;
  onSubmit?: any;
}
```

## API Response Types

Create strict types for API responses to enable type-safe client code.

### ✅ GOOD: Structured Response Type

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface ScoreResult {
  id: string;
  score: number;
  playedAt: string;
}

// Usage in API route
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const scores = await fetchScores();
    return NextResponse.json<ApiResponse<ScoreResult[]>>({
      success: true,
      data: scores,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch scores' },
    }, { status: 500 });
  }
}
```

### ❌ AVOID: Untyped Responses

```typescript
// ❌ AVOID: Returns any
export async function GET(req: NextRequest) {
  const scores = await fetchScores();
  return NextResponse.json({ data: scores }); // No type info
}
```

## Domain Entity Types

Model domain entities (User, Score, Draw, etc.) with clear, reusable types.

### ✅ GOOD: Domain Model with Metadata

```typescript
interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

interface User extends BaseEntity {
  email: string;
  full_name: string;
  subscription_status: 'active' | 'inactive' | 'cancelled';
  stripe_customer_id: string | null;
}

interface GolfScore extends BaseEntity {
  user_id: string;
  score: number; // 1-45
  played_at: string;
}

interface Draw extends BaseEntity {
  draw_date: string;
  status: 'draft' | 'published' | 'cancelled';
  winning_numbers: number[]; // 5 unique numbers
}
```

**Why:**
- `BaseEntity` eliminates duplication
- Status fields use union types (not strings)
- Metadata (timestamps) is explicit

### ❌ AVOID: Loose Typing of Status or Enums

```typescript
// ❌ AVOID: Status as plain string
interface User {
  id: string;
  status: string; // Could be anything
}

// ❌ AVOID: Magic numbers
interface GolfScore {
  score: number; // Could be 0, 999, etc.
}
```

## Extending HTML Element Types

For components wrapping native HTML elements, extend the element's attributes.

### ✅ GOOD: Extend with Omit

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export function Button({ variant = 'primary', isLoading, ...props }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${isLoading ? 'loading' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    />
  );
}
```

**Why:**
- Inherits standard `<button>` attributes (`onClick`, `type`, `disabled`, etc.)
- Component can extend with custom properties
- Spreads remaining props through

### ❌ AVOID: Duplicating Native Attributes

```typescript
// ❌ AVOID: Manually list native attributes
interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  // ... other native props
  variant?: string;
}
```

## Optional vs Required Fields

Be intentional about which fields are optional. Default to required unless there's a good reason.

### ✅ GOOD: Required by Default

```typescript
interface FormData {
  email: string; // Required
  name: string; // Required
  phone?: string; // Optional (might not have)
  notes?: string; // Optional (not always filled)
}
```

### ❌ AVOID: Over-Optionalization

```typescript
// ❌ AVOID: Everything optional
interface FormData {
  email?: string;
  name?: string;
  phone?: string;
  // Component can't rely on email/name being present
}
```

## Discriminated Unions for State

Use discriminated unions to represent exclusive states clearly.

### ✅ GOOD: Discriminated Union for Request States

```typescript
type ApiState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Usage in component
const [state, setState] = useState<ApiState<ScoreResult[]>>({ status: 'idle' });

if (state.status === 'success') {
  // TypeScript knows state.data is available here
  return <div>{state.data.length} scores</div>;
}
if (state.status === 'error') {
  // TypeScript knows state.error is available here
  return <div>{state.error}</div>;
}
```

**Why:**
- Type guard ensures correct properties are available
- No accidental access to undefined fields
- Clear state transitions

### ❌ AVOID: Untyped State

```typescript
// ❌ AVOID: Multiple optional fields
interface ApiState {
  isLoading?: boolean;
  isError?: boolean;
  error?: string;
  data?: any;
  // Can break into contradictory states (both loading and error true)
}
```
