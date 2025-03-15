import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from '../utils/logger';
import { setupBrowserTools } from './tools/browser.tools';
import { setupNavigationTools } from './tools/navigation.tools';
import { setupScreenshotTools } from './tools/screenshot.tools';
import { setupBrowserResources } from './resources/browser.resources';

/**
 * Start the MCP server
 * This function initializes and starts the MCP server with all tools and resources
 */
export async function startMcpServer() {
  // Create MCP server
  const server = new Server(
    {
      name: 'puppeteer-service',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Set up tools
  setupBrowserTools(server);
  setupNavigationTools(server);
  setupScreenshotTools(server);

  // Set up resources
  setupBrowserResources(server);

  // Set up error handling
  server.onerror = (error) => {
    logger.error('[MCP Error]', error);
  };

  // Connect using stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('MCP server is running');

  // Handle cleanup
  process.on('SIGINT', async () => {
    logger.info('SIGINT received: closing MCP server');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received: closing MCP server');
    await server.close();
    process.exit(0);
  });

  return server;
}