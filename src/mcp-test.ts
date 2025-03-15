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