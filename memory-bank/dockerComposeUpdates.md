# Docker Compose Updates for Network Integration

## Current docker-compose.yml

```yaml
version: '3.8'

services:
  puppeteer-service:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: puppeteer-service
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - ./dist:/app/dist
      - ./node_modules:/app/node_modules
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    restart: unless-stopped
    # Increase shared memory size for Chromium
    shm_size: 1gb
    # Set resource limits
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
    # Add healthcheck
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

## Proposed Updates

We need to add network configurations to the docker-compose.yml file to integrate with the LibreChat environment. Here's the updated configuration:

```yaml
version: '3.8'

networks:
  librechat_default:
    external: true
  mcp-services:
    driver: bridge

services:
  puppeteer-service:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: puppeteer-service
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - ./dist:/app/dist
      - ./node_modules:/app/node_modules
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
      # Add LibreChat API URL for integration testing
      - LIBRECHAT_API_URL=http://LibreChat:3080
    restart: unless-stopped
    # Increase shared memory size for Chromium
    shm_size: 1gb
    # Set resource limits
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
    # Add healthcheck
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    # Add network configuration
    networks:
      - librechat_default
      - mcp-services
```

## Implementation Steps

1. Create the MCP Services network:
   ```bash
   docker network create mcp-services
   ```

2. Update the docker-compose.yml file with the changes above.

3. Restart the Puppeteer service:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

4. Verify network connections:
   ```bash
   docker network inspect librechat_default
   docker network inspect mcp-services
   ```

## Important Notes

1. The `librechat_default` network name might be different based on the actual Docker Compose project name for LibreChat. It could be something like `librechat_default` or `librechat-network`. You should verify the actual network name using `docker network ls`.

2. You may need to adjust the `LIBRECHAT_API_URL` environment variable based on the actual container name and port of the LibreChat API service.

3. The external network property indicates that this network is managed outside of this docker-compose file. This allows our Puppeteer service to join the existing LibreChat network.