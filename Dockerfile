# Multi-stage build for production-ready React app
# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm set fetch-retries 5 \
    && npm set fetch-retry-mintimeout 20000 \
    && npm set fetch-retry-maxtimeout 120000 \
    && npm ci --only=production=false \
    && npm install --no-save @rollup/rollup-linux-x64-musl

# Copy source code
COPY . .

# Build the application for production
ARG BUILD_MODE=production
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

# Build with the specified mode
RUN npm run build:${BUILD_MODE}

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/windevs.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /var/www/windevs.uz/dist

# Create runtime config injection script
RUN echo '#!/bin/sh' > /docker-entrypoint.d/99-inject-config.sh && \
    echo 'cat > /var/www/windevs.uz/dist/config.js << EOF' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo 'window.__APP_CONFIG__ = {' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  apiBaseUrl: "${API_BASE_URL:-https://crm.windevs.uz}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  apiPrefix: "${API_PREFIX:-/api}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  pbxServer: "${PBX_SERVER:-wss://pbx.windevs.uz:5061}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  WS_URL: "${WS_URL:-${VITE_WS_URL}}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  CHAT_WS_URL: "${CHAT_WS_URL:-${VITE_CHAT_WS_URL}}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  SIP_SERVER: "${SIP_SERVER:-${VITE_SIP_SERVER}}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  STUN_SERVER: "${STUN_SERVER:-${VITE_STUN_SERVER}}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  SIP_REALM: "${SIP_REALM:-${VITE_SIP_REALM}}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  SIP_USERNAME: "${SIP_USERNAME:-${VITE_SIP_USERNAME}}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  SIP_PASSWORD: "${SIP_PASSWORD:-${VITE_SIP_PASSWORD}}",' >> /docker-entrypoint.d/99-inject-config.sh && \
    echo '  SIP_DISPLAY_NAME: "${SIP_DISPLAY_NAME:-${VITE_SIP_DISPLAY_NAME}}",' >> /docker-entrypoint.d/99-inject-config.sh && \
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
