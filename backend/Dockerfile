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

# Build TypeScript
RUN npm run build

# Stage 3: Runner (for development)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3001

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application files
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]


