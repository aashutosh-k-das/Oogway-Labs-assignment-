# Oogway Labs Assistant

An AI-powered assistant application featuring a Python backend, a Vite frontend, and a PostgreSQL database with `pgvector` for vector storage. It also integrates with Ollama for local LLM capabilities.

## Documentation

For a detailed look at the system design and architecture, check out our documentation:
- [System Design](docs/design.md)
- [System Architecture](docs/architecture.md)
- [Product Requirements Document (PRD)](docs/PRD.md)
- [Test Plan](docs/test-plan.md)

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                           │
│                                                                 │
│  ┌────────────┐    ┌──────────────────┐    ┌────────────────┐   │
│  │  Frontend  │    │     Backend      │    │   PostgreSQL   │   │
│  │ React+Vite │───▶│     FastAPI      │───▶│  + pgvector    │   │
│  │  :5173     │    │     :8000        │    │  :5432         │   │
│  └────────────┘    └────────┬─────────┘    └────────────────┘   │
│                             │                                   │
│                    ┌────────┴────────┐                          │
│                    │   LLM Provider  │                          │
│                    │   (pluggable)   │                          │
│                    ├─────────────────┤                          │
│                    │  Ollama (local) │                          │
│                    │  OpenAI (cloud) │                          │
│                    │ Anthropic(cloud)│                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

- **Frontend**: Vite + React application (running on port `5173`).
- **Backend**: Python FastAPI application (running on port `8000`) that handles orchestration, RAG, and API endpoints.
- **Database**: PostgreSQL with the `pgvector` extension for efficient similarity search over chunk embeddings.
- **LLM**: A pluggable LLM provider abstraction, defaulting to a local Ollama instance (running on port `11434`), with support for OpenAI and Anthropic.

## System Design

### Request lifecycle: sending a message

```text
Browser                       FastAPI                         PostgreSQL / LLM
───────                       ───────                         ────────────────
POST /api/sessions/{id}/messages
  (optimistic user bubble) ─▶ messages router
                               │ save user message ─────────▶ messages table
                               ▼
                             agent.py: route request
                               │  essay?    → Ship 30 skill
                               │  artifact? → artifact generator (MD/HTML)
                               │  else      → grounded Q&A
                               ▼
                             rag.py: embed query ──────────▶ pgvector cosine search
                               │  top-k=8, similarity ≥ 0.35 ◀─ ranked chunks
                               │  de-duplicate by source
                               ▼
                             LLM provider (Ollama | OpenAI | Anthropic)
                               │  system prompt + attributed context
                               ▼
                             save assistant message ───────▶ content + sources + artifact (JSONB)
  ◀────────────────────────── response
React Query refetches session ─▶ result mirrored into IndexedDB
```

### Backend

| Concern | Design |
|---|---|
| **API** | FastAPI with async SQLAlchemy. REST resources: `sessions` (CRUD + `PATCH` rename), `messages`, `ingestion`, `sources`, `config`, `health`. Pydantic validates every request (messages capped at 10,000 chars). |
| **Ingestion** | Markdown transcripts → YAML frontmatter parsed into `sources` → chunked (~2,000 chars, 200 overlap; podcasts split on speaker turns, newsletters on headings) → embedded with `all-MiniLM-L6-v2` (384-dim) → stored in `chunks`. `file_path` is `UNIQUE`, so re-running ingestion is idempotent. |
| **Retrieval** | The query is embedded with the same model, then pgvector cosine distance returns the top 8 chunks above 0.35 similarity. Each chunk carries speaker and timestamp, so answers cite exact moments. |
| **Agent routing** | Keyword routing in `agent.py` sends each request to one of three paths (essay, artifact, Q&A). All paths share retrieval and return `content + sources + artifact`. |
| **LLM abstraction** | `LLMProvider` base class with Ollama, OpenAI and Anthropic implementations, picked by a factory from the `LLM_PROVIDER` env var. Switching models is a config change, not a code change. |
| **Data model** | `sources 1─* chunks` (knowledge base) and `sessions 1─* messages` (conversations). Citations and artifacts are JSONB on the message, so a conversation loads in one query. Cascade deletes keep data consistent. Indexed on `chunks(source_id)` and `messages(session_id, created_at)`. |

### Frontend

| Concern | Design |
|---|---|
| **State** | TanStack React Query owns all server state (sessions, messages, config). Sending a message is an optimistic mutation: the user's bubble appears instantly and rolls back on error. |
| **Offline app shell** | A service worker ([frontend/service-worker/sw.js](frontend/service-worker/sw.js)) precaches the hashed build files, which a Vite plugin injects at build time, so the UI loads with no network. Navigations are network-first with the cached shell as fallback, `/assets/*` is cache-first, and Google Fonts are stale-while-revalidate. Production build only (`npm run build && npm run preview`). |
| **Chat history in IndexedDB** | Sessions and messages are mirrored to IndexedDB ([frontend/src/lib/chatStore.ts](frontend/src/lib/chatStore.ts)) after every successful fetch. On a network error or 5xx, the app reads the local copy, so past conversations stay readable offline; 4xx errors are real answers and are not masked. An offline banner appears and sending is paused until the connection returns. |
| **Accessibility** | Lighthouse accessibility score went from **89 to 100** after fixing heading order, re-enabling pinch-zoom, replacing clickable `<div>`s with buttons, labelling inputs and icon buttons, raising low-contrast text, and adding focus rings, a skip link and keyboard access to hover-only actions. |
| **Artifact safety** | Markdown renders through `react-markdown` with no raw HTML. HTML artifacts render in an `<iframe sandbox="">` via `srcdoc`, which blocks scripts and gives the frame no access to the parent page's DOM, cookies or storage. |

### Trade-offs and scaling

- **Exact vector search:** with one podcast and newsletter archive, a full scan is fast and perfectly accurate. Past roughly 100k chunks, the next step is an HNSW index on `chunks.embedding`.
- **Keyword routing over LLM routing:** it's deterministic, free and testable. The cost is missing paraphrased intents; an LLM classifier could replace it behind the same interface.
- **Synchronous responses:** the API returns the full answer in one response, which keeps the client simple. Streaming over SSE would cut time-to-first-token for long essays.
- **Server is the source of truth:** IndexedDB is a read-through cache, not an offline write queue. That avoids conflict resolution at the cost of not sending messages while offline.

For full schema tables, API reference and UI states, see [System Architecture](docs/architecture.md) and [System Design](docs/design.md).

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Python (for local development)
- Node.js (for local development)

## Getting Started

### Using Docker Compose (Recommended)

The easiest way to run the entire stack is using Docker Compose:

```bash
# Start all services
make up

# View logs
make logs

# Stop all services
make down
```

### Data Ingestion

To run the data ingestion process:

```bash
make ingest
```

### Local Development

If you prefer to run the services locally:

**Backend:**
```bash
make dev-backend
```

**Frontend:**
```bash
make dev-frontend
```

**Database Migrations:**
```bash
make migrate
```

## Testing

Run tests across the stack using:

```bash
make test
```

Or run them individually:
- `make test-backend`
- `make test-frontend`

## Cleanup

To remove all Docker containers, volumes, and build artifacts:

```bash
make clean
```