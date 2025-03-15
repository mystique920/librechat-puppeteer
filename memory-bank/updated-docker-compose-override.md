# Updated LibreChat docker-compose.override.yml

This file defines the recommended docker-compose.override.yml for LibreChat to properly connect to the Puppeteer service while keeping the projects separate.

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
      # Puppeteer service integration
      - PUPPETEER_SERVICE_URL=http://puppeteer-service:3000
      - ENABLE_PUPPETEER_SERVICE=true
  
  metrics:
    image: ghcr.io/virtuos/librechat_exporter:main
    depends_on:
      - mongodb
    ports:
      - "8000:8000"
    restart: unless-stopped

  # Note: We don't define puppeteer-service here since it's in a separate project
  # Instead, we use network connections and environment variables for integration
```

## Integration Instructions

Since you're keeping the Puppeteer service as a separate project, follow these steps for integration:

1. **First, start the Puppeteer service** in its own directory:
   ```bash
   # From ~/Puppeteer directory
   ./run-with-network.sh librechat_default
   ```
   
   This script will:
   - Connect to the LibreChat network
   - Create the mcp-services network if needed
   - Start the Puppeteer service
   - Verify connectivity

2. **Then, start or restart LibreChat** with the updated override file:
   ```bash
   # From ~/LibreChat directory
   docker-compose down
   docker-compose up -d
   ```

## Verification

After both services are running, verify the connection:

```bash
# Check if LibreChat can reach the Puppeteer service
docker exec librechat-api curl -s http://puppeteer-service:3000/health
```

## Benefits of This Approach

- Keeps projects separate and cleanly organized
- Allows independent development and updates
- Provides clear service boundaries
- Simpler configuration management