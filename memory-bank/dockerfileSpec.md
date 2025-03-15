# Dockerfile Specification

Based on our requirements and best practices for running Puppeteer in a Docker container, here's the specification for our updated Dockerfile:

```dockerfile
# Use a Debian slim base image with Node.js 20
FROM node:20-slim

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install required dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    # Essential system utilities
    wget \
    git \
    curl \
    gnupg \
    build-essential \
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

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Install Puppeteer with Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Copy source code
COPY . .

# Build TypeScript files
RUN npm run build

# Create a non-root user to run Puppeteer
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Set default port for the service
EXPOSE 3000

# Health check to verify service is running correctly
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run everything as non-root user for security
USER pptruser

# Start the application
CMD ["node", "dist/index.js"]
```

## Key Changes from Original Dockerfile:

1. **Additional Dependencies**:
   - Added more complete list of Chromium dependencies
   - Added development tools (git, curl, build-essential)
   - Added fonts-freefont-ttf and libxshmfence1

2. **Project Structure Setup**:
   - Added copying of package.json and npm install step
   - Added source code copying and TypeScript build step

3. **Runtime Configuration**:
   - Added health check for container monitoring
   - Updated CMD to run the compiled application
   - Kept non-root user setup for security

## Next Steps:

1. Create package.json with required dependencies
2. Implement basic application structure
3. Test Docker build and verify Chromium runs correctly