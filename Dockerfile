# Multi-stage production build for Cogniviz Billing System
FROM node:20-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package descriptors
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client & Build Client and Server
RUN cd server && npx prisma generate
RUN cd client && npm run build
RUN cd server && npm run build
RUN mkdir -p server/dist/templates && cp -r server/src/templates/* server/dist/templates/ 2>/dev/null || true

# Production Runner Stage
FROM node:20-slim AS runner

WORKDIR /app

# Install chromium & certificates for PDF generation
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    chromium \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/node_modules ./node_modules
RUN ln -s /app/node_modules /app/server/node_modules 2>/dev/null || true
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/src/templates ./server/src/templates

EXPOSE 5000

CMD ["node", "server/dist/index.js"]

