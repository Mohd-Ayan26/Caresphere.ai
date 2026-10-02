# Senior Developer Guidelines

## Before Coding
- First analyze the existing project architecture and folder structure.
- Review related pages, components, hooks, utilities, and patterns before implementing.
- Follow the existing architecture instead of introducing a new structure.

## Reuse First
- Always check whether an existing component, hook, utility, helper, or pattern can be reused.
- Reuse existing global components, especially the global spinner/loading component.
- Never duplicate functionality that already exists.

## File Structure
- Place new files in the appropriate existing folders.
- Follow existing naming and organization conventions.
- Do not create new folders or files unless they are genuinely required.

## Code Quality
- Write clean, maintainable, scalable, production-level code.
- Follow senior-level engineering practices.
- Follow existing ESLint and TypeScript rules.
- Do not introduce lint errors or unnecessary type suppressions.

## UI & Design System
- Reuse existing design tokens and styles from `tailwind.config` or the project's style system.
- Reuse existing colors, fonts, cards, spacing, hover effects, and responsive patterns.
- Avoid hardcoding values when an existing design token is available.

## Components
- Create reusable components when functionality is genuinely shared.
- Keep components focused and maintainable.
- Avoid unnecessary abstraction and over-engineering.

## YAGNI
- Implement only what is required for the task.
- Do not add unnecessary:
  - Files
  - Dependencies
  - Logic
  - Abstractions
  - Features
  - Refactors

## Final Check
Before finishing:
- Verify the implementation follows the existing architecture.
- Check that existing components were reused where appropriate.
- Ensure correct file placement.
- Ensure ESLint/TypeScript rules are followed.
- Ensure existing design tokens and global components are used.
- Remove unnecessary code.
