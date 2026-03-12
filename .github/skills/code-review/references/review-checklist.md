# Code Review Checklist

This reference provides detailed criteria for reviewing code changes across four categories: code quality, security, performance, and architecture.

## Table of Contents

- [Code Quality & Style](#code-quality--style)
- [Security Vulnerabilities](#security-vulnerabilities)
- [Performance Concerns](#performance-concerns)
- [Architecture & Design](#architecture--design)
- [Refactoring Opportunities](#refactoring-opportunities)

## Code Quality & Style

### Consistency
- Variable/function naming follows established patterns in the codebase
- Code style matches project conventions (indentation, quotes, semicolons)
- File organization follows project structure patterns
- Import ordering is consistent with codebase

### Cleanliness
- No unused imports, variables, or functions
- No commented-out code blocks (unless explicitly documented as TODO)
- No console.log or debug statements left in production code
- No magic numbers or hardcoded values that should be constants

### Readability
- Complex logic has explanatory comments where non-obvious
- Function/variable names are descriptive and self-documenting
- Functions are focused on single responsibility
- Deeply nested logic (>3 levels) could be extracted or simplified

### Error Handling
- Error cases are handled appropriately (not silently swallowed)
- User-facing errors have helpful messages
- Async operations have proper error handling (try/catch or .catch())
- Edge cases are considered (null/undefined, empty arrays, etc.)

### Testing Considerations
- Changes have corresponding test updates (if project has tests)
- New functions/components are testable (not overly coupled)
- Test data doesn't contain real user information

## Security Vulnerabilities

### Input Validation
- User input is validated and sanitized
- SQL queries use parameterized queries (no string concatenation)
- API endpoints validate request parameters and body
- File uploads validate file types and sizes

### Authentication & Authorization
- Protected routes check authentication status
- Operations check user permissions before execution
- Tokens/sessions are handled securely (httpOnly cookies, secure storage)
- No authentication bypasses in logic

### Cross-Site Scripting (XSS)
- User-generated content is properly escaped when rendered
- dangerouslySetInnerHTML is avoided or sanitized
- URL parameters used in rendering are validated

### Sensitive Data
- No API keys, tokens, or credentials in code
- No .env files or sensitive configs committed
- Sensitive data is not logged
- Passwords are hashed, not stored in plaintext

### Dependencies
- No known vulnerable dependencies introduced
- External libraries are from trusted sources
- No eval() or new Function() with user input

## Performance Concerns

### React/Frontend Specific
- No unnecessary re-renders (proper use of memo, useMemo, useCallback)
- Large lists use virtualization or pagination
- Heavy computations are memoized
- Images are optimized and lazy-loaded where appropriate
- Event listeners are cleaned up (useEffect cleanup)

### Data Fetching
- No N+1 query patterns (multiple sequential fetches in loops)
- Queries use appropriate indexes (if touching database queries)
- Pagination is used for large datasets
- Unnecessary data is not fetched (select only needed fields)
- Caching is used appropriately (React Query, etc.)

### Bundle Size
- No unnecessarily large dependencies added
- Code splitting is used for large features
- Tree-shaking compatible imports (import { specific } from 'lib')

### General
- No synchronous blocking operations in critical paths
- Loops don't have expensive operations that could be optimized
- Data structures are appropriate for access patterns

## Architecture & Design

### Component Design
- Components are appropriately sized (not overly large)
- Reusable logic is extracted to hooks or utilities
- Components are composable and follow single responsibility
- Props interfaces are well-defined with appropriate types

### State Management
- State is lifted to appropriate level (not too high or too low)
- Global state is used appropriately (not overused)
- Derived state is computed rather than stored
- State updates are batched where possible

### Type Safety
- TypeScript types are specific (not overusing `any` or `unknown`)
- Interfaces accurately represent data structures
- Type assertions are justified and safe
- Optional chaining is used appropriately

### Separation of Concerns
- Business logic is separate from presentation
- API calls are abstracted from components
- Utilities are pure functions where possible
- Database/data layer is separate from UI logic

### Project Patterns
- Code follows established project patterns (from CLAUDE.md)
- New patterns are justified and documented
- Existing abstractions are reused rather than reinvented
- Changes respect architectural boundaries

## Refactoring Opportunities

### Duplication
- Similar code blocks that could be extracted to shared functions
- Repeated patterns that could use a common abstraction
- Copy-pasted components that could be generalized

### Simplification
- Complex conditionals that could use early returns or guard clauses
- Nested ternaries that should be if/else or separate variables
- Long functions (>50 lines) that could be split
- Complex boolean logic that could be extracted to named functions

### Abstraction
- Magic strings that should be enums or constants
- Repeated configuration that could be centralized
- Hard-coded logic that should be data-driven
- Feature flags or environment-specific code that could be cleaner

### Modern Patterns
- Class components that could be functional components with hooks
- Legacy patterns that have modern equivalents
- Deprecated API usage that should be updated
- Manual implementations of things available in libraries

### Type Improvements
- Loose types that could be more specific
- Missing generic type parameters
- Union types that could use discriminated unions
- Any types that could be properly typed
