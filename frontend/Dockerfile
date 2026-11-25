FROM oven/bun:1.2-alpine AS build

WORKDIR /app

# Copia shared e frontend
COPY shared ../shared
COPY frontend/package.json frontend/bun.lock ./

RUN bun install --frozen-lockfile

COPY frontend ./

RUN bun run build

# Servidor estático leve
FROM oven/bun:1.2-alpine

WORKDIR /app
COPY --from=build /app/dist ./dist

# Instala serve simples em bun
EXPOSE 5173

CMD ["bun", "x", "serve", "-s", "dist", "-l", "5173"]
