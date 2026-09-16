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