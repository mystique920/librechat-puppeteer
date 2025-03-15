# MCP SDK Installation Strategies

Since the regular npm installation approach isn't working, here are alternative strategies to ensure the MCP SDK is available in the Docker image:

## Strategy 1: Direct Download and Manual Installation

```dockerfile
# Add a specific step just for the MCP SDK with verbose output
RUN npm install && \
    echo "Installing MCP SDK directly..." && \
    npm install @modelcontextprotocol/sdk@1.7.0 --verbose && \
    npm list @modelcontextprotocol/sdk
```

## Strategy 2: Use a Multi-Stage Build with SDK Verification

```dockerfile
# First stage - build dependencies including MCP SDK
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install @modelcontextprotocol/sdk@1.7.0 --verbose
RUN npm list @modelcontextprotocol/sdk
RUN ls -la node_modules/@modelcontextprotocol

# Second stage - build the application
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Final stage - run the application
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# ... rest of the Dockerfile
```

## Strategy 3: Direct URL Download Using curl

```dockerfile
# Download and extract the package directly
RUN mkdir -p /app/node_modules/@modelcontextprotocol && \
    curl -L https://registry.npmjs.org/@modelcontextprotocol/sdk/-/sdk-1.7.0.tgz -o /tmp/mcp-sdk.tgz && \
    tar -xzf /tmp/mcp-sdk.tgz -C /tmp && \
    cp -r /tmp/package/* /app/node_modules/@modelcontextprotocol/sdk/ && \
    rm -rf /tmp/package /tmp/mcp-sdk.tgz
```

## Strategy 4: Use pnpm Instead of npm

Sometimes pnpm resolves dependency issues that npm cannot:

```dockerfile
# Install pnpm
RUN npm install -g pnpm

# Use pnpm to install dependencies
COPY package*.json ./
RUN pnpm install
RUN pnpm add @modelcontextprotocol/sdk@1.7.0
```

## Strategy 5: Debugging SDK Installation

Add debugging steps to figure out why the SDK installation is failing:

```dockerfile
# Debug the MCP SDK installation
RUN npm install && \
    npm install @modelcontextprotocol/sdk@1.7.0 --verbose && \
    echo "Checking SDK installation:" && \
    ls -la node_modules/@modelcontextprotocol || echo "SDK directory not found" && \
    npm list @modelcontextprotocol/sdk || echo "SDK not in dependency tree" && \
    find node_modules -name "*modelcontextprotocol*" || echo "No MCP files found"
```

## Strategy 6: Examine and Fix mcp-test.ts

The error specifically mentions `src/mcp-test.ts` - we should examine this file and ensure it's using the correct import path. It might be trying to import the SDK in a way that's incompatible with how we're installing it.

## Next Steps:

1. Examine the `src/mcp-test.ts` file to see how it's importing the SDK
2. Try Strategy 5 first to debug why the SDK installation is failing
3. Based on the debugging results, implement one of the other strategies
4. Consider whether we need to add TypeScript configuration adjustments to properly recognize the SDK