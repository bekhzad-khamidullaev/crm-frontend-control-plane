# Multi-stage build for production-ready React app
# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application for production
ARG BUILD_MODE=production
ENV NODE_ENV=production

# Build with the specified mode
RUN npm run build:${BUILD_MODE}

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf.http-only /etc/nginx/conf.d/windevs.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /var/www/windevs.uz/dist

# Create runtime config injection script
RUN echo '#!/bin/sh' > /docker-entrypoint.d/99-inject-config.sh && \
    echo 'cat > /var/www/windevs.uz/dist/config.js << EOF' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo 'window.__APP_CONFIG__ = {' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  apiBaseUrl: "${API_BASE_URL:-https://crm.windevs.uz}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  apiPrefix: "${API_PREFIX:-/api}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  pbxServer: "${PBX_SERVER:-wss://pbx.windevs.uz:5061}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '};' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo 'EOF' >> /docker-entrypoint.d/99-inject-config.sh && \
    chmod +x /docker-entrypoint.d/99-inject-config.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
