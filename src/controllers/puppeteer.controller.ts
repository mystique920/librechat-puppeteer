import { Express, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { PuppeteerService } from '../services/puppeteer.service';
import { logger } from '../utils/logger';

/**
 * Set up Puppeteer routes
 */
export function setupPuppeteerRoutes(app: Express): void {
  const puppeteerService = PuppeteerService.getInstance();
  
  // Initialize Puppeteer service when the app starts
  puppeteerService.initialize().catch(err => {
    logger.error('Failed to initialize Puppeteer service', { error: err });
  });

  // Start a new browser instance
  app.post('/puppeteer-service/start', async (req: Request, res: Response) => {
    try {
      const browserId = await puppeteerService.createBrowserInstance();
      if (!browserId) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to create browser instance'
        });
      }

      return res.status(StatusCodes.OK).json({
        browserId,
        message: 'Browser instance created successfully'
      });
    } catch (error) {
      logger.error('Error creating browser instance', { error });
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to create browser instance'
      });
    }
  });

  // Stop a browser instance
  app.post('/puppeteer-service/stop', [
    body('browserId').isString().notEmpty()
  ], async (req: Request, res: Response) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }

    const { browserId } = req.body;

    try {
      const success = await puppeteerService.closeBrowserInstance(browserId);
      if (!success) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: `Browser instance not found: ${browserId}`
        });
      }

      return res.status(StatusCodes.OK).json({
        message: `Browser instance ${browserId} closed successfully`
      });
    } catch (error) {
      logger.error(`Error closing browser instance: ${browserId}`, { error });
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to close browser instance'
      });
    }
  });

  // Test endpoint - navigate to a URL and take a screenshot
  app.post('/puppeteer-service/test', [
    // Allow internal Docker hostnames by using a custom validator
    body('url').custom((value: string) => {
      // Basic URL validation that allows Docker hostnames
      if (!value || typeof value !== 'string') {
        throw new Error('URL must be a non-empty string');
      }
      
      // Check if it's a valid URL or an internal Docker hostname URL
      const isValidUrl = /^https?:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(:[0-9]+)?(\/.*)?$/.test(value);
      const isDockerHostname = /^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9_-]*(:[0-9]+)?(\/.*)?$/.test(value);
      
      if (!isValidUrl && !isDockerHostname) {
        throw new Error('Invalid URL format');
      }
      
      return true;
    })
  ], async (req: Request, res: Response) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }

    const { url } = req.body;

    try {
      // Create a browser instance
      const browserId = await puppeteerService.createBrowserInstance();
      if (!browserId) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to create browser instance'
        });
      }

      // Create a page
      const pageId = await puppeteerService.createPage(browserId);
      if (!pageId) {
        await puppeteerService.closeBrowserInstance(browserId);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to create page'
        });
      }

      // Navigate to the URL
      const navigationSuccess = await puppeteerService.navigateTo(browserId, pageId, url);
      if (!navigationSuccess) {
        await puppeteerService.closeBrowserInstance(browserId);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          error: `Failed to navigate to ${url}`
        });
      }

      // Take a screenshot
      const screenshot = await puppeteerService.takeScreenshot(browserId, pageId);
      if (!screenshot) {
        await puppeteerService.closeBrowserInstance(browserId);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to take screenshot'
        });
      }

      // Get page content
      const content = await puppeteerService.getPageContent(browserId, pageId);

      // Close the browser instance
      await puppeteerService.closeBrowserInstance(browserId);

      // Return the screenshot as base64
      return res.status(StatusCodes.OK).json({
        message: 'Test completed successfully',
        screenshot: screenshot.toString('base64'),
        content: content || 'No content available'
      });
    } catch (error) {
      logger.error(`Error in test endpoint: ${error}`, { error });
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Test failed'
      });
    }
  });
}