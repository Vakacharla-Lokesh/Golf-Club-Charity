# Utility Types

TypeScript utility types help compose new types from existing ones, reducing duplication and improving maintainability.

## Core Utility Types

### Partial<T> — Make All Properties Optional

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
}

// All User properties become optional
type UserUpdate = Partial<User>;
// Equivalent to:
// {
//   id?: string;
//   email?: string;
//   name?: string;
//   phone?: string;
// }

// Usage in API route
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const updates: UserUpdate = body; // Could have any subset of User properties
  
  // Update user with selective fields
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);
}
```

**When to use:**
- API update endpoints (not all fields required)
- Configuration objects with optional overrides
- Form components where not all fields are filled

---

### Omit<T, K> — Exclude Specific Properties

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// Remove id and created_at (database-managed fields)
type UserInput = Omit<User, 'id' | 'created_at'>;
// Equivalent to:
// {
//   email: string;
//   name: string;
// }

// Usage in form validation
const userSchema = z.object<z.ZodType<UserInput>>({
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validated = userSchema.parse(body); // Type-safe: no id or created_at
  
  const { data } = await supabase
    .from('users')
    .insert(validated);
}
```

**When to use:**
- Form inputs (exclude IDs, timestamps)
- API request bodies (exclude computed fields)
- Hiding internal fields from external APIs

---

### Pick<T, K> — Extract Specific Properties

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  bio: string;
}

// Only email and name (minimal public profile)
type PublicUser = Pick<User, 'email' | 'name'>;
// Equivalent to:
// {
//   email: string;
//   name: string;
// }

// Usage in API response
export async function GET(req: NextRequest) {
  const users = await fetchAllUsers();
  
  // Return only public fields
  const publicUsers: PublicUser[] = users.map(u => ({
    email: u.email,
    name: u.name,
  }));
  
  return NextResponse.json(publicUsers);
}
```

**When to use:**
- Public API responses (expose minimal data)
- Dashboard summaries (show only important fields)
- Selecting relevant fields for specific views

---

### Readonly<T> — Prevent Mutations

```typescript
interface DrawConfig {
  maxEntries: number;
  drawDate: string;
  prizePool: number;
}

type ImmutableConfig = Readonly<DrawConfig>;

const config: ImmutableConfig = {
  maxEntries: 100,
  drawDate: '2026-03-24',
  prizePool: 50000,
};

config.maxEntries = 200; // ❌ TypeScript Error: Cannot assign to readonly property
```

**When to use:**
- Configuration constants (prevent accidental changes)
- Function parameters you shouldn't modify
- Returned data that shouldn't be mutated

---

### Record<K, V> — Map Keys to Values

```typescript
type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// Map each tier to pricing info
type TierPricing = Record<SubscriptionTier, { monthlyPrice: number; features: string[] }>;

const pricing: TierPricing = {
  free: {
    monthlyPrice: 0,
    features: ['Basic dashboard'],
  },
  pro: {
    monthlyPrice: 29,
    features: ['Advanced stats', 'Custom alerts'],
  },
  enterprise: {
    monthlyPrice: 299,
    features: ['White-label', 'API access', 'Priority support'],
  },
};

// Usage: Ensure all tiers are covered
function getPricing(tier: SubscriptionTier) {
  return pricing[tier]; // Type-safe: tier is always valid
}
```

**When to use:**
- Enums with associated data
- Configuration maps
- Status/state lookups

---

### Extract<T, U> — Get Matching Types

```typescript
type UserStatus = 'active' | 'inactive' | 'banned' | 'pending';

// Extract only the "active" types
type ActiveUserStatus = Extract<UserStatus, 'active' | 'inactive'>;
// Equivalent to: 'active' | 'inactive'

function handleActive(status: ActiveUserStatus) {
  // status is either 'active' or 'inactive', never 'banned' or 'pending'
}
```

**When to use:**
- Filtering union types
- Type narrowing for specific cases
- Reducing accepted values in callbacks

---

### Exclude<T, U> — Remove Matching Types

```typescript
type UserStatus = 'active' | 'inactive' | 'banned' | 'pending';

// Remove admin/system statuses
type UserVisibleStatus = Exclude<UserStatus, 'banned' | 'pending'>;
// Equivalent to: 'active' | 'inactive'

function displayStatus(status: UserVisibleStatus) {
  // Can't display 'banned' or 'pending' (intentionally excluded)
}
```

**When to use:**
- Excluding specific union members
- Hiding internal states from public API
- Removing deprecated values

---

## Combining Utility Types

### Partial<Omit<T, K>> — Optional Updates Without IDs

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
}

type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
// Equivalent to:
// {
//   email?: string;
//   name?: string;
//   phone?: string;
// }

// Usage: Update endpoint
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const updates: UserUpdate = await req.json();
  
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', params.id);
}
```

---

### Pick<T, Extract<keyof T, 'field1' | 'field2'>> — Conditional Pick

```typescript
interface ComplexObject {
  id: string;
  email: string;
  internal_hash: string;
  api_key: string;
  public_json: string;
}

// Pick only "safe" fields
type SafeFields = Pick<ComplexObject, Extract<keyof ComplexObject, 'id' | 'public_json'>>;
// Equivalent to: { id: string; public_json: string; }
```

---

## Real-World Example: Form Handling

```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

// 1. Form input: exclude system-generated fields
type UserFormInput = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;

// 2. Form state with loading: make all fields optional during edit
type UserFormState = Partial<UserFormInput>;

// 3. API update payload: only include changed fields
type UserUpdatePayload = Partial<UserFormInput>;

// 4. Public profile response: minimal fields
type PublicUserProfile = Pick<UserProfile, 'id' | 'name' | 'bio' | 'avatar_url'>;

// Usage flow:
export async function handleFormSubmit(formData: UserFormState) {
  const payload: UserUpdatePayload = {
    email: formData.email,
    name: formData.name,
  };
  
  const { data } = await fetch('/api/user', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  
  const publicData: PublicUserProfile = {
    id: data.id,
    name: data.name,
    bio: data.bio,
    avatar_url: data.avatar_url,
  };
}
```

---

## Anti-Patterns

### ❌ AVOID: Manually Duplicating Types

```typescript
// ❌ DON'T: Create UserUpdate by hand
interface User {
  id: string;
  email: string;
  name: string;
}

interface UserUpdate {
  email?: string; // Manually: repeated fields
  name?: string;
}

// ✅ DO: Use Partial<Omit<>>
type UserUpdate = Partial<Omit<User, 'id'>>;
```

### ❌ AVOID: Using `any` Instead of Utility Types

```typescript
// ❌ DON'T: Generic any
type UserUpdate = any;

// ✅ DO: Specific utility type
type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
```

### ❌ AVOID: Over-Composing Types

```typescript
// ❌ AVOID: Too complex
type VeryComplexType = Partial<Omit<Pick<Extract<User, ...>, ...>, ...>>;

// ✅ DO: Break into readable pieces
type PublicFields = Pick<User, 'id' | 'name'>;
type OptionalUpdate = Partial<PublicFields>;
```
