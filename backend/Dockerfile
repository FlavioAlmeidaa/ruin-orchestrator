FROM oven/bun:1.2-alpine

WORKDIR /app

# Copia shared e backend
COPY shared ../shared
COPY backend/package.json backend/bun.lock ./

RUN bun install --frozen-lockfile

COPY backend/tsconfig.json ./
COPY backend/src ./src

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]
