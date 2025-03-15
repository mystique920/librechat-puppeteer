# MCP SDK Implementation Steps

This document provides the specific code changes needed to properly integrate the MCP SDK. Since we can't directly modify code files in Architect mode, this will serve as a guide for implementing in Code mode.

## 1. Update package.json

Add the MCP SDK as a dependency:

```json
"dependencies": {
  "express": "^4.18.2",
  "puppeteer": "^22.0.0",
  "puppeteer-core": "^22.0.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "winston": "^3.11.0",
  "morgan": "^1.10.0",
  "uuid": "^9.0.1",
  "express-validator": "^7.0.1",
  "express-rate-limit": "^7.1.5",
  "http-status-codes": "^2.3.0",
  "@modelcontextprotocol/sdk": "^1.7.0"
}
```

## 2. Update Dockerfile

Modify the Dockerfile to ensure the MCP SDK is installed during the build:

```dockerfile
# Current installation section
COPY package*.json ./
RUN npm install

# Change to:
COPY package*.json ./
RUN npm install && npm install @modelcontextprotocol/sdk@1.7.0
```

This ensures that even if package.json doesn't have the dependency for some reason, it will still be installed during the Docker build.

## 3. Update src/mcp/index.ts

Change the import statements to use the real SDK:

```typescript
// Replace this:
import { Server, StdioServerTransport } from '../mcp-mock';

// With this:
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
```

## 4. Update src/index.ts

Update the MCP mode section to actually start the MCP server:

```typescript
if (isMcpMode) {
  // Simplified MCP mode - just log that it's running
  logger.info('Starting in MCP mode');
  
  // Import and start the MCP server
  import('./mcp').then(({ startMcpServer }) => {
    startMcpServer().then(() => {
      logger.info('MCP server started successfully');
    }).catch(err => {
      logger.error('Failed to start MCP server', { error: err });
      process.exit(1);
    });
  }).catch(err => {
    logger.error('Failed to import MCP module', { error: err });
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: shutting down MCP server');
    puppeteerService.shutdown()
      .then(() => {
        logger.info('Puppeteer service shut down successfully');
        process.exit(0);
      })
      .catch((err) => {
        logger.error('Error shutting down Puppeteer service', { error: err });
        process.exit(1);
      });
  });

  // ... keep existing SIGINT handler ...
}
```

## 5. Fix imports in MCP Tool Files

All files in the `src/mcp` directory will need to have their imports updated. Here's the pattern for each file:

### 5.1 src/mcp/error-codes.ts

```typescript
// Replace:
import { ErrorCode, McpError } from '../mcp-mock';

// With:
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
```

### 5.2 src/mcp/resources/browser.resources.ts

```typescript
// Replace:
import { Server } from '../mcp-mock';
import { ErrorCode, McpError, ListResourcesRequestSchema, ListResourceTemplatesRequestSchema, ReadResourceRequestSchema } from '../mcp-mock';

// With:
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  ErrorCode, 
  McpError,
  ListResourcesRequestSchema, 
  ListResourceTemplatesRequestSchema, 
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
```

### 5.3 src/mcp/resources/index.ts

```typescript
// Replace:
import { Server } from '../mcp-mock';

// With:
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
```

### 5.4 All tool files in src/mcp/tools/

Apply the same pattern to all files in the tools directory. For each file:

```typescript
// Replace:
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ... } from '@modelcontextprotocol/sdk/types.js';

// At the top of:
- src/mcp/tools/browser.tools.ts
- src/mcp/tools/navigation.tools.ts
- src/mcp/tools/screenshot.tools.ts
- src/mcp/tools/index.ts
```

## 6. Handle Type Errors

Fix the TypeScript errors related to implicit any types. For each parameter that is marked with "Parameter 'x' implicitly has an 'any' type", add explicit type annotations:

```typescript
// For example, in src/mcp/tools/browser.tools.ts:
server.setRequestHandler(ListToolsRequestSchema, async (request: any) => {
  // ...
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  // ...
});
```

Later, these should be replaced with proper type definitions from the SDK, but this will get the build working in the short term.

## 7. Handle Unknown Error Types

For errors like "error' is of type 'unknown'", add appropriate type assertions or checks:

```typescript
// For example:
} catch (error) {
  logger.error('MCP: Error creating browser instance', { error });
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
    isError: true,
  };
}
```

## 8. Testing the Implementation

After making these changes:

1. Rebuild the Docker image:
   ```bash
   docker build -t puppeteer-service .
   ```

2. Run the container in MCP mode:
   ```bash
   docker run -e MCP_MODE=true -p 3000:3000 puppeteer-service
   ```

3. If needed, test the service using the test script:
   ```bash
   ./test-puppeteer-api.sh
   ```

## 9. Clean Up (Optional)

Once everything is working, consider:

1. Removing the `src/mcp-mock` directory if it's no longer needed
2. Updating the `src/mcp-test.ts` file to use the real SDK
3. Adding proper TypeScript type definitions for all MCP handlers