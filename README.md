# Oogway Labs Assistant

An AI-powered assistant application featuring a Python backend, a Vite frontend, and a PostgreSQL database with `pgvector` for vector storage. It also integrates with Ollama for local LLM capabilities.

## Architecture

- **Frontend**: Vite application running on port `5173`.
- **Backend**: Python FastAPI application running on port `8000`.
- **Database**: PostgreSQL with `pgvector` for efficient similarity search.
- **LLM**: Local Ollama instance running on port `11434`.

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