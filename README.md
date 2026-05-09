# ideatest.io

Product idea research and scoring platform built around needs-based (Jobs-to-be-Done) thinking. Create a product idea, let AI generate a research framework, collect interview data, and get scored analysis results.

## Features

- **AI-powered research frameworks** -- describe your idea and get a structured JTBD-based research plan
- **Clarifying questions** -- AI asks follow-up questions to refine the framework before generation
- **Interview data collection** -- structured data entry with scored outcomes (importance/satisfaction)
- **AI analysis** -- automated analysis of collected research data
- **PDF export** -- generate interview guides and reports as PDF
- **Excel export** -- export data in spreadsheet format
- **Positioning & sales messages** -- AI-generated positioning statements and sales copy
- **Bilingual UI** -- Finnish and English

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | React 18, TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3, shadcn/ui (Radix primitives) |
| Routing | react-router-dom |
| Backend | Supabase (Auth, Database, Edge Functions) |
| AI | OpenAI Chat Completions (lab deployment patch; upstream used Lovable AI Gateway) |
| Data fetching | TanStack React Query |
| Forms | react-hook-form + Zod validation |
| Charts | Recharts |
| Export | jsPDF, html2canvas, ExcelJS, Mammoth |

## Getting started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) account (free tier works)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (for deploying edge functions and migrations)

### 1. Clone and install

```sh
git clone https://github.com/IdeatestLUT/ideatest.git
cd ideatest
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard)
2. Update `supabase/config.toml` with your project ID:

```toml
project_id = "your-actual-project-id"
```

3. Link and apply the database migrations:

```sh
supabase login
supabase link --project-ref your-actual-project-id
supabase db push
```

This creates all the required tables (profiles, ideas, outcomes, etc.) and Row Level Security policies.

### 3. Configure environment variables

```sh
cp .env.example .env
```

Fill in your values from the Supabase dashboard (Settings > API):

```
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

### 4. Deploy Edge Functions

The AI SDR lab deployment uses OpenAI instead of Lovable AI Gateway because Lovable does not expose a confirmed standalone gateway key path for external Coolify deployments. Set these Supabase secrets:

```sh
supabase secrets set OPENAI_API_KEY=your-openai-api-key OPENAI_MODEL=gpt-4o-mini
```

Then deploy all functions:

```sh
supabase functions deploy
```

### 5. Enable Google OAuth (optional)

If you want Google sign-in:

1. Go to Supabase dashboard > Authentication > Providers > Google
2. Enable it and add your Google OAuth client ID and secret
3. Set the redirect URL to your app's URL

### 6. Run the app

```sh
npm run dev
```

The app runs at `http://localhost:8080`.

## Supabase Edge Functions

The `supabase/functions/` directory contains Deno-based edge functions that power the AI features:

| Function | Purpose |
|----------|---------|
| `generate-clarifying-questions` | Generates follow-up questions for a new idea |
| `generate-framework` | Creates the JTBD research framework |
| `regenerate-steps` | Regenerates individual framework steps |
| `analyze-results` | Analyzes collected interview/research data |
| `regenerate-interview-guide` | Rebuilds the interview question guide |
| `generate-positioning` | Creates positioning statements |
| `generate-sales-messages` | Generates sales messaging copy |

All functions in this lab deployment use OpenAI Chat Completions and require the `OPENAI_API_KEY` secret. `OPENAI_MODEL` defaults to `gpt-4o-mini`.

## Project structure

```
src/
  pages/          -- Route pages (Auth, Dashboard, NewIdea, IdeaDetail, etc.)
  components/     -- UI components and shadcn/ui primitives
  hooks/          -- React hooks (auth, guided tour, mobile detection)
  i18n/           -- Translations and language context (fi/en)
  integrations/   -- Supabase client and types
  lib/            -- Utility functions
  test/           -- Test setup and example tests
supabase/
  functions/      -- Deno edge functions (AI features)
  migrations/     -- SQL migration files (database schema)
  config.toml     -- Supabase project config
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## License

MIT
