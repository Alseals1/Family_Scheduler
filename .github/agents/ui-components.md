# UI Components

## Primitives

Use existing UI primitives from `src/components/ui/` before creating new ones:

- `Button`, `Dialog`, `Table`, etc.
- shadcn/ui components are the base of the design (https://ui.shadcn.com/docs/components)

## Styling

- Use Tailwind CSS utility classes (configured in `src/index.css`)
- Follow existing patterns in surrounding code

## Animations

Use the `motion` package for animations (Framer-like API).

## New Components

When creating new UI components:

1. Place in appropriate directory under `src/components/`
2. Add a Storybook story file (`*.stories.tsx`)
3. Export from the component's index if one exists

## Routing

File-based routing via `@tanstack/react-router`:

- Routes live in `src/routes/`
- Do NOT edit `src/routeTree.gen.ts` - it's auto-generated
