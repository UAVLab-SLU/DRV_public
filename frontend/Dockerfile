# ── Builder: install deps + compile (used only for production target) ─────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production: nginx static file server ──────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' \
    > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ── Dev stage (DEFAULT: must be last) ─────────────────────────────────────────
# Source lives on the bind-mount ./frontend:/app.
# Dependencies are installed at build time and used to seed Compose's
# /app/node_modules volume when its container is first created. At runtime,
# the lockfile hash prevents reinstalling them unless the mounted lockfile changes.
FROM node:22-alpine
WORKDIR /app
# Keep dependencies in an image layer keyed only by the lockfiles. The
# /app/node_modules volume in Compose is initialized from this layer.
COPY package.json package-lock.json ./
RUN npm ci \
    && sha256sum package-lock.json | awk '{print $1}' > node_modules/.package-lock.hash
EXPOSE 3000
CMD ["sh", "-c", "lock_hash=$(sha256sum package-lock.json | awk '{print $1}'); if [ ! -f node_modules/.package-lock.hash ] || [ \"$(cat node_modules/.package-lock.hash)\" != \"$lock_hash\" ]; then npm ci && printf '%s\\n' \"$lock_hash\" > node_modules/.package-lock.hash; fi; exec npm run dev"]
