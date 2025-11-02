# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm install 

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the application
RUN npm run build

# Stage 3: Development Runner
FROM node:18-alpine AS development
WORKDIR /app

ENV NODE_ENV=development

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application files
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Stage 4: Production Runner (standalone output for Nginx)
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]

