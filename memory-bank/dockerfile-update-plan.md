# Dockerfile Update Plan for MCP SDK Installation

The current approach for installing the MCP SDK in the Dockerfile isn't working reliably. Let's create a more robust approach that ensures the SDK is properly installed and available.

## Current Installation Section

```dockerfile
# Copy package files and install dependencies
COPY package*.json ./
RUN npm install && npm install @modelcontextprotocol/sdk@1.7.0
```

## Updated Installation Section

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

## Alternative Direct Download Approach

If the npm installation continues to fail, we can try downloading and extracting the package directly:

```dockerfile
# Copy package files and install dependencies
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

## Multi-Stage Build Approach

As a more comprehensive solution, we could use a multi-stage build to ensure the SDK is properly installed:

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
# ... rest of the Dockerfile as before
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
```

## Implementation Steps

1. Start with the updated installation section that includes verification
2. If that fails, try the alternative direct download approach
3. If both approaches fail, implement the multi-stage build as a final solution
4. Verify the build completes successfully with `docker build -t puppeteer-service .`

## Expected Outcome

After implementing these changes, the TypeScript compiler should be able to find the MCP SDK module, and the build should complete successfully.