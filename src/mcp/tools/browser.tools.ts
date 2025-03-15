import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema, 
  ErrorCode, 
  ListToolsRequestSchema,
  McpError 
} from '@modelcontextprotocol/sdk/types.js';
import { PuppeteerService } from '../../services/puppeteer.service';
import { logger } from '../../utils/logger';

/**
 * Set up browser management tools for the MCP server
 * @param server The MCP server instance
 */
export function setupBrowserTools(server: Server) {
  const puppeteerService = PuppeteerService.getInstance();

  // Define tools for browser management
  server.setRequestHandler(ListToolsRequestSchema, async (request: any) => {
    const currentTools = request.result?.tools || [];
    
    return {
      tools: [
        ...currentTools,
        {
          name: 'create_browser',
          description: 'Create a new browser instance',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'close_browser',
          description: 'Close a browser instance',
          inputSchema: {
            type: 'object',
            properties: {
              browserId: {
                type: 'string',
                description: 'ID of the browser instance to close',
              },
            },
            required: ['browserId'],
          },
        },
        {
          name: 'list_browsers',
          description: 'List all active browser instances',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ],
    };
  });

  // Implement tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    if (request.params.name === 'create_browser') {
      try {
        const browserId = await puppeteerService.createBrowserInstance();
        
        if (!browserId) {
          return {
            content: [
              {
                type: 'text',
                text: 'Failed to create browser instance',
              },
            ],
            isError: true,
          };
        }

        logger.info(`MCP: Created browser instance ${browserId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ browserId, success: true }),
            },
          ],
        };
      } catch (error) {
        logger.error('MCP: Error creating browser instance', { error });
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
    
    if (request.params.name === 'close_browser') {
      try {
        const { browserId } = request.params.arguments as { browserId: string };
        
        if (!browserId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Browser ID is required'
          );
        }

        const success = await puppeteerService.closeBrowserInstance(browserId);
        
        if (!success) {
          return {
            content: [
              {
                type: 'text',
                text: `Browser instance not found: ${browserId}`,
              },
            ],
            isError: true,
          };
        }

        logger.info(`MCP: Closed browser instance ${browserId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true }),
            },
          ],
        };
      } catch (error) {
        logger.error('MCP: Error closing browser instance', { error });
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
    
    if (request.params.name === 'list_browsers') {
      try {
        const browserIds = puppeteerService.getActiveBrowserIds();
        
        logger.info(`MCP: Listed ${browserIds.length} browser instances`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ browserIds, count: browserIds.length }),
            },
          ],
        };
      } catch (error) {
        logger.error('MCP: Error listing browser instances', { error });
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
    
    // If we get here, the tool wasn't handled by this module
    return request.next();
  });
}