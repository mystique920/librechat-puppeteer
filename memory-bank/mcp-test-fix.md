# MCP Test File Fix

The `src/mcp-test.ts` file is using a shorthand import style that doesn't work with our TypeScript configuration. Since our tsconfig.json uses `"moduleResolution": "NodeNext"`, we need explicit file extensions in imports.

## Current Code

```typescript
/**
 * MCP Test File
 * This is a simple test to verify we can import and use the SDK correctly.
 */

import { Server } from '@modelcontextprotocol/sdk';

export async function testMcpSdk() {
  try {
    // Just verify we can create a server instance
    console.log('Testing MCP SDK import...');
    
    const server = new Server(
      {
        name: 'test',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
    
    console.log('MCP SDK import successful!');
    return true;
  } catch (error) {
    console.error('Error importing MCP SDK:', error);
    return false;
  }
}
```

## Updated Code

```typescript
/**
 * MCP Test File
 * This is a simple test to verify we can import and use the SDK correctly.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export async function testMcpSdk() {
  try {
    // Just verify we can create a server instance
    console.log('Testing MCP SDK import...');
    
    const server = new Server(
      {
        name: 'test',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
    
    console.log('MCP SDK import successful!');
    return true;
  } catch (error) {
    console.error('Error importing MCP SDK:', error);
    return false;
  }
}
```

## Implementation Steps

1. Open `src/mcp-test.ts`
2. Change line 6 from:
   ```typescript
   import { Server } from '@modelcontextprotocol/sdk';
   ```
   to:
   ```typescript
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   ```
3. Save the file

This change will make the import style consistent with our other MCP files, which should resolve the TypeScript compilation error.