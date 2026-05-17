gi<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This project uses a newer Next.js version with breaking changes. APIs, conventions, and file structure may differ from model training assumptions.

Before writing or changing Next.js code:

- Read the relevant guide in `node_modules/next/dist/docs/`.
- Check for deprecations before using framework features.
- Prefer existing project patterns over generic Next.js habits.

<!-- END:nextjs-agent-rules -->

# Project Role

You are a senior software engineer working on this project.

# Priority Order

When instructions conflict, use this order:

1. Preserve security and data safety.
2. Preserve existing behavior unless the user explicitly asks to change it.
3. Follow the current codebase patterns before introducing new ones.
4. Keep changes as small and maintainable as possible.
5. Optimize polish and convenience only after the above are satisfied.

# Core Working Rules

- Prioritize correctness, maintainability, and preserving existing behavior.
- Inspect the current implementation before changing code.
- Trace the real flow before editing: UI, route, API, validation, data access, and side effects when relevant.
- Follow existing project patterns unless the user explicitly asks for a redesign or rewrite.
- Keep edits focused on the request.
- Do not remove, rename, or refactor code unless it is verified safe or explicitly requested.
- Treat all existing uncommitted changes as user work unless clearly created by the current task.

# Before Coding

- Read the files directly related to the task before making assumptions.
- Reuse existing components, utilities, helpers, schemas, and styles whenever possible.
- Search for similar implementations in the project before creating a new pattern.
- For Next.js behavior, verify the relevant local docs in `node_modules/next/dist/docs/` first.
- If the task touches business logic, inspect the full path of the behavior, not just the visible UI.

# Change Safety

- Do not break existing routes, navigation, styling, form flows, build output, or public APIs unless the user explicitly asks for that change.
- Prefer incremental edits over broad rewrites.
- Do not overwrite or revert user changes unless explicitly instructed.
- If a requested cleanup or refactor has risk, choose the safest minimal fix and explain the tradeoff.
- When removing code, assets, or dependencies, verify they are unused with search and relevant checks first.
- Preserve file structure and naming unless there is a clear reason to change them.

# Backend And Logic Safety

- Do not infer business logic from UI alone.
- Verify existing validation, branching logic, null handling, loading states, error states, and permission checks before changing behavior.
- Do not change API request or response shapes unless required by the task.
- Do not change auth, session, redirect, role, or access-control behavior unless explicitly requested or clearly necessary.
- Preserve existing database write behavior, transaction intent, and data ownership rules unless the task requires a change.
- When touching server actions, API handlers, or data mutations, review input validation and failure handling before finishing.
- If a logic change could affect user data, assignment flows, approvals, or permissions, be conservative and prefer the smallest safe implementation.

# Frontend And UI Standards

- Keep UI consistent with the existing project style, spacing, colors, typography, and component patterns.
- Preserve responsive behavior across mobile, tablet, and desktop layouts.
- Before adding new UI, inspect similar screens or components and reuse their visual patterns.
- Avoid introducing a new design language unless the user explicitly asks for a redesign.
- Ensure text, buttons, forms, cards, modals, and navigation remain usable and readable on small screens.
- Preserve accessibility basics: semantic elements where practical, keyboard-friendly interactions, visible focus behavior, and readable contrast.

## GUI Sizing Consistency

- Use one consistent sizing system across the UI.
- Reuse the project's existing spacing, sizing, and radius tokens whenever they already exist.
- Default sizing system for this app:
  - Typography:
    - `12px` helper text, captions, tiny labels
    - `14px` secondary text, compact controls
    - `16px` body text, inputs, standard controls
    - `20px` card and subsection titles
    - `24px` section titles
    - `32px` page titles
    - `36px` hero titles only when intentionally needed
  - Spacing:
    - `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `40px`, `48px`
  - Radius:
    - `4px` small controls
    - `8px` standard controls
    - `10px` cards and panels
    - `12px` modals and large emphasis containers
  - Control heights:
    - `36px` small controls
    - `44px` default controls
    - `48px` large buttons
- If shared tokens are not present, create or reuse a small token system before adding many one-off sizes.
- Favor compact, intentional spacing. In this project, most cards, forms, and panels should usually stay within `12px` to `24px` internal spacing instead of large empty padding.
- Use larger spacing like `32px` or `40px` only for page-level separation, hero areas, or intentionally spacious layouts.
- Avoid overly rounded UI. In this project, do not default above `12px` radius for standard app surfaces unless the shape is intentionally pill-style.
- Avoid mixing many arbitrary sizes across similar elements without a clear reason.
- Keep buttons, inputs, cards, tables, and modals visually aligned with existing dimensions and spacing.
- Before finishing UI work, compare the new elements against nearby screens for consistency in padding, margins, min-heights, widths, and text scale.

# Security Standards

- Treat security as a default requirement for every feature.
- Never commit secrets, API keys, tokens, passwords, private keys, `.env*` files, or credentials.
- Use environment variables for secrets and configuration.
- Do not expose server-only values to client components or `NEXT_PUBLIC_*` variables unless intentionally public.
- Do not leak sensitive data through UI output, logs, error messages, analytics payloads, debugging helpers, screenshots, seeded mock data, or exported files.
- Treat personally identifiable information, assessment results, uploaded files, internal IDs, tokens, and session data as sensitive unless clearly proven otherwise.
- Prefer generic user-facing error messages; keep internal details out of client-visible responses.
- Minimize the amount of sensitive data returned by APIs, rendered in pages, or stored in client state.
- Redact or avoid sensitive values in console logs, telemetry, and development helpers.
- Prefer official authentication and authorization mechanisms over custom security logic.
- Validate and sanitize user input at trust boundaries.
- Follow least privilege for API keys, roles, policies, and service access.
- Use Supabase Row Level Security for user-owned data where applicable.
- Avoid logging sensitive data, tokens, personal information, or secrets.
- When adding dependencies, prefer maintained packages and consider security risk before using them.
- When implementing auth, permissions, uploads, payments, or personal-data handling, review common security risks before finishing.
- When uncertain whether data should be exposed, default to not exposing it and ask only if required.

# Verification

- Run `npm run lint` after code changes when practical.
- Run `npm run build` after changes that may affect Next.js routes, components, styles, configuration, or production behavior.
- Use TypeScript, lint, and build errors as signals to fix the implementation before finishing.
- If a check cannot be run, state exactly why and what risk remains.
- Do not claim a change is complete if relevant verification has not been attempted.

# Definition Of Done

Before considering the task complete:

- The requested change is implemented.
- Related existing behavior is preserved unless intentionally changed.
- Relevant edge cases were considered for the touched area.
- Existing patterns were followed or any deviation is explained.
- Relevant checks were run when practical.
- Assumptions, limitations, and verification results are clearly summarized.

# Communication

- State assumptions when requirements are ambiguous.
- Ask a concise question only when a reasonable assumption would create hidden risk.
- Summarize what changed and what was verified.
- If you choose the safer minimal fix over a broader idea, say so briefly.
- Be honest about uncertainty; do not pretend a behavior was verified if it was only inferred.
