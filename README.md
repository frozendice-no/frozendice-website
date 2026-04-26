# FrozenDice website

Marketing site for FrozenDice — a Nordic D&D streaming brand. Built with Next.js 16, shadcn/ui, Tailwind v4, Stripe, Resend, and Sanity.

## Prerequisites

- Node.js 20+
- A Sanity account and project ([sanity.io/manage](https://www.sanity.io/manage))
- A Stripe account
- A Resend account

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Pull env vars from Vercel (project must be linked with `vercel link`):

   ```bash
   vercel env pull .env.local
   ```

   Then append any non-Vercel-managed values (e.g. `SANITY_WEBHOOK_SECRET`) — see `.env.example` for the shape.

3. Run the dev server:

   ```bash
   pnpm dev
   ```

   - Site: http://localhost:3000
   - Sanity Studio: http://localhost:3000/studio

## Architecture

- **Design spec:** [docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md](docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md)
- **Phased implementation plans:** [docs/superpowers/plans/](docs/superpowers/plans/) — one plan per phase (Phase 1 foundation, 2 blog, 3 shop, 4 landing, 5 about; Phase 6 cleanup TBD)

## Project status

- **Work tracker:** [GitHub Project (Kanban)](https://github.com/orgs/frozendice-no/projects/1) and [milestone #1](https://github.com/frozendice-no/frozendice-website/milestone/1) — one issue per phase plus a [spec-review issue](https://github.com/frozendice-no/frozendice-website/issues/2) (15 findings, prioritized)
- **Stakeholder summary:** [Notion FrozenDice Website hub](https://www.notion.so/34769e9f245a81e3b3c7f10613dc73d1) — links to Decision Log, Tasks Tracker, Projects, Technical Reference

When in doubt, GitHub issues are authoritative for status.

## Deployment

Deploys to Vercel. All environment variables from `.env.example` must be set in the Vercel project. The Sanity webhook (`/api/revalidate`) must point at the deployed domain; see the "Task 23" entry in the Phase 1 plan for the setup procedure.
