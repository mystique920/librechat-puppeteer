# Running Chromium in Docker: Best Practices

## Core Considerations for a Working Implementation

This document outlines the key considerations and best practices for running Chromium in a Docker container as part of our Puppeteer service implementation. Our focus is on building a solution that works first, with optimization to follow.

## Essential Requirements

### System Dependencies

The current Dockerfile already includes most essential dependencies, but these are critical for Chromium to work in a containerized environment:

```bash
# Critical dependencies for Chromium
RUN apt-get update && apt-get install -y \
    # Libraries required by Chromium
    gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
    libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 ca-certificates fonts-liberation libappindicator3-1 libnss3 \
    lsb-release xdg-utils wget
```

Verify this list against the [most recent Puppeteer documentation](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix) as requirements can change with new Chromium versions.

### Running as Non-Root User

Security best practice (already implemented in our Dockerfile):

```bash
# Create a non-root user to run Puppeteer
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything as non-root user
USER pptruser
```

### Essential Browser Launch Flags

When launching the browser in our code, include these flags for stability:

```typescript
const browser = await puppeteer.launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu'
  ],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
  headless: true
});
```

## Common Issues & Solutions

### Shared Memory Issue

Problem: Chromium may crash with "Out of memory" or `/dev/shm` related errors.

Solution: The `--disable-dev-shm-usage` flag forces Chromium to use `/tmp` instead of `/dev/shm`. Alternatively, increase shared memory in docker-compose.yml:

```yaml
services:
  puppeteer-service:
    # ...other configuration
    shm_size: 1gb
```

### Zombie Process Prevention

Problem: Chromium processes may not properly terminate.

Solution:
1. Implement proper browser cleanup:

```typescript
// Ensure browser is closed properly
process.on('exit', () => {
  if (browser) browser.close();
});

// Handle termination signals
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, async () => {
    if (browser) await browser.close();
    process.exit(0);
  });
});
```

2. Use a browser instance pool with proper lifecycle management.

### Container Resource Limits

For a working first implementation, set reasonable limits in docker-compose.yml:

```yaml
services:
  puppeteer-service:
    # ...other configuration
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
```

## Best Practices for a Working Implementation

1. **Simple Browser Management First**: Start with a single browser instance before implementing a complex pool.

2. **Testing Inside Container**: Test Puppeteer scripts inside the container to verify operation.

3. **Comprehensive Logging**: Log Puppeteer operations extensively for debugging.

4. **Proper Error Handling**: Implement try/catch blocks around all Puppeteer operations with specific error types.

5. **Health Checks**: Implement Docker health checks to verify browser operability:

```dockerfile
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
  CMD node /app/healthcheck.js || exit 1
```

6. **Page Timeout Configuration**: Set reasonable timeouts:

```typescript
const page = await browser.newPage();
await page.setDefaultNavigationTimeout(60000); // 60 seconds
await page.setDefaultTimeout(30000); // 30 seconds
```

## Implementation Priority

1. First, get a single Chromium instance working reliably in the container
2. Implement basic Puppeteer operations (navigation, screenshots, content extraction)
3. Create simple API endpoints to test these operations
4. Then expand to more complex features (SSE, browser pool, etc.)

## Verification Steps

1. Build the Docker image
2. Run a container with a simple test script
3. Verify Chromium launches successfully
4. Test basic navigation and screenshot capability
5. Check resource usage
6. Validate error handling and clean shutdown

We'll prioritize a working implementation first and address optimization later as needed.