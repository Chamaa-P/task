FROM postgres:15-alpine

# Set environment variables (can be overridden by fly.toml)
ENV POSTGRES_USER=taskuser
ENV POSTGRES_PASSWORD=taskpass
ENV POSTGRES_DB=taskcollab

# Expose PostgreSQL port
EXPOSE 5432

# Use a volume for data persistence
VOLUME /var/lib/postgresql/data
