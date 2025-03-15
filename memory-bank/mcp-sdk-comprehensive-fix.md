# Comprehensive MCP SDK Integration Fix

Based on our analysis, we need a multi-pronged solution to fully fix the MCP SDK integration:

## 1. Fix Import Style Consistency

Update all SDK imports to follow the same pattern. Since we already have working imports in most files, we should update `mcp-test.ts` to match:

```typescript
// FROM:
import { Server } from '@modelcontextprotocol/sdk';

// TO:
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
```

## 2. Enhanced SDK Installation in Docker

Create a robust installation process in the Dockerfile:

```dockerfile
# Install dependencies with detailed verification
COPY package*.json ./
RUN npm install && \
    # Force install the MCP SDK with maximum verbosity
    npm install @modelcontextprotocol/sdk@1.7.0 --verbose && \
    # Verify the installation
    echo "Checking MCP SDK installation:" && \
    ls -la node_modules/@modelcontextprotocol && \
    npm list @modelcontextprotocol/sdk
```

## 3. Alternative Installation Method

If the npm approach continues to fail, we can download and install the package directly:

```dockerfile
# Download and extract the package directly from npm registry
RUN mkdir -p /app/node_modules/@modelcontextprotocol && \
    curl -L https://registry.npmjs.org/@modelcontextprotocol/sdk/-/sdk-1.7.0.tgz -o /tmp/mcp-sdk.tgz && \
    tar -xzf /tmp/mcp-sdk.tgz -C /tmp && \
    cp -r /tmp/package/* /app/node_modules/@modelcontextprotocol/sdk/ && \
    rm -rf /tmp/package /tmp/mcp-sdk.tgz
```

## 4. Implementation Order

1. Update the import in `mcp-test.ts` first
2. Modify the Dockerfile to use the enhanced SDK installation
3. If that fails, try the direct download approach
4. If all else fails, consider adding the SDK files directly into the repo (as a last resort)

## 5. Testing the Fix

After implementing the changes, test the build with:

```bash
docker build -t puppeteer-service .
```

If the build succeeds, verify the MCP functionality works by running:

```bash
docker run -e MCP_MODE=true -p 3000:3000 puppeteer-service
```

## Possible Additional Considerations

- We may need to check if there are version incompatibilities between our code and the SDK
- The TypeScript configuration might need further tweaking if there are module resolution issues
- We should examine any type declaration files to ensure they're properly set up