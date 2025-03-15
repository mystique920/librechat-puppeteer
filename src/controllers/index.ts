import { Express } from 'express';
import { setupPuppeteerRoutes } from './puppeteer.controller';
import { setupSSERoutes } from './sse.controller';

/**
 * Set up all API routes
 */
export function setupRoutes(app: Express): void {
  // Set up Puppeteer routes
  setupPuppeteerRoutes(app);
  
  // Set up SSE routes
  setupSSERoutes(app);
}