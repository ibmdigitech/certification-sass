Docker Compose deployment notes

Quick local deployment:

1. Copy `.env.example` to `.env` and update values if needed.
2. Build and start services:

```bash
docker-compose up --build
```

3. Inside the running `app` container run migrations and seed:

```bash
# generate client
docker-compose exec app npx prisma generate
# run migrations (interactive)
docker-compose exec app npx prisma migrate dev --name init
# seed (if configured)
docker-compose exec app npm run seed
```

Notes:
- `app` service mounts the local directory; for production remove the volume and use a built image.
- Set `NEXTAUTH_SECRET`, `DATABASE_URL`, and SMTP/S3 env vars before running in prod.
- For production consider using managed Postgres and removing the `db` service from compose.

Kubernetes / Cloud:
- Provide Docker image build and push steps in CI.
- Create Kubernetes manifests or Helm chart that include Deployment, Service, Secret (for env), PersistentVolumeClaim for Postgres, and Job for running migrations.

