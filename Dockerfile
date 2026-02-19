# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install since package-lock.json doesn't exist)
RUN npm install

# Copy application code
COPY . .

# Build production bundle
RUN npm run build

# Serve stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the frontend
RUN npm install -g serve

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -q --spider http://localhost:5173/ || exit 1

# Start frontend server
CMD ["serve", "-s", "dist", "-l", "5173"]
