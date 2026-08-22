# Architecture

> Status: skeleton — filled progressively; finalized in Phase 7.

## Purpose

Describe system layers, data flow and module boundaries of Nashik Crop Advisor.

## Planned contents

- Layer diagram (Mermaid): UI → API route handlers → domain engines → datasets/external APIs
- Deterministic core vs AI layer separation rules
- Failure-resilience chain: live → cached → deterministic → labelled static
- Server/client boundary and secret handling

## Current state (Phase 0)

- Next.js 16 App Router scaffold with TypeScript, Tailwind v4, ESLint
- Domain model layer under `lib/agriculture` with Zod dataset contracts
- Validated JSON knowledge base under `data/`
- Vitest test harness under `tests/`
