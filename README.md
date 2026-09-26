# Docker Compose Master Lab

A hands-on Docker Compose project built to understand and practice multi-container applications, service networking, persistence, health checks, secrets, reverse proxying, and container configuration.

This is a **learning lab**, separate from my main DevOps project **DevOps TaskFlow**.

## Architecture

```text
                         Browser
                            │
                            │ localhost:8080
                            ▼
                     ┌─────────────┐
                     │    Nginx    │
                     │ Reverse     │
                     │   Proxy     │
                     └──────┬──────┘
                            │
                      frontend network
                            │
                            ▼
                     ┌─────────────┐
                     │  Node.js    │
                     │     API     │
                     └──────┬──────┘
                            │
                     backend network
                       ┌────┴────┐
                       │         │
                       ▼         ▼
                ┌──────────┐  ┌─────────┐
                │PostgreSQL│  │  Redis  │
                └──────────┘  └────┬────┘
                                   │
                                   ▼
                              ┌─────────┐
                              │ Worker  │
                              └─────────┘
```

## Services

| Service  | Technology        | Purpose                        |
| -------- | ----------------- | ------------------------------ |
| `api`    | Node.js + Express | Main backend API               |
| `db`     | PostgreSQL        | Persistent relational database |
| `redis`  | Redis             | Cache / shared state           |
| `worker` | Node.js           | Background worker              |
| `nginx`  | Nginx             | Reverse proxy                  |

## What I Practiced

### Docker Compose

* Services
* `build`
* `image`
* `container_name`
* `ports`
* `expose`
* `environment`
* `.env`
* `env_file`
* `volumes`
* Bind mounts
* Named volumes
* Read-only mounts
* Custom networks
* Service discovery
* `depends_on`
* Health checks
* Restart policies
* `command`
* Profiles
* Build arguments
* Secrets

### Networking

The project uses two custom networks:

```text
frontend
backend
```

The `frontend` network connects:

```text
Nginx ↔ API
```

The `backend` network connects:

```text
API ↔ PostgreSQL
API ↔ Redis
Worker ↔ Redis
```

The backend network is marked as:

```yaml
internal: true
```

so it is isolated from external access.

Services communicate using their **Compose service names** instead of `localhost`.

For example:

```text
api → redis:6379
api → db:5432
```

## Persistence

PostgreSQL uses a named volume:

```yaml
postgres_data:
```

Redis uses:

```yaml
redis_data:
```

This allows data to survive container recreation.

```bash
docker compose down
```

does not remove named volumes.

While:

```bash
docker compose down -v
```

removes the volumes and their stored data.

## Health Checks

Each important service has a health check.

### PostgreSQL

Uses:

```bash
pg_isready
```

### Redis

Uses:

```bash
redis-cli ping
```

### API

The API health check requests:

```text
/health
```

The API checks both:

```text
PostgreSQL
Redis
```

and returns a healthy status only when both dependencies are available.

This is also used with:

```yaml
depends_on:
  condition: service_healthy
```

so dependent services wait for the required service to become healthy.

## Secrets

The PostgreSQL password is stored locally in:

```text
secrets/db_password.txt
```

and mounted inside containers as:

```text
/run/secrets/db_password
```

The secret is intentionally excluded from Git.

The application reads the secret from the mounted file instead of storing the password directly in the Compose file.

## API Endpoints

### Home

```text
GET /
```

Returns basic application information.

### Health

```text
GET /health
```

Checks:

* API
* PostgreSQL
* Redis

### Users

```text
GET /users
```

Returns users stored in PostgreSQL.

### Cache

```text
GET /cache
```

Increments and returns a Redis counter.

Example:

```json
{
  "visits": 1
}
```

Calling the endpoint again increments the value.

## Nginx Reverse Proxy

Nginx listens on container port `80`.

Compose publishes it as:

```text
localhost:8080
```

Traffic flows through:

```text
localhost:8080
        ↓
Nginx
        ↓
api:3000
```

The API itself is not directly published to the host.

It uses:

```yaml
expose:
  - "3000"
```

instead of `ports`.

## Worker

The worker is a separate background service.

It connects to Redis and periodically reads the `visits` value.

The worker is placed behind a Compose profile:

```yaml
profiles:
  - worker
```

It can be started with:

```bash
docker compose --profile worker up -d
```

## Useful Commands

### Start the application

```bash
docker compose up -d --build
```

### Check services

```bash
docker compose ps
```

### View logs

```bash
docker compose logs
```

For a specific service:

```bash
docker compose logs api
docker compose logs db
docker compose logs redis
docker compose logs nginx
```

### Follow logs

```bash
docker compose logs -f api
```

### Stop containers

```bash
docker compose down
```

### Stop and remove volumes

```bash
docker compose down -v
```

### Start the worker profile

```bash
docker compose --profile worker up -d
```

### Validate the Compose file

```bash
docker compose config
```

## Testing

After starting the stack:

```bash
curl http://localhost:8080
```

Health check:

```bash
curl http://localhost:8080/health
```

Redis test:

```bash
curl http://localhost:8080/cache
```

Example:

```text
{"visits":1}
{"visits":2}
{"visits":3}
```

## Project Structure

```text
docker-compose-master-lab/
│
├── compose.yaml
├── .env
├── .env.example
├── .gitignore
│
├── api/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── server.js
│
├── worker/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── worker.js
│
├── nginx/
│   └── nginx.conf
│
├── postgres/
│   └── init.sql
│
├── config/
│   └── app.conf
│
└── secrets/
    └── db_password.txt
```

## Key Concepts Learned

The main goal of this project was not simply to make the application run.

I used the project to understand how multiple containers work together as one application:

```text
Container
    ↓
Service
    ↓
Network
    ↓
Dependency
    ↓
Health Check
    ↓
Persistent Data
    ↓
Reverse Proxy
```

It also helped me understand the difference between:

* `ports` vs `expose`
* bind mounts vs named volumes
* environment variables vs secrets
* container startup vs service health
* `localhost` vs service names
* build-time `ARG` vs runtime `ENV`
* normal containers vs profile-based services

## Status

**Completed**

This lab is part of my DevOps learning journey and was built to practice Docker Compose concepts before moving deeper into cloud infrastructure and CI/CD.
