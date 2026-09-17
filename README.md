# Tender Intelligence

Medical tender specification intelligence platform frontend foundation. It uses Next.js App Router, TypeScript, Tailwind CSS and realistic, API-replaceable fixtures.

## Run

```bash
npm install
npm run dev
```

## Implemented routes

- `/` — Dashboard
- `/analyses` — Analysis list
- `/analyses/new` — Upload and optional overrides; append `?processing=1` for the staged mock pipeline
- `/analyses/digital-fluoroscopy` — Fluoroscopy overview
- `/analyses/ceiling-dr` — Digital radiography overview
- `/manual-review`, `/amendments`, `/products`, `/evidence` — future-ready placeholders

## Fixtures and data contract

`app/data/fixtures.ts` stores the two fixture analyses. `app/data/types.ts` contains the shared `Analysis`, `ArchitectureItem`, `SpecificationSection`, and `AttentionItem` contracts. These maintain source section labels and canonical categories separately, so a future pipeline can trace a source document section to normalized intelligence without flattening it.

No PDF parsing, API, product-match calculation, or AI chat backend has been implemented. Processing animation and all analysis counts/results are structured mock data.

## Product Knowledge milestone

`/products` now provides product CRUD, tender-relevant parameter editing, a horizontally comparable matrix, Excel preview/import and an internal deterministic comparison tool. The supplied Fluoroscopy workbook format is parsed in-browser. Product values are persisted to browser local storage only for this demo; `db/schema.sql` is a DB-ready PostgreSQL/Supabase schema, but no database has been provisioned.
