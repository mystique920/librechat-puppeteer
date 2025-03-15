# LibreChat Docker Compose Override Update

## Current LibreChat docker-compose.override.yml

```yaml
services:
  api:
    volumes:
      - type: bind
        source: ./librechat.yaml
        target: /app/librechat.yaml
      - type: bind
        source: /Users/black/obsidian_vault/mystique
        target: /obsidian-vault
      - type: bind
        source: ./files
        target: /app/files
      - type: bind
        source: /Users/black/LibreChat/mcp-servers
        target: /app/mcp-servers
    environment:
      #  - BRAVE_API_KEY=${BRAVE_API_KEY}
      #  - NODE_ENV=production
  
  metrics:
    image: ghcr.io/virtuos/librechat_exporter:main
    depends_on:
      - mongodb
    ports:
      - "8000:8000"
    restart: unless-stopped
```

## Recommended Updates for Puppeteer Service Integration

Add the following to the existing docker-compose.override.yml file in the LibreChat directory:

```yaml
services:
  api:
    # Keep existing volumes and environment variables
    volumes:
      - type: bind
        source: ./librechat.yaml
        target: /app/librechat.yaml
      - type: bind
        source: /Users/black/obsidian_vault/mystique
        target: /obsidian-vault
      - type: bind
        source: ./files
        target: /app/files
      - type: bind
        source: /Users/black/LibreChat/mcp-servers
        target: /app/mcp-servers
    environment:
      #  - BRAVE_API_KEY=${BRAVE_API_KEY}
      #  - NODE_ENV=production
      # Add these new environment variables for Puppeteer integration
      - PUPPETEER_SERVICE_URL=http://puppeteer-service:3000
      - ENABLE_PUPPETEER_SERVICE=true
  
  # Keep the existing metrics service
  metrics:
    image: ghcr.io/virtuos/librechat_exporter:main
    depends_on:
      - mongodb
    ports:
      - "8000:8000"
    restart: unless-stopped
  
  # Add our Puppeteer service
  puppeteer-service:
    image: puppeteer-service:latest
    container_name: puppeteer-service
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
      - LIBRECHAT_API_URL=http://api:3080
    restart: unless-stopped
    shm_size: 1gb
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

## Implementation Steps

1. Update the LibreChat docker-compose.override.yml file with the changes above.

2. Build the Puppeteer service image (if not already built):
   ```bash
   # From the Puppeteer service directory
   docker build -t puppeteer-service .
   ```

3. Restart LibreChat with the updated configuration:
   ```bash
   # From the LibreChat directory
   docker-compose down
   docker-compose up -d
   ```

4. Verify the integration:
   ```bash
   # Check if the Puppeteer service is running
   docker ps | grep puppeteer-service
   
   # Check if LibreChat can reach the Puppeteer service
   docker exec librechat-api curl -s http://puppeteer-service:3000/health
   ```

## Alternative Approach: Run Puppeteer Service Separately

If you prefer to run the Puppeteer service separately:

1. Start the Puppeteer service from its directory:
   ```bash
   # From the Puppeteer service directory
   # Replace librechat_default with the appropriate network name if different
   LIBRECHAT_NETWORK=librechat_default docker-compose up -d
   ```

2. Only add the environment variables to LibreChat's override file:
   ```yaml
   services:
     api:
       # Keep existing configuration
       environment:
         # Keep existing environment variables
         - PUPPETEER_SERVICE_URL=http://puppeteer-service:3000
         - ENABLE_PUPPETEER_SERVICE=true
   ```

## Notes

- The Puppeteer service needs to be on the same Docker network as LibreChat.
- If you're running multiple instances of LibreChat (as indicated by the multiple networks), you'll need to decide which one to integrate with.
- The `image: puppeteer-service:latest` assumes you've built the image locally. If you're using a different tag or registry, adjust accordingly.