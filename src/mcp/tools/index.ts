import { setupBrowserTools } from './browser.tools';
import { setupNavigationTools } from './navigation.tools';
import { setupScreenshotTools } from './screenshot.tools';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

/**
 * Set up all MCP tools
 * @param server The MCP server instance
 */
export function setupTools(server: Server): void {
  setupBrowserTools(server);
  setupNavigationTools(server);
  setupScreenshotTools(server);
}