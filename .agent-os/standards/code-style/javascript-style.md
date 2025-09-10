# JavaScript/TypeScript Style Guide

## Context

JavaScript and TypeScript style rules for React/Express applications.

## Key Mindsets

**1. Simplicity**: Write simple and straightforward code.
**2. Readability**: Ensure your code is easy to read and understand.
**3. Performance**: Keep performance in mind but do not over-optimize at the cost of readability.
**4. Maintainability**: Write code that is easy to maintain and update.
**5. Testability**: Ensure your code is easy to test.
**6. Reusability**: Write reusable components and functions.

**Remember**: Less code is better. Lines of code = Debt.

## General JavaScript/TypeScript Rules

### Variable Declarations
- Use `const` by default, `let` when reassignment is needed
- Never use `var`
- Declare variables at the smallest scope possible

### Function Declarations
- Prefer arrow functions for callbacks and short functions
- Use function declarations for main functions that need hoisting
- Always specify return types in TypeScript
- Use descriptive names for variables and functions
- Prefix event handler functions with "handle" (e.g., handleClick, handleKeyDown)
- Add comments at the start of each function describing what it does

```typescript
// Good - descriptive name, comment, early return
const calculateTotal = (items: Item[]): number => {
  // Calculate the total price of all items in the array
  if (items.length === 0) return 0;
  
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Good for main functions - descriptive name, comment
function processUserData(user: User): ProcessedUser {
  // Transform raw user data into processed format for display
  // implementation
}
```

### TypeScript Specific
- Always use explicit types for function parameters and return values
- Use interfaces for object shapes, types for unions/primitives
- Prefer `const` assertions and `as const` for literal types
- Use optional chaining (`?.`) and nullish coalescing (`??`) operators

```typescript
// Good
interface User {
  id: string;
  name: string;
  email?: string;
}

type Status = 'pending' | 'approved' | 'rejected';

const user: User = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
};

const status = user?.status ?? 'pending';
```

### Coding Patterns

#### Early Returns
- Use early returns to avoid nested conditions and improve readability
- Return early for error cases and edge conditions

```typescript
// Good - early returns
function validateUser(user: User): boolean {
  if (!user) return false;
  if (!user.email) return false;
  if (!user.name) return false;
  
  return true;
}

// Avoid - nested conditions
function validateUser(user: User): boolean {
  if (user) {
    if (user.email) {
      if (user.name) {
        return true;
      }
    }
  }
  return false;
}
```

#### Conditional Classes
- Prefer conditional classes over ternary operators for class attributes

```typescript
// Good - conditional classes
const buttonClasses = [
  'btn',
  isPrimary && 'btn-primary',
  isDisabled && 'btn-disabled',
  size === 'large' && 'btn-lg'
].filter(Boolean).join(' ');

// Avoid - complex ternary
const buttonClasses = `btn ${isPrimary ? 'btn-primary' : ''} ${isDisabled ? 'btn-disabled' : ''}`;
```

#### Constants Over Functions
- Use constants instead of functions where possible
- Define types for constants when applicable

```typescript
// Good - constants
const API_ENDPOINTS = {
  USERS: '/api/users',
  PRODUCTS: '/api/products'
} as const;

const MAX_RETRY_ATTEMPTS = 3;

// Avoid - functions for static values
function getApiEndpoint(type: string) {
  return `/api/${type}`;
}
```

## React Specific Rules

### Component Structure
- Use functional components with hooks
- Export components as default exports
- Use TypeScript interfaces for props
- Place components in their own files

```typescript
// UserCard.tsx
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  className?: string;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, className }) => {
  return (
    <div className={className}>
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user)}>Edit</button>
    </div>
  );
};

export default UserCard;
```

### Hooks Usage
- Use custom hooks for reusable logic
- Keep hooks at the top of components
- Use dependency arrays correctly

```typescript
// Good
const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  return { user, loading };
};
```

### Event Handlers
- Use arrow functions for inline handlers
- Extract complex handlers to separate functions
- Use proper TypeScript event types

```typescript
// Good
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // handle submission
};

// In JSX
<form onSubmit={handleSubmit}>
  <button type="submit">Submit</button>
</form>
```

## Express.js Specific Rules

### Route Handlers
- Use async/await for database operations
- Always handle errors with try/catch
- Use proper HTTP status codes
- Validate input data

```typescript
// Good
app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Middleware
- Use TypeScript for middleware functions
- Export middleware as named exports
- Use proper error handling

```typescript
// auth.middleware.ts
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // verify token logic
  next();
};
```

## File Organization

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── features/       # Feature-specific components
├── hooks/              # Custom React hooks
├── services/           # API calls and external services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── pages/              # Page components
```

### Import/Export Rules
- Use named exports for utilities and types
- Use default exports for components
- Group imports: external libraries, internal modules, relative imports
- Use absolute imports with path mapping

```typescript
// Good imports
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/user';
import { calculateTotal } from '@/utils/calculations';
import UserCard from './UserCard';
```

## Development Guidelines

### Minimal Code Changes
- **Only modify sections of the code related to the task at hand**
- **Avoid modifying unrelated pieces of code**
- **Avoid changing existing comments**
- **Avoid any kind of cleanup unless specifically instructed to**
- **Accomplish the goal with the minimum amount of code changes**
- **Code change = potential for bugs and technical debt**

### Function Ordering
- Order functions with those that are composing other functions appearing earlier in the file
- For example, if you have a menu with multiple buttons, define the menu function above the buttons

