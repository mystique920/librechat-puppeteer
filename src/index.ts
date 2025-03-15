import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { StatusCodes } from 'http-status-codes';
import { setupRoutes } from './controllers';
import { logger } from './utils/logger';
import { PuppeteerService } from './services/puppeteer.service';

// Define app variable at the top level for export
let app: Express | null = null;

// Initialize Puppeteer service
const puppeteerService = PuppeteerService.getInstance();

// Initialize Puppeteer service
puppeteerService.initialize().catch(err => {
  logger.error('Failed to initialize Puppeteer service', { error: err });
});

// Check if we're running in MCP mode
const isMcpMode = process.env.MCP_MODE === 'true';

if (isMcpMode) {
  // Start in MCP mode
  logger.info('Starting in MCP mode');
  
  // Import and start the MCP server
  import('./mcp/index.js').then(({ startMcpServer }) => {
    startMcpServer().then(() => {
      logger.info('MCP server started successfully');
    }).catch(err => {
      logger.error('Failed to start MCP server', { error: err });
      process.exit(1);
    });
  }).catch(err => {
    logger.error('Failed to import MCP module', { error: err });
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: shutting down MCP server');
    puppeteerService.shutdown()
      .then(() => {
        logger.info('Puppeteer service shut down successfully');
        process.exit(0);
      })
      .catch((err) => {
        logger.error('Error shutting down Puppeteer service', { error: err });
        process.exit(1);
      });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: shutting down MCP server');
    puppeteerService.shutdown()
      .then(() => {
        logger.info('Puppeteer service shut down successfully');
        process.exit(0);
      })
      .catch((err) => {
        logger.error('Error shutting down Puppeteer service', { error: err });
        process.exit(1);
      });
  });
} else {
  // Start REST API server
  app = express();
  const restPort = parseInt(process.env.REST_PORT || '3007', 10);

  // Middleware
  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(morgan('dev'));

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      puppeteer: puppeteerService.isInitialized() ? 'READY' : 'INITIALIZING',
      mode: 'REST API'
    });
  });

  // Setup API routes
  setupRoutes(app);

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error: ${err.message}`, { error: err });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: {
        message: 'An unexpected error occurred',
        status: StatusCodes.INTERNAL_SERVER_ERROR
      }
    });
  });

  // Start the server
  const server = app.listen(restPort, () => {
    logger.info(`REST API server is running on port ${restPort}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      puppeteerService.shutdown()
        .then(() => {
          logger.info('Puppeteer service shut down successfully');
          process.exit(0);
        })
        .catch((err) => {
          logger.error('Error shutting down Puppeteer service', { error: err });
          process.exit(1);
        });
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      puppeteerService.shutdown()
        .then(() => {
          logger.info('Puppeteer service shut down successfully');
          process.exit(0);
        })
        .catch((err) => {
          logger.error('Error shutting down Puppeteer service', { error: err });
          process.exit(1);
        });
    });
  });
}

// Export the app for testing purposes
export default isMcpMode ? null : app;