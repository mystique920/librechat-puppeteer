# MCP SDK Integration Flow

```mermaid
flowchart TD
    A[Update package.json] --> B[Update Dockerfile]
    B --> C[Update src/mcp/index.ts imports]
    C --> D[Fix all tool and resource imports]
    D --> E[Update src/index.ts to start MCP server]
    E --> F[Fix type errors]
    F --> G[Test Docker build]
    G --> H{Build successful?}
    H -->|Yes| I[Test MCP functionality]
    H -->|No| J[Debug build errors]
    J --> G
    I --> K{Function correctly?}
    K -->|Yes| L[Integration Complete]
    K -->|No| M[Debug runtime errors]
    M --> I
```

## Critical Path Items

1. **Update Dependencies**
   - Add `@modelcontextprotocol/sdk@1.7.0` to package.json
   - Update Dockerfile to install SDK if not in package.json

2. **Fix Import Statements**
   - Replace mock imports in all MCP-related files
   - Use correct module paths for server and types

3. **Update Application Logic**
   - Update index.ts to properly initialize the MCP server
   - Ensure proper error handling and shutdown procedures

4. **Fix Type Issues**
   - Add explicit type annotations where needed
   - Handle unknown error types appropriately

5. **Testing**
   - Verify Docker build completes
   - Test MCP mode functionality
   - Ensure all MCP methods work as expected