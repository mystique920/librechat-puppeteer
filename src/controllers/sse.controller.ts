import { Express, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import { SSEService } from '../services/sse.service';

/**
 * Set up Server-Sent Events (SSE) routes
 */
export function setupSSERoutes(app: Express): void {
  const sseService = SSEService.getInstance();

  // SSE endpoint for real-time events
  app.get('/puppeteer-service/events', (req: Request, res: Response) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

    // Send a comment to establish the connection
    res.write(': connected\n\n');

    // Generate a client ID
    const clientId = sseService.addClient(res);
    logger.info(`SSE client connected: ${clientId}`);

    // Handle client disconnect
    req.on('close', () => {
      sseService.removeClient(clientId);
      logger.info(`SSE client disconnected: ${clientId}`);
    });
  });

  // Test endpoint to send an event to all connected clients
  app.post('/puppeteer-service/events/test', (req: Request, res: Response) => {
    const event = {
      type: 'test',
      data: {
        message: 'Test event',
        timestamp: new Date().toISOString()
      }
    };

    sseService.broadcastEvent(event);
    
    return res.status(StatusCodes.OK).json({
      message: 'Test event sent to all connected clients'
    });
  });
}