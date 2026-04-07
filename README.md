# SUITS-26


## Project Structure

- [TSS](./TSS/README.md): Telemetry Stream Server used for rover, EVA, and LTV data
- [JavaBackend](./JavaBackend/README.md): Kotlin/Javalin backend for POIs, audio, rover APIs, EVA APIs, and LTV APIs
- [PythonBackend](./PythonBackend/README.md): Python service layer for navigation and higher-level logic on top of the Java backend
- `Frontend/`: Frontend application code

## Quick Start

Start the full stack:

```bash
docker compose up -d
```

Add `--build` the first time you run the stack, or whenever you need to rebuild images after code changes.

When you are done, stop the stack with:

```bash
docker compose down
```

## Service Ports and URLs

- TSS (`c-backend`): `14141` TCP/UDP, `http://localhost:14141`
- Java backend: `7070`, `http://localhost:7070`
- Python backend: `4000`, `http://localhost:4000`

## API Documentation

- Java backend API docs: [JavaBackend/README.md](./JavaBackend/README.md)
- Python backend docs: [PythonBackend/README.md](./PythonBackend/README.md)
- TSS usage and telemetry details: [TSS/README.md](./TSS/README.md)


## Notes

- `docker-compose.yaml` is the main entry point for local containerized development
- If you change backend code, rebuild the affected service image before testing
