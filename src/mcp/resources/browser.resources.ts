import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  McpError,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { McpErrorCodes } from '../error-codes';
import { PuppeteerService } from '../../services/puppeteer.service';
import { logger } from '../../utils/logger';

/**
 * Set up browser resources for the MCP server
 * @param server The MCP server instance
 */
export function setupBrowserResources(server: Server) {
  const puppeteerService = PuppeteerService.getInstance();

  // Define resource templates
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
    resourceTemplates: [
      {
        uriTemplate: 'puppeteer://browser/{browserId}/page/{pageId}/screenshot',
        name: 'Screenshot of a page',
        mimeType: 'image/png',
        description: 'Get a screenshot of a specific page in a browser instance',
      },
      {
        uriTemplate: 'puppeteer://browser/{browserId}/page/{pageId}/content',
        name: 'HTML content of a page',
        mimeType: 'text/html',
        description: 'Get the HTML content of a specific page in a browser instance',
      },
      {
        uriTemplate: 'puppeteer://browsers',
        name: 'List of active browser instances',
        mimeType: 'application/json',
        description: 'Get a list of all active browser instances',
      },
    ],
  }));

  // Define static resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: 'puppeteer://browsers',
        name: 'Active browser instances',
        mimeType: 'application/json',
        description: 'List of all active browser instances',
      },
    ],
  }));

  // Implement resource handlers
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    // Handle browser list resource
    if (uri === 'puppeteer://browsers') {
      try {
        const browserIds = puppeteerService.getActiveBrowserIds();
        
        logger.info(`MCP: Listed ${browserIds.length} browser instances`);
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ browserIds, count: browserIds.length }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        logger.error('MCP: Error listing browser instances', { error });
        throw new McpError(
          McpErrorCodes.InternalError,
          `Error listing browser instances: ${error.message}`
        );
      }
    }
    
    // Handle screenshot resource
    const screenshotMatch = uri.match(/^puppeteer:\/\/browser\/([^\/]+)\/page\/([^\/]+)\/screenshot$/);
    if (screenshotMatch) {
      const browserId = screenshotMatch[1];
      const pageId = screenshotMatch[2];
      
      try {
        const screenshot = await puppeteerService.takeScreenshot(browserId, pageId);
        
        if (!screenshot) {
          throw new McpError(
            McpErrorCodes.ResourceNotFound,
            `Failed to take screenshot of page ${pageId}`
          );
        }
        
        logger.info(`MCP: Took screenshot of page ${pageId} via resource`);
        
        // Convert Buffer to base64 string
        const base64Screenshot = screenshot.toString('base64');
        
        return {
          contents: [
            {
              uri,
              mimeType: 'image/png',
              data: base64Screenshot,
            },
          ],
        };
      } catch (error: any) {
        logger.error(`MCP: Error taking screenshot of page ${pageId}`, { error });
        throw new McpError(
          McpErrorCodes.InternalError,
          `Error taking screenshot: ${error.message}`
        );
      }
    }
    
    // Handle page content resource
    const contentMatch = uri.match(/^puppeteer:\/\/browser\/([^\/]+)\/page\/([^\/]+)\/content$/);
    if (contentMatch) {
      const browserId = contentMatch[1];
      const pageId = contentMatch[2];
      
      try {
        const content = await puppeteerService.getPageContent(browserId, pageId);
        
        if (content === null) {
          throw new McpError(
            McpErrorCodes.ResourceNotFound,
            `Failed to get content of page ${pageId}`
          );
        }
        
        logger.info(`MCP: Got content of page ${pageId} via resource`);
        
        return {
          contents: [
            {
              uri,
              mimeType: 'text/html',
              text: content,
            },
          ],
        };
      } catch (error: any) {
        logger.error(`MCP: Error getting content of page ${pageId}`, { error });
        throw new McpError(
          McpErrorCodes.InternalError,
          `Error getting page content: ${error.message}`
        );
      }
    }
    
    // If we get here, the resource wasn't handled
    throw new McpError(
      McpErrorCodes.ResourceNotFound,
      `Resource not found: ${uri}`
    );
  });
}