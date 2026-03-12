# Testing Patterns

## Test Types

| Tool           | Purpose                      | When to Use                      |
| -------------- | ---------------------------- | -------------------------------- |
| **Vitest**     | Unit tests                   | Logic, utilities, hooks          |
| **Storybook**  | Component dev/visual testing | Local development, design review |
| **Playwright** | E2E / UI verification        | Verify frontend work, CI checks  |

## Running Tests

```bash
yarn test          # Vitest
yarn storybook     # Storybook dev server
```

## File Locations

- Unit tests: `tests/` directory
- Stories: Co-located with components as `*.stories.tsx`

## LLM Verification

When completing frontend work, use Playwright to verify the UI behaves correctly. This is preferred over relying solely on Storybook for verification.
