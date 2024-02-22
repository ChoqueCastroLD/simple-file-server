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
RUN bun install --production

FROM base AS release
COPY --from=install /app/ .

USER bun_file_server
EXPOSE 3005/tcp
ENTRYPOINT [ "bun", "src/index.ts" ]
