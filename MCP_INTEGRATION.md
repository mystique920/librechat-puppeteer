# Puppeteer Service MCP Integration

This document explains how to integrate the Puppeteer service with LibreChat using the Model Context Protocol (MCP).

## Overview

The Puppeteer service supports two modes of operation:

1. **REST API Mode** (default): Exposes RESTful endpoints on port 3007
2. **MCP Mode**: Implements the Model Context Protocol for direct integration with LibreChat

### MCP Connection Methods

| Method | Status | Description |
|--------|--------|-------------|
| **stdio** | ✅ Available | Connect using Docker exec and stdin/stdout (default) |
| **SSE** | 🚧 In Development | Connect using HTTP Server-Sent Events (coming soon) |

## Running in MCP Mode (stdio)

To start the Puppeteer service in MCP mode:

```bash
# Start the service in MCP mode, connecting to the LibreChat network
./start-mcp.sh librechat_default
```

This script:
- Connects to the specified LibreChat network
- Creates the mcp-services network if needed
- Starts the Puppeteer service in MCP mode

## Configuring LibreChat

To enable LibreChat to use the Puppeteer service via MCP:

1. Add the Puppeteer service configuration to your `librechat.yaml` file:

```yaml
mcpServers:
  puppeteer-service:
    type: stdio
    command: docker
    args:
      - exec
      - -i
      - puppeteer-service
      - node
      - /app/dist/index.js
    env:
      - MCP_MODE=true
    timeout: 300000
```

2. Restart LibreChat to apply the changes:

```bash
# From the LibreChat directory
docker-compose down
docker-compose up -d
```

## Available MCP Tools

The Puppeteer service exposes the following MCP tools:

### Browser Management

- `create_browser`: Create a new browser instance
- `close_browser`: Close a browser instance
- `list_browsers`: List all active browser instances

### Page Navigation

- `create_page`: Create a new page in a browser instance
- `navigate_to`: Navigate to a URL in a page
- `get_page_content`: Get the HTML content of a page
- `close_page`: Close a page

### Screenshots

- `take_screenshot`: Take a screenshot of a page

## Available MCP Resources

The Puppeteer service exposes the following MCP resources:

- `puppeteer://browsers`: List of active browser instances
- `puppeteer://browser/{browserId}/page/{pageId}/screenshot`: Screenshot of a specific page
- `puppeteer://browser/{browserId}/page/{pageId}/content`: HTML content of a specific page

## Example Usage in LibreChat

Once configured, you can use the Puppeteer tools in LibreChat like this:

```
Create a browser and navigate to Google.com, then take a screenshot.
```

LibreChat will use the MCP tools to:
1. Create a browser instance
2. Create a page
3. Navigate to Google.com
4. Take a screenshot
5. Display the screenshot in the chat

## Upcoming: MCP over SSE (Server-Sent Events)

We are actively developing support for MCP over Server-Sent Events (SSE), which will provide an HTTP-based alternative to the current stdio approach. This will allow:

- Connection without Docker exec permissions
- More deployment flexibility
- Potentially more stable connections for long-running sessions

This feature is not yet available but is under active development. See `memory-bank/mcp-sse-implementation-plan.md` for details on the implementation plan.

When implemented, it will enable configuration like:

```yaml
mcpServers:
  puppeteer-service:
    type: sse
    url: http://puppeteer-service:3000/mcp-sse
    timeout: 300000
```

## Troubleshooting

If you encounter issues:

1. Check that the Puppeteer service is running in MCP mode:
   ```bash
   docker logs puppeteer-service
   ```

2. Verify network connectivity:
   ```bash
   docker network inspect librechat_default | grep puppeteer-service
   ```

3. Check LibreChat logs for MCP-related errors:
   ```bash
   docker logs librechat-api | grep MCP
   ```

4. Verify the MCP SDK is properly installed:
   ```bash
   docker exec -it puppeteer-service npm list @modelcontextprotocol/sdk
   ```

## Running in REST API Mode

If you prefer to use the REST API mode:

```bash
# Start the service in REST API mode
LIBRECHAT_NETWORK=librechat_default MCP_MODE=false docker-compose up -d
```

The REST API will be available at `http://localhost:3007`.