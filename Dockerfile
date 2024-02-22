FROM oven/bun:latest as base
WORKDIR /app

FROM base AS install
# ARG NODE_VERSION=20
# RUN apt update \
#     && apt install -y curl
# RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n \
#     && bash n $NODE_VERSION \
#     && rm n \
#     && npm install -g n

COPY ./package.json ./bun.lockb ./
COPY ./src ./src
RUN mkdir -p /app/uploads && \
    chown -R bun:bun /app/uploads
RUN mkdir -p /app/previews && \
    chown -R bun:bun /app/previews
RUN bun install --production

FROM base AS release
COPY --from=install /app/ .

USER bun
EXPOSE 3005/tcp
ENTRYPOINT [ "bun", "src/index.ts" ]
