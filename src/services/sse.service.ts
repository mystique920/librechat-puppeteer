import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface SSEEvent {
  type: string;
  data: any;
  id?: string;
  retry?: number;
}

export class SSEService {
  private static instance: SSEService;
  private clients: Map<string, Response> = new Map();
  private eventId: number = 1;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of SSEService
   */
  public static getInstance(): SSEService {
    if (!SSEService.instance) {
      SSEService.instance = new SSEService();
    }
    return SSEService.instance;
  }

  /**
   * Add a new SSE client
   */
  public addClient(res: Response): string {
    const clientId = uuidv4();
    this.clients.set(clientId, res);
    logger.debug(`Added SSE client: ${clientId}, total clients: ${this.clients.size}`);
    return clientId;
  }

  /**
   * Remove an SSE client
   */
  public removeClient(clientId: string): boolean {
    const result = this.clients.delete(clientId);
    logger.debug(`Removed SSE client: ${clientId}, total clients: ${this.clients.size}`);
    return result;
  }

  /**
   * Send an event to a specific client
   */
  public sendEventToClient(clientId: string, event: SSEEvent): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      logger.warn(`Client not found: ${clientId}`);
      return false;
    }

    try {
      // Format the event according to SSE specification
      const formattedEvent = this.formatEvent(event);
      client.write(formattedEvent);
      return true;
    } catch (error) {
      logger.error(`Error sending event to client ${clientId}`, { error });
      // Remove the client if there was an error
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Broadcast an event to all connected clients
   */
  public broadcastEvent(event: SSEEvent): void {
    const clientIds = Array.from(this.clients.keys());
    logger.debug(`Broadcasting event to ${clientIds.length} clients`);

    // Assign an event ID if not provided
    if (!event.id) {
      event.id = (this.eventId++).toString();
    }

    // Format the event according to SSE specification
    const formattedEvent = this.formatEvent(event);

    // Send to all clients
    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client) {
        try {
          client.write(formattedEvent);
        } catch (error) {
          logger.error(`Error broadcasting to client ${clientId}`, { error });
          // Remove the client if there was an error
          this.removeClient(clientId);
        }
      }
    }
  }

  /**
   * Format an event according to SSE specification
   */
  private formatEvent(event: SSEEvent): string {
    let formatted = '';

    // Add event type if provided
    if (event.type && event.type !== 'message') {
      formatted += `event: ${event.type}\n`;
    }

    // Add event ID if provided
    if (event.id) {
      formatted += `id: ${event.id}\n`;
    }

    // Add retry if provided
    if (event.retry) {
      formatted += `retry: ${event.retry}\n`;
    }

    // Add data (split multi-line data)
    const data = typeof event.data === 'object' 
      ? JSON.stringify(event.data) 
      : String(event.data);
    
    // Split data by newlines and prefix each line with "data: "
    const dataLines = data.split('\n');
    for (const line of dataLines) {
      formatted += `data: ${line}\n`;
    }

    // End with a blank line
    formatted += '\n';

    return formatted;
  }

  /**
   * Get the number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }
}