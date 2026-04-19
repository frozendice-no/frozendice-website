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

See [docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md](docs/superpowers/specs/2026-04-19-frozendice-redesign-design.md) for the design spec and [docs/superpowers/plans/](docs/superpowers/plans/) for phased implementation plans.

## Deployment

Deploys to Vercel. All environment variables from `.env.example` must be set in the Vercel project. The Sanity webhook (`/api/revalidate`) must point at the deployed domain; see the "Task 23" entry in the Phase 1 plan for the setup procedure.
