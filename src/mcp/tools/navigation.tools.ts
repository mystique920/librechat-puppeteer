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
 * Set up navigation tools for the MCP server
 * @param server The MCP server instance
 */
export function setupNavigationTools(server: Server) {
  const puppeteerService = PuppeteerService.getInstance();

  // Define tools for page navigation
  server.setRequestHandler(ListToolsRequestSchema, async (request: any) => {
    const currentTools = request.result?.tools || [];
    
    return {
      tools: [
        ...currentTools,
        {
          name: 'create_page',
          description: 'Create a new page in a browser instance',
          inputSchema: {
            type: 'object',
            properties: {
              browserId: {
                type: 'string',
                description: 'ID of the browser instance',
              },
            },
            required: ['browserId'],
          },
        },
        {
          name: 'navigate_to',
          description: 'Navigate to a URL in a page',
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
              url: {
                type: 'string',
                description: 'URL to navigate to',
              },
            },
            required: ['browserId', 'pageId', 'url'],
          },
        },
        {
          name: 'get_page_content',
          description: 'Get the HTML content of a page',
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
        {
          name: 'close_page',
          description: 'Close a page',
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
    if (request.params.name === 'create_page') {
      try {
        const { browserId } = request.params.arguments as { browserId: string };
        
        if (!browserId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Browser ID is required'
          );
        }

        const pageId = await puppeteerService.createPage(browserId);
        
        if (!pageId) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create page in browser: ${browserId}`,
              },
            ],
            isError: true,
          };
        }

        logger.info(`MCP: Created page ${pageId} in browser ${browserId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ pageId, success: true }),
            },
          ],
        };
      } catch (error: any) {
        logger.error('MCP: Error creating page', { error });
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
    
    if (request.params.name === 'navigate_to') {
      try {
        const { browserId, pageId, url } = request.params.arguments as { 
          browserId: string;
          pageId: string;
          url: string;
        };
        
        if (!browserId || !pageId || !url) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Browser ID, Page ID, and URL are required'
          );
        }

        const success = await puppeteerService.navigateTo(browserId, pageId, url);
        
        if (!success) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to navigate to ${url}`,
              },
            ],
            isError: true,
          };
        }

        logger.info(`MCP: Navigated to ${url} in page ${pageId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, url }),
            },
          ],
        };
      } catch (error: any) {
        logger.error('MCP: Error navigating to URL', { error });
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
    
    if (request.params.name === 'get_page_content') {
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

        const content = await puppeteerService.getPageContent(browserId, pageId);
        
        if (content === null) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to get content from page ${pageId}`,
              },
            ],
            isError: true,
          };
        }

        logger.info(`MCP: Got content from page ${pageId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      } catch (error: any) {
        logger.error('MCP: Error getting page content', { error });
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
    
    if (request.params.name === 'close_page') {
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

        const success = await puppeteerService.closePage(browserId, pageId);
        
        if (!success) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to close page ${pageId}`,
              },
            ],
            isError: true,
          };
        }

        logger.info(`MCP: Closed page ${pageId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true }),
            },
          ],
        };
      } catch (error: any) {
        logger.error('MCP: Error closing page', { error });
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