# Use a Debian slim base image with Node.js 20
FROM node:20-slim
ARG TARGETPLATFORM=linux/amd64
# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Chromium and required dependencies directly from Debian repositories
RUN apt-get update && apt-get install -y \
    # Essential system utilities
    wget \
    git \
    curl \
    gnupg \
    build-essential \
    # Install Chromium browser from Debian repositories
    chromium \
    chromium-driver \
    # Libraries required by Chromium
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    # Additional libraries
    ca-certificates \
    fonts-liberation \
    fonts-freefont-ttf \
    libappindicator3-1 \
    libnss3 \
    libxshmfence1 \
    lsb-release \
    xdg-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install global development tools
RUN npm install -g typescript ts-node nodemon

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy package files and install dependencies with verification
COPY package*.json ./
RUN npm install && \
    echo "Explicitly installing MCP SDK..." && \
    npm install @modelcontextprotocol/sdk@1.7.0 --verbose && \
    echo "Verifying MCP SDK installation:" && \
    ls -la node_modules/@modelcontextprotocol || echo "SDK directory not found" && \
    npm list @modelcontextprotocol/sdk || echo "SDK not in dependency tree"

# Copy source code
COPY . .

# Build TypeScript files
RUN npm run build

# Create a non-root user to run Puppeteer
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Set ports for both MCP and REST API modes
EXPOSE 3000 3007

# Health check to verify service is running correctly
# For MCP mode, we can't use a health check since it doesn't have an HTTP endpoint
# For REST API mode, we check the health endpoint on port 3007
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
  CMD bash -c "if [ \"$MCP_MODE\" = \"true\" ]; then exit 0; else curl -f http://localhost:3007/health || exit 1; fi"

# Run everything as non-root user for security
USER pptruser

# Set environment variables with defaults
ENV MCP_MODE=false
ENV REST_PORT=3007

# Start the application
CMD ["node", "dist/index.js"]
