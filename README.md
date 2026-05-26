# Vasudha Connect — Community Family Tree

> **वसुधैव कुटुम्बकम्** — The Whole World Is One Family

A production-grade, mobile-first family tree application built for a Gujarati community. Allows members to register profiles, explore family connections, and discover how any two people are related — with authentic Gujarati relationship naming.

**Live site:** https://vasu-dha.vercel.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Auth | Supabase Auth |
| Hosting | Vercel (free tier) |
| Search | Fuse.js (fuzzy search) |

---

## Features

### Public
- **Browse profiles** — searchable, filterable community directory (mobile filter sheet)
- **Profile pages** — full family tree: parents, grandparents, siblings, children, uncles, aunts, in-laws
- **Register** — self-registration with photo upload, relative linking, confirmation dialog
- **Relationship finder** — BFS graph traversal with Gujarati labels (Kaka, Mama, Foi, Masi, etc.)
- **Family tree visualiser** — SVG-rendered generational tree with spouse/child connections
- **Find Connection** — horizontal chain on desktop, vertical on mobile
- **Native share** — WhatsApp / iMessage via Web Share API on mobile

### Admin (login required)
- Dashboard with stats and family distribution chart
- Full profile management (create, edit, delete, mark deceased)
- Relationship linking (father, mother, spouse — bidirectional)
- Bulk actions, Excel export
- Contact/edit request inbox

---

## Setup

### 1. Clone and install
```bash
git clone https://github.com/notyetcoder/Vasudha.git
cd Vasudha
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
# Fill in your Supabase credentials
```

### 3. Supabase setup
1. Create a Supabase project at supabase.com
2. Run `scripts/schema.sql` in the SQL editor
3. Run `supabase_rpc_fix.sql` for spouse-linking stored procedures
4. Create a public Storage bucket named `profile-pictures`
5. Apply the RLS policies from the schema file

### 4. Run locally
```bash
npm run dev
# Opens at http://localhost:9002
```

---

## Relationship Logic

The system uses **three ID fields** — `fatherId`, `motherId`, `spouseId` — to derive every relationship dynamically:

- Siblings: shared `fatherId` or `motherId`
- Grandparents: `father.fatherId`, `father.motherId`, etc.
- Uncles/Aunts: grandparent's other children
- Cousins: `કાકાનો દીકரો ભાઈ` / `ફોઈની દીકરી બહેન` etc.
- In-laws: via `spouseId` traversal

BFS (Breadth-First Search) finds the shortest path between any two people, with a maximum depth of 8 steps.

---

## Security

- Public: read + register only (Supabase RLS enforced)
- Admin: edit, delete, link (service role key, server-side only)
- Middleware guards all `/admin/*` routes
- Input sanitised with `sanitize-html` before DB writes
- Security headers set in `next.config.js`

---

## License

MIT — see LICENSE file.
