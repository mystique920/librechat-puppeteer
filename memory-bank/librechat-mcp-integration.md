# LibreChat MCP Integration for Puppeteer Service

Thank you for sharing the `librechat.yaml` example. This significantly changes our approach to integration! I now understand that LibreChat uses the Model Context Protocol (MCP) to connect to services like Puppeteer.

## Understanding LibreChat's MCP Architecture

LibreChat has two different ways to integrate with external services:

1. **MCP Protocol Integration** (preferred method):
   - Uses `librechat.yaml` to define MCP servers
   - Supports different connection types (stdio, sse, etc.)
   - Natively connects to standard MCP servers

2. **Custom API Integration** (alternative method):
   - Uses environment variables like `PUPPETEER_SERVICE_URL`
   - Requires LibreChat to have custom code for this integration
   - More limited in functionality

## Revised Integration Plan

Based on this new information, we have two options:

### Option 1: Implement MCP Protocol in Our Puppeteer Service (Recommended)

This would involve modifying our current Puppeteer service to implement the MCP protocol, making it compatible with LibreChat's native MCP integration.

### Option 2: Use the Standard MCP Puppeteer Server

Instead of using our custom Puppeteer service, use the standard MCP Puppeteer server that LibreChat already supports:

1. **Update LibreChat's librechat.yaml**:

```yaml
mcpServers:
  # Other MCP servers...
  
  puppeteer:
    type: stdio
    command: npx
    args:
      - -y
      - "@modelcontextprotocol/server-puppeteer"
    timeout: 300000  # 5 minutes timeout for this server
```

2. **Update docker-compose.override.yml** to ensure network connectivity:

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

Note that we've removed the environment variables `PUPPETEER_SERVICE_URL` and `ENABLE_PUPPETEER_SERVICE` since these were for a different approach.

## Key Insights

1. **LibreChat's MCP Support**: LibreChat uses the MCP protocol to communicate with tools like Puppeteer
2. **Configuration vs Code**: The integration is primarily through configuration, not custom code
3. **Proper Indentation**: Yes, the indentation in docker-compose.override.yml should be properly aligned under the `environment:` section

## Will LibreChat Have Puppeteer Tools Available?

**Yes, LibreChat will have Puppeteer tools available**, but through the MCP protocol configuration in `librechat.yaml`, not through our custom REST API service directly.

The most reliable approach is to use the standard MCP Puppeteer server package that LibreChat is designed to work with.

## Recommended Next Steps

1. Decide whether to:
   - Continue developing our custom Puppeteer service and adapt it to implement the MCP protocol
   - Use the standard MCP Puppeteer server package that LibreChat already supports

2. Update the appropriate configuration:
   - If using our custom service: Implement MCP protocol support
   - If using standard MCP server: Configure `librechat.yaml` appropriately

3. Ensure network connectivity for either approach