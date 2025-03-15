# MCP SDK Integration Plan

## Problem Analysis

The Docker build is failing because the TypeScript compiler can't find the MCP SDK modules:

```
error TS2307: Cannot find module '@modelcontextprotocol/sdk' or its corresponding type declarations.
```

### Root Causes:

1. The `@modelcontextprotocol/sdk` package is not installed in the project
2. The code is trying to import from the real SDK but using a mock implementation 
3. The mock implementation is incompatible with how the code is structured

### Current Architecture:

- `src/mcp-mock/` - Contains a minimal mock implementation of the MCP SDK
- `src/mcp/` - Contains the actual MCP server implementation that tries to import from the real SDK
- `src/index.ts` - Has a flag for MCP mode but doesn't actually start the MCP server

## Solution Strategy

Our approach will be to properly integrate the official MCP SDK (version 1.7.0) rather than continuing with the mock implementation.

### 1. Update Dockerfile

Modify the Dockerfile to install the MCP SDK during the build process:

```dockerfile
# Update package dependencies installation
COPY package*.json ./
RUN npm install && npm install @modelcontextprotocol/sdk@1.7.0
```

### 2. Update package.json

Add the MCP SDK as a regular dependency:

```json
"dependencies": {
  // ... existing dependencies
  "@modelcontextprotocol/sdk": "^1.7.0"
}
```

### 3. Update MCP Implementation

Replace usage of the mock implementation with the real SDK:

- Update `src/mcp/index.ts` to import from the real SDK:
  ```typescript
  // Change from
  import { Server, StdioServerTransport } from '../mcp-mock';
  // To
  import { Server } from '@modelcontextprotocol/sdk/server/index.js';
  import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
  ```

- Update main entry point to actually start the MCP server in MCP mode:
  ```typescript
  // In src/index.ts, modify the MCP mode section to:
  if (isMcpMode) {
    logger.info('Starting in MCP mode');
    
    // Import the MCP server setup function
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
    
    // ... existing signal handlers ...
  }
  ```

### 4. Remove or Update Mock Implementation

Since we'll be using the real SDK, we have two options:
1. Remove the mock implementation entirely
2. Keep it for testing purposes but update imports throughout the codebase

Recommendation: Keep the mock implementation for now, but clearly mark it as testing-only.

## Implementation Steps

1. **Update package.json**:
   - Add the MCP SDK as a dependency

2. **Update Dockerfile**:
   - Ensure the MCP SDK is installed during the build

3. **Update src/mcp/index.ts**:
   - Import from the real SDK instead of the mock implementation

4. **Update src/index.ts**:
   - Properly start the MCP server in MCP mode

5. **Handle any other import errors**:
   - Ensure all imports from the SDK are updated with the correct paths

6. **Build and Test**:
   - Rebuild the Docker image and verify the build completes without errors
   - Test MCP functionality to ensure it works correctly

## Considerations

- **Typescript Configuration**: We might need to update tsconfig.json to properly handle the SDK imports
- **Version Compatibility**: Ensure the SDK version is compatible with our implementation
- **Future-proofing**: Document the SDK integration to facilitate future updates

## Next Steps

1. Switch to Code mode to implement these changes
2. Test the build and functionality
3. Document the integration in the project documentation