FROM oven/bun

WORKDIR /app

COPY package.json .
COPY bun.lockb .

RUN bun install --production

COPY index.js .
# COPY public public

ENV NODE_ENV production
CMD ["bun", "index.js"]

EXPOSE 3005
