FROM oven/bun:latest as base
WORKDIR /app

FROM base AS install
# Set user and group
USER root

COPY ./package.json ./bun.lockb ./
COPY ./src ./src

# Create and set ownership of directories
RUN mkdir -p /app/uploads /app/previews && \
    chown -R bun:bun /app/uploads /app/previews

# Install dependencies
RUN bun install --production

FROM base AS release
# Set user and group
USER root

COPY --from=install /app/ .

EXPOSE 3005/tcp
ENTRYPOINT [ "bun", "src/index.ts" ]
