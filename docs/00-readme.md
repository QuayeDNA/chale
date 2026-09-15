# Chale — Project Documentation Index

This is the doc set for the Chale app. Suggested order to work through them, especially if you're picking this up fresh or handing it to someone else:

1. **01-prd.md** — What we're building and why. Vision, differentiator, MVP scope, non-goals. Read this first, always.
2. **04-user-flows.md** — The actual step-by-step journeys through the app (onboarding, pairing, daily question, voice mode, reveal). Read before touching UI or backend logic — this is the behavior spec.
3. **05-design-system.md** — Visual direction: mood, color, type, key screens. *(Structure and contextual theming are written; the foundational palette/type pairing is still pending a final direction.)*
4. **02-technical-architecture.md** — Stack decision, data model, reveal logic, voice mode implementation notes.
5. **06-development-workflow.md** — Git workflow, folder structure, environment setup, testing approach, CI/CD. Read before writing the first line of code.
6. **03-roadmap.md** — Phased build order (MVP → iOS → relationship-type expansion → groups far-future).

## How these relate

- The **PRD** is the "what/why" — it shouldn't change often.
- **User flows** and **design system** are the "how it feels" — these should be locked before UI implementation starts, so you're not redesigning screens mid-build.
- **Technical architecture** and **development workflow** are the "how it's built" — these can evolve as you build, but the data model and reveal logic in particular should be treated as load-bearing (changing them later touches a lot of code).
- **Roadmap** is the sequencing — what not to build yet.

## Naming note

App name: **Chale**. The project repo is currently scaffolded under the working name "Twogether" — a rename is planned but not urgent (see PRD §1a).