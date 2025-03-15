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
 * Set up screenshot tools for the MCP server
 * @param server The MCP server instance
 */
export function setupScreenshotTools(server: Server) {
  const puppeteerService = PuppeteerService.getInstance();

  // Define tools for screenshots
  server.setRequestHandler(ListToolsRequestSchema, async (request: any) => {
    const currentTools = request.result?.tools || [];
    
    return {
      tools: [
        ...currentTools,
        {
          name: 'take_screenshot',
          description: 'Take a screenshot of a page',
          inputSchema: {
            type: 'object',
            properties: {
              browserId: {
                type: 'string',
                description: 'ID of the browser instance',
              },
              pageId: {
                type: 'string',
                description: 'ID of the page',
              },
            },
            required: ['browserId', 'pageId'],
          },
        },
      ],
    };
  });

  // Implement tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    if (request.params.name === 'take_screenshot') {
      try {
        const { browserId, pageId } = request.params.arguments as { 
          browserId: string;
          pageId: string;
        };
        
        if (!browserId || !pageId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Browser ID and Page ID are required'
          );
        }

        const screenshot = await puppeteerService.takeScreenshot(browserId, pageId);
        
        if (!screenshot) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to take screenshot of page ${pageId}`,
              },
            ],
            isError: true,
          };
        }

        logger.info(`MCP: Took screenshot of page ${pageId}`);
        
        // Convert Buffer to base64 string
        const base64Screenshot = screenshot.toString('base64');
        
        return {
          content: [
            {
              type: 'image',
              data: base64Screenshot,
              mimeType: 'image/png',
            },
            {
              type: 'text',
              text: JSON.stringify({ success: true }),
            },
          ],
        };
      } catch (error: any) {
        logger.error('MCP: Error taking screenshot', { error });
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
    
    // If we get here, the tool wasn't handled by this module
    return request.next?.() || {
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${request.params.name}`,
        },
      ],
      isError: true,
    };
  });
}