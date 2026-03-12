# Data Fetching (TanStack React Query)

## Required Patterns

- Use `@tanstack/react-query` for all server state and caching
- Parse API responses with Zod schemas near fetch boundaries
- Use query invalidation for cache updates after mutations

## Example Pattern

```typescript
// In src/lib/types/Tool.ts
export function useToolQuery(id: string) {
  return useQuery({
    queryKey: ["tool", id],
    queryFn: () => getToolById(id),
  })
}
```

## Optimistic Updates

Use optimistic updates for better UX when the mutation is unlikely to fail.
