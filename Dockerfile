# Multi-stage build for RecycleMaster
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

# Build argument for API key (provided by Coolify)
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Build the application
RUN npm run build

# Stage 2: Production image with nginx
FROM nginx:alpine

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy built assets from builder stage (includes public assets)
COPY --from=builder /app/dist /usr/share/nginx/html

# Set default port (can be overridden by Coolify)
ENV PORT=80

# Expose the port
EXPOSE ${PORT}

# Health check - uses PORT variable
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Start nginx (nginx will automatically process templates in /etc/nginx/templates/)
CMD ["nginx", "-g", "daemon off;"]
