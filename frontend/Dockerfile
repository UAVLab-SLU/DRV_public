# ── Builder: install deps + compile (used only for production target) ─────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
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
# npm install runs on every start so packages always match the mounted
# package.json, regardless of what is in the host node_modules.
FROM node:22-alpine
WORKDIR /app
EXPOSE 3000
CMD ["sh", "-c", "npm install && npm run dev"]
