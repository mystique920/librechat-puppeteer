# MCP SDK Implementation Guide

This guide combines all our solutions into a comprehensive implementation plan to address the MCP SDK integration issues.

## Summary of Issues

1. **Import Style Inconsistency**: The `mcp-test.ts` file uses a different import style (`@modelcontextprotocol/sdk`) than our other MCP files (`@modelcontextprotocol/sdk/server/index.js`).

2. **SDK Installation Failure**: The current approach to installing the MCP SDK in the Dockerfile isn't working correctly.

3. **TypeScript Configuration**: Our TypeScript configuration (`"moduleResolution": "NodeNext"`) requires explicit file extensions in imports.

## Implementation Steps

### Phase 1: Fix the Import Style

1. Update `src/mcp-test.ts` to use the correct import style:
   ```typescript
   // FROM:
   import { Server } from '@modelcontextprotocol/sdk';
   
   // TO:
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   ```

### Phase 2: Enhance the Dockerfile

2. Update the Dockerfile to use a more robust SDK installation approach:

   **Option A: Enhanced npm Installation (Try First)**
   ```dockerfile
   # Copy package files and install dependencies with verification
   COPY package*.json ./
   RUN npm install && \
       echo "Explicitly installing MCP SDK..." && \
       npm install @modelcontextprotocol/sdk@1.7.0 --verbose && \
       echo "Verifying MCP SDK installation:" && \
       ls -la node_modules/@modelcontextprotocol || echo "SDK directory not found" && \
       npm list @modelcontextprotocol/sdk || echo "SDK not in dependency tree"
   ```

   **Option B: Direct Download Approach (If Option A Fails)**
   ```dockerfile
   # Copy package files and install dependencies with direct SDK download
   COPY package*.json ./
   RUN npm install && \
       echo "Directly downloading and installing MCP SDK..." && \
       mkdir -p node_modules/@modelcontextprotocol/sdk && \
       curl -L https://registry.npmjs.org/@modelcontextprotocol/sdk/-/sdk-1.7.0.tgz -o /tmp/mcp-sdk.tgz && \
       tar -xzf /tmp/mcp-sdk.tgz -C /tmp && \
       cp -r /tmp/package/* node_modules/@modelcontextprotocol/sdk/ && \
       rm -rf /tmp/package /tmp/mcp-sdk.tgz && \
       echo "Verifying direct SDK installation:" && \
       ls -la node_modules/@modelcontextprotocol/sdk
   ```

   **Option C: Multi-Stage Build (Final Resort)**
   ```dockerfile
   # First stage - build dependencies
   FROM node:20-slim AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   RUN npm install @modelcontextprotocol/sdk@1.7.0 --verbose
   RUN ls -la node_modules/@modelcontextprotocol

   # Second stage - build the application
   FROM node:20-slim
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   # ... rest of the Dockerfile
   ```

### Phase 3: Verification and Testing

3. Build the Docker image:
   ```bash
   docker build -t puppeteer-service .
   ```

4. If build succeeds, test the MCP functionality:
   ```bash
   docker run -e MCP_MODE=true -p 3000:3000 puppeteer-service
   ```

## Implementation Order

1. Start with Phase 1: Update the import style in `mcp-test.ts`
2. Then try Option A from Phase 2
3. If Option A fails, try Option B
4. If Option B fails, implement Option C
5. Finally, verify and test with Phase 3

## Expected Outcomes

- TypeScript compilation should complete without errors
- The Docker build should succeed
- The MCP server should start correctly when run in MCP mode

## Further Considerations

If these solutions still don't resolve the issue, additional debugging steps may be necessary:

1. Check if there are version incompatibilities between our code and the SDK
2. Examine whether we need to add type declarations for the SDK
3. Consider whether a different version of the SDK might be more compatible

## Switching to Code Mode

Once you've reviewed this implementation guide, we recommend switching to Code mode to implement these changes and fix the MCP SDK integration.