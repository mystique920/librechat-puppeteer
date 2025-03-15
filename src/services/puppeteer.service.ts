import puppeteer, { Browser, Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

interface BrowserInstance {
  id: string;
  browser: Browser;
  pages: Map<string, Page>;
  lastUsed: Date;
}

export class PuppeteerService {
  private static instance: PuppeteerService;
  private initialized: boolean = false;
  private browserInstances: Map<string, BrowserInstance> = new Map();
  private maxInstances: number = 5;
  private idleTimeout: number = 300000; // 5 minutes in milliseconds

  private constructor() {
    // Private constructor to enforce singleton pattern
    this.startCleanupInterval();
  }

  /**
   * Get the singleton instance of PuppeteerService
   */
  public static getInstance(): PuppeteerService {
    if (!PuppeteerService.instance) {
      PuppeteerService.instance = new PuppeteerService();
    }
    return PuppeteerService.instance;
  }

  /**
   * Check if the service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Initialize the Puppeteer service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create a test browser instance to verify Puppeteer works
      const browser = await this.launchBrowser();
      await browser.close();
      this.initialized = true;
      logger.info('Puppeteer service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Puppeteer service', { error });
      throw error;
    }
  }

  /**
   * Create a new browser instance
   */
  public async createBrowserInstance(): Promise<string> {
    try {
      // Check if we've reached the maximum number of instances
      if (this.browserInstances.size >= this.maxInstances) {
        // Find the oldest instance to replace
        let oldestId: string | null = null;
        let oldestTime: Date | null = null;

        for (const [id, instance] of this.browserInstances.entries()) {
          if (!oldestTime || instance.lastUsed < oldestTime) {
            oldestId = id;
            oldestTime = instance.lastUsed;
          }
        }

        if (oldestId) {
          await this.closeBrowserInstance(oldestId);
        }
      }

      // Launch a new browser
      const browser = await this.launchBrowser();
      const id = uuidv4();

      this.browserInstances.set(id, {
        id,
        browser,
        pages: new Map(),
        lastUsed: new Date()
      });

      logger.info(`Created browser instance: ${id}`);
      return id;
    } catch (error) {
      logger.error('Failed to create browser instance', { error });
      throw error;
    }
  }

  /**
   * Get all active browser instance IDs
   */
  public getActiveBrowserIds(): string[] {
    return Array.from(this.browserInstances.keys());
  }

  /**
   * Close a browser instance
   */
  public async closeBrowserInstance(id: string): Promise<boolean> {
    try {
      const instance = this.browserInstances.get(id);
      if (!instance) {
        logger.warn(`Browser instance not found: ${id}`);
        return false;
      }

      await instance.browser.close();
      this.browserInstances.delete(id);
      logger.info(`Closed browser instance: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to close browser instance: ${id}`, { error });
      // Still remove it from the map even if there was an error
      this.browserInstances.delete(id);
      return false;
    }
  }

  /**
   * Create a new page in a browser instance
   */
  public async createPage(browserId: string): Promise<string | null> {
    try {
      const instance = this.browserInstances.get(browserId);
      if (!instance) {
        logger.warn(`Browser instance not found: ${browserId}`);
        return null;
      }

      // Update last used timestamp
      instance.lastUsed = new Date();

      // Create a new page
      const page = await instance.browser.newPage();
      const pageId = uuidv4();
      
      // Configure page settings
      await page.setDefaultNavigationTimeout(60000); // 60 seconds
      await page.setDefaultTimeout(30000); // 30 seconds
      
      // Store the page
      instance.pages.set(pageId, page);
      
      logger.info(`Created page ${pageId} in browser ${browserId}`);
      return pageId;
    } catch (error) {
      logger.error(`Failed to create page in browser: ${browserId}`, { error });
      return null;
    }
  }

  /**
   * Navigate to a URL in a specific page
   */
  public async navigateTo(browserId: string, pageId: string, url: string): Promise<boolean> {
    try {
      const page = this.getPage(browserId, pageId);
      if (!page) {
        return false;
      }

      // Update last used timestamp
      const instance = this.browserInstances.get(browserId);
      if (instance) {
        instance.lastUsed = new Date();
      }

      // Navigate to the URL
      await page.goto(url, { waitUntil: 'networkidle2' });
      logger.info(`Navigated to ${url} in page ${pageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to navigate to ${url} in page ${pageId}`, { error });
      return false;
    }
  }

  /**
   * Take a screenshot of a page
   */
  public async takeScreenshot(browserId: string, pageId: string): Promise<Buffer | null> {
    try {
      const page = this.getPage(browserId, pageId);
      if (!page) {
        return null;
      }

      // Update last used timestamp
      const instance = this.browserInstances.get(browserId);
      if (instance) {
        instance.lastUsed = new Date();
      }

      // Take a screenshot
      const screenshot = await page.screenshot({ fullPage: true });
      logger.info(`Took screenshot of page ${pageId}`);
      return screenshot;
    } catch (error) {
      logger.error(`Failed to take screenshot of page ${pageId}`, { error });
      return null;
    }
  }

  /**
   * Get page content
   */
  public async getPageContent(browserId: string, pageId: string): Promise<string | null> {
    try {
      const page = this.getPage(browserId, pageId);
      if (!page) {
        return null;
      }

      // Update last used timestamp
      const instance = this.browserInstances.get(browserId);
      if (instance) {
        instance.lastUsed = new Date();
      }

      // Get the page content
      const content = await page.content();
      return content;
    } catch (error) {
      logger.error(`Failed to get content of page ${pageId}`, { error });
      return null;
    }
  }

  /**
   * Close a page
   */
  public async closePage(browserId: string, pageId: string): Promise<boolean> {
    try {
      const instance = this.browserInstances.get(browserId);
      if (!instance) {
        logger.warn(`Browser instance not found: ${browserId}`);
        return false;
      }

      const page = instance.pages.get(pageId);
      if (!page) {
        logger.warn(`Page not found: ${pageId}`);
        return false;
      }

      // Update last used timestamp
      instance.lastUsed = new Date();

      // Close the page
      await page.close();
      instance.pages.delete(pageId);
      logger.info(`Closed page ${pageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to close page ${pageId}`, { error });
      // Still remove it from the map even if there was an error
      const instance = this.browserInstances.get(browserId);
      if (instance) {
        instance.pages.delete(pageId);
      }
      return false;
    }
  }

  /**
   * Shutdown the Puppeteer service
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Puppeteer service');
    
    // Close all browser instances
    const closePromises: Promise<boolean>[] = [];
    for (const id of this.browserInstances.keys()) {
      closePromises.push(this.closeBrowserInstance(id));
    }
    
    await Promise.all(closePromises);
    this.initialized = false;
    logger.info('Puppeteer service shut down successfully');
  }

  /**
   * Launch a browser with appropriate options
   */
  private async launchBrowser(): Promise<Browser> {
    return puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      headless: true
    });
  }

  /**
   * Get a page from a browser instance
   */
  private getPage(browserId: string, pageId: string): Page | null {
    const instance = this.browserInstances.get(browserId);
    if (!instance) {
      logger.warn(`Browser instance not found: ${browserId}`);
      return null;
    }

    const page = instance.pages.get(pageId);
    if (!page) {
      logger.warn(`Page not found: ${pageId}`);
      return null;
    }

    return page;
  }

  /**
   * Start the cleanup interval to close idle browser instances
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupIdleInstances();
    }, 60000); // Check every minute
  }

  /**
   * Clean up idle browser instances
   */
  private async cleanupIdleInstances(): Promise<void> {
    const now = new Date();
    const idsToClose: string[] = [];

    // Find idle instances
    for (const [id, instance] of this.browserInstances.entries()) {
      const idleTime = now.getTime() - instance.lastUsed.getTime();
      if (idleTime > this.idleTimeout) {
        idsToClose.push(id);
      }
    }

    // Close idle instances
    for (const id of idsToClose) {
      logger.info(`Closing idle browser instance: ${id}`);
      await this.closeBrowserInstance(id);
    }
  }
}