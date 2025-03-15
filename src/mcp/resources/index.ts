import { setupBrowserResources } from './browser.resources';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

/**
 * Set up all MCP resources
 * @param server The MCP server instance
 */
export function setupResources(server: Server): void {
  setupBrowserResources(server);
}