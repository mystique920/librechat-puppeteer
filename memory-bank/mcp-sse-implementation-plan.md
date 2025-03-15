# MCP over SSE Implementation Plan

This document outlines a comprehensive implementation plan for adding MCP over SSE (Server-Sent Events) support to the Puppeteer service. This will allow LibreChat to connect to the service via HTTP/SSE instead of the current stdio approach.

## Background and Current State

Currently, the Puppeteer service supports MCP integration via stdio transport. LibreChat connects to the service using Docker exec, as configured in `librechat.yaml`:

```yaml
mcpServers:
  puppeteer-service:
    type: stdio
    command: docker
    args:
      - exec
      - -i
      - puppeteer-service
      - node
      - /app/dist/index.js
    env:
      - MCP_MODE=true
```

While functional, an SSE-based approach would offer several advantages:
- No need for Docker exec permissions
- Potentially more stable connections
- Better scalability for multi-instance deployments
- More flexibility in deployment architectures

## Implementation Overview

The implementation requires creating an MCP server that uses SSE as its transport layer instead of stdio. This involves:

1. Creating a new SSE transport implementation for the MCP server
2. Adding an endpoint specifically for MCP-over-SSE communication
3. Ensuring the existing MCP tools and resources are accessible through this new transport
4. Updating configuration and documentation to support this approach

## Technical Architecture

```mermaid
graph TD
    LC[LibreChat] -->|HTTP/SSE| EP[/mcp-sse Endpoint]
    EP --> MCPSSE[MCP-SSE Transport]
    MCPSSE --> MCPS[MCP Server]
    MCPS --> BT[Browser Tools]
    MCPS --> NT[Navigation Tools]
    MCPS --> ST[Screenshot Tools]
    MCPS --> BR[Browser Resources]
```

## Implementation Steps

### Phase 1: Create the SSE Transport

1. Create a new file `src/mcp/transport/sse.transport.ts`:
   ```typescript
   import { ServerTransport } from '@modelcontextprotocol/sdk/server/index.js';
   import { Express, Request, Response } from 'express';
   import { logger } from '../../utils/logger';

   /**
    * Server-Sent Events transport for MCP
    */
   export class SSEServerTransport implements ServerTransport {
     private clients: Map<string, Response> = new Map();
     private messageQueue: string[] = [];
     private readHandlers: ((message: string) => void)[] = [];
     private app: Express;
     private endpoint: string;

     constructor(app: Express, endpoint: string = '/mcp-sse') {
       this.app = app;
       this.endpoint = endpoint;
       this.setupEndpoint();
     }

     private setupEndpoint() {
       this.app.get(this.endpoint, (req: Request, res: Response) => {
         // Set headers for SSE
         res.setHeader('Content-Type', 'text/event-stream');
         res.setHeader('Cache-Control', 'no-cache');
         res.setHeader('Connection', 'keep-alive');
         res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

         // Generate a client ID
         const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
         this.clients.set(clientId, res);
         logger.info(`MCP SSE client connected: ${clientId}`);

         // Send initial connection message
         res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

         // Handle client disconnect
         req.on('close', () => {
           this.clients.delete(clientId);
           logger.info(`MCP SSE client disconnected: ${clientId}`);
         });
       });

       // Endpoint to receive messages from the client
       this.app.post(`${this.endpoint}/message`, (req: Request, res: Response) => {
         const message = req.body;
         if (typeof message !== 'string' && !Buffer.isBuffer(message)) {
           return res.status(400).json({ error: 'Invalid message format' });
         }

         // Process the incoming message
         this.messageQueue.push(message.toString());
         this.processQueue();
         
         return res.status(200).json({ status: 'message received' });
       });
     }

     private processQueue() {
       if (this.messageQueue.length > 0 && this.readHandlers.length > 0) {
         const message = this.messageQueue.shift();
         const handler = this.readHandlers.shift();
         if (message && handler) {
           handler(message);
         }
       }
     }

     /**
      * Writes a message to all connected clients
      */
     async write(message: string): Promise<void> {
       if (this.clients.size === 0) {
         logger.warn('No SSE clients connected, message will be lost');
         return;
       }

       // Send the message to all connected clients
       for (const [clientId, res] of this.clients.entries()) {
         try {
           res.write(`data: ${message}\n\n`);
         } catch (error) {
           logger.error(`Error sending message to client ${clientId}:`, error);
           // Remove the client if we can't send to it
           this.clients.delete(clientId);
         }
       }
     }

     /**
      * Reads a message from the client
      * This is asynchronous - we register a handler that will be called when a message arrives
      */
     async read(): Promise<string> {
       return new Promise((resolve) => {
         // If we already have messages in the queue, process them immediately
         if (this.messageQueue.length > 0) {
           resolve(this.messageQueue.shift()!);
           return;
         }

         // Otherwise, register a handler to be called when a message arrives
         this.readHandlers.push(resolve);
       });
     }

     /**
      * Closes the transport
      */
     async close(): Promise<void> {
       // Close all client connections
       for (const [clientId, res] of this.clients.entries()) {
         try {
           res.end();
         } catch (error) {
           logger.error(`Error closing client ${clientId}:`, error);
         }
       }
       this.clients.clear();
     }
   }
   ```

### Phase 2: Modify the MCP Server to Support SSE

2. Update `src/mcp/index.ts` to support SSE transport:
   ```typescript
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
   import { Express } from 'express';
   import { logger } from '../utils/logger';
   import { setupBrowserTools } from './tools/browser.tools';
   import { setupNavigationTools } from './tools/navigation.tools';
   import { setupScreenshotTools } from './tools/screenshot.tools';
   import { setupBrowserResources } from './resources/browser.resources';
   import { SSEServerTransport } from './transport/sse.transport';

   /**
    * Start the MCP server with stdio transport
    */
   export async function startMcpServer() {
     return startMcpServerWithTransport('stdio');
   }

   /**
    * Start the MCP server with SSE transport
    * @param app Express application
    * @param endpoint SSE endpoint path
    */
   export async function startMcpServerWithSse(app: Express, endpoint: string = '/mcp-sse') {
     return startMcpServerWithTransport('sse', app, endpoint);
   }

   /**
    * Start the MCP server with specified transport
    * @param transportType Type of transport to use (stdio or sse)
    * @param app Express application (required for SSE)
    * @param endpoint SSE endpoint path (required for SSE)
    */
   async function startMcpServerWithTransport(
     transportType: 'stdio' | 'sse', 
     app?: Express, 
     endpoint?: string
   ) {
     // Create MCP server
     const server = new Server(
       {
         name: 'puppeteer-service',
         version: '1.0.0',
       },
       {
         capabilities: {
           tools: {},
           resources: {},
         },
       }
     );

     // Set up tools
     setupBrowserTools(server);
     setupNavigationTools(server);
     setupScreenshotTools(server);

     // Set up resources
     setupBrowserResources(server);

     // Set up error handling
     server.onerror = (error) => {
       logger.error('[MCP Error]', error);
     };

     // Connect using appropriate transport
     if (transportType === 'sse') {
       if (!app) {
         throw new Error('Express app is required for SSE transport');
       }
       const transport = new SSEServerTransport(app, endpoint);
       await server.connect(transport);
       logger.info(`MCP server is running with SSE transport at ${endpoint}`);
     } else {
       // Default to stdio transport
       const transport = new StdioServerTransport();
       await server.connect(transport);
       logger.info('MCP server is running with stdio transport');
     }

     // Handle cleanup
     process.on('SIGINT', async () => {
       logger.info('SIGINT received: closing MCP server');
       await server.close();
       process.exit(0);
     });

     process.on('SIGTERM', async () => {
       logger.info('SIGTERM received: closing MCP server');
       await server.close();
       process.exit(0);
     });

     return server;
   }
   ```

### Phase 3: Update the Main Application Entry Point

3. Modify `src/index.ts` to support SSE mode in addition to stdio:
   ```typescript
   import express from 'express';
   import cors from 'cors';
   import { logger } from './utils/logger';
   import { setupControllers } from './controllers';
   import { setupHealthcheck } from './utils/healthcheck';
   import { startMcpServer, startMcpServerWithSse } from './mcp';

   // Load environment variables
   const PORT = process.env.PORT || 3000;
   const REST_PORT = process.env.REST_PORT || 3007;
   const MCP_MODE = process.env.MCP_MODE === 'true';
   const MCP_SSE_MODE = process.env.MCP_SSE_MODE === 'true';

   // Initialize the application
   async function startApp() {
     if (MCP_MODE) {
       // Start in MCP mode using stdio transport
       logger.info('Starting in MCP mode');
       await startMcpServer();
       logger.info('MCP server started successfully');
     } else if (MCP_SSE_MODE) {
       // Start in MCP SSE mode
       logger.info('Starting in MCP SSE mode');
       
       // Initialize Express for SSE endpoint
       const app = express();
       app.use(cors());
       app.use(express.json({ limit: '50mb' }));
       app.use(express.urlencoded({ extended: true }));
       
       // Set up health check
       setupHealthcheck(app, 'MCP SSE');
       
       // Start MCP server with SSE transport
       await startMcpServerWithSse(app);
       logger.info('MCP SSE server started successfully');
       
       // Start HTTP server for SSE
       app.listen(PORT, () => {
         logger.info(`MCP SSE server listening on port ${PORT}`);
       });
     } else {
       // Start in REST API mode
       logger.info('Starting in REST API mode');
       
       // Initialize Express for REST API
       const app = express();
       app.use(cors());
       app.use(express.json({ limit: '50mb' }));
       app.use(express.urlencoded({ extended: true }));
       
       // Set up controllers and health check
       setupControllers(app);
       setupHealthcheck(app, 'REST API');
       
       // Start HTTP server for REST API
       app.listen(REST_PORT, () => {
         logger.info(`REST API server listening on port ${REST_PORT}`);
       });
     }

     logger.info('Puppeteer service initialized successfully');
   }

   // Start the application
   startApp().catch((error) => {
     logger.error('Failed to start application:', error);
     process.exit(1);
   });
   ```

### Phase 4: Create a Startup Script for SSE Mode

4. Create a new file `start-mcp-sse.sh`:
   ```bash
   #!/bin/bash

   # Script to run the Puppeteer service in MCP SSE mode with a specified LibreChat network
   # Usage: ./start-mcp-sse.sh <network_name>

   # Default network if not specified
   NETWORK=${1:-librechat_default}

   # Check if the network exists
   if ! docker network inspect $NETWORK &>/dev/null; then
     echo "Error: Network '$NETWORK' does not exist."
     echo "Available networks:"
     docker network ls | grep librechat
     exit 1
   fi

   # Create mcp-services network if it doesn't exist
   if ! docker network inspect mcp-services &>/dev/null; then
     echo "Creating mcp-services network..."
     docker network create mcp-services
   fi

   # Stop any existing container
   echo "Stopping any existing puppeteer-service container..."
   docker-compose down

   # Run with the specified network in MCP SSE mode
   echo "Starting puppeteer-service with network: $NETWORK in MCP SSE mode"
   LIBRECHAT_NETWORK=$NETWORK MCP_SSE_MODE=true docker-compose up -d

   # Check if the container started successfully
   if [ $? -eq 0 ]; then
     echo "Container started successfully."
     echo "Container status:"
     docker ps | grep puppeteer-service
     
     echo -e "\nContainer logs:"
     docker logs puppeteer-service
     
     echo -e "\nHealth check:"
     sleep 5 # Wait for the container to initialize
     curl -s http://localhost:3000/health | jq || echo "Health check failed or jq not installed."
     
     echo -e "\nNetwork connections:"
     echo "Connected to $NETWORK:"
     docker network inspect $NETWORK | grep puppeteer-service
     
     echo "Connected to mcp-services:"
     docker network inspect mcp-services | grep puppeteer-service
     
     echo -e "\nMCP SSE endpoint available at: http://puppeteer-service:3000/mcp-sse"
     echo -e "For LibreChat integration, use this in your librechat.yaml:"
     echo -e "
   mcpServers:
     puppeteer-service:
       type: sse
       url: http://puppeteer-service:3000/mcp-sse
       timeout: 300000
   "
   else
     echo "Failed to start container."
   fi
   ```

5. Make the script executable:
   ```bash
   chmod +x start-mcp-sse.sh
   ```

### Phase 5: Create Client-Side Demo and Testing Utility

6. Create a simple HTML file for testing the SSE connection `tests/mcp-sse-test.html`:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>MCP SSE Test</title>
       <style>
           body { font-family: Arial, sans-serif; margin: 20px; }
           .container { max-width: 800px; margin: 0 auto; }
           .connection-status { padding: 10px; border-radius: 5px; margin-bottom: 20px; }
           .connected { background-color: #d4edda; color: #155724; }
           .disconnected { background-color: #f8d7da; color: #721c24; }
           .events { height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 20px; }
           .event { margin-bottom: 5px; padding: 5px; border-bottom: 1px solid #eee; }
           button { padding: 8px 15px; margin-right: 10px; }
       </style>
   </head>
   <body>
       <div class="container">
           <h1>MCP SSE Test Client</h1>
           
           <div class="connection-status disconnected" id="status">Disconnected</div>
           
           <h2>Connection</h2>
           <div>
               <input type="text" id="sseUrl" value="http://localhost:3000/mcp-sse" placeholder="SSE URL" style="width: 300px; padding: 8px;">
               <button id="connect">Connect</button>
               <button id="disconnect">Disconnect</button>
           </div>
           
           <h2>Events</h2>
           <div class="events" id="events"></div>
           
           <h2>Send Message</h2>
           <div>
               <textarea id="message" rows="5" style="width: 100%; margin-bottom: 10px;" placeholder="Enter MCP message (JSON)"></textarea>
               <button id="send">Send</button>
           </div>
       </div>
       
       <script>
           let eventSource = null;
           
           // DOM elements
           const statusEl = document.getElementById('status');
           const eventsEl = document.getElementById('events');
           const connectBtn = document.getElementById('connect');
           const disconnectBtn = document.getElementById('disconnect');
           const sendBtn = document.getElementById('send');
           const sseUrlInput = document.getElementById('sseUrl');
           const messageInput = document.getElementById('message');
           
           // Connect to SSE
           connectBtn.addEventListener('click', () => {
               if (eventSource) {
                   eventSource.close();
               }
               
               const url = sseUrlInput.value;
               try {
                   eventSource = new EventSource(url);
                   
                   eventSource.onopen = function() {
                       statusEl.textContent = 'Connected';
                       statusEl.classList.remove('disconnected');
                       statusEl.classList.add('connected');
                       addEvent('Connected to ' + url);
                   };
                   
                   eventSource.onmessage = function(event) {
                       addEvent('Received: ' + event.data);
                   };
                   
                   eventSource.onerror = function(error) {
                       statusEl.textContent = 'Error / Disconnected';
                       statusEl.classList.remove('connected');
                       statusEl.classList.add('disconnected');
                       addEvent('Error: Connection failed or closed');
                       eventSource.close();
                       eventSource = null;
                   };
               } catch (error) {
                   addEvent('Error: ' + error.message);
               }
           });
           
           // Disconnect from SSE
           disconnectBtn.addEventListener('click', () => {
               if (eventSource) {
                   eventSource.close();
                   eventSource = null;
                   statusEl.textContent = 'Disconnected';
                   statusEl.classList.remove('connected');
                   statusEl.classList.add('disconnected');
                   addEvent('Disconnected');
               }
           });
           
           // Send message to server
           sendBtn.addEventListener('click', () => {
               const message = messageInput.value;
               if (!message) {
                   addEvent('Error: Message is empty');
                   return;
               }
               
               try {
                   // Try to parse as JSON to validate
                   JSON.parse(message);
               } catch (e) {
                   addEvent('Error: Invalid JSON format');
                   return;
               }
               
               const url = sseUrlInput.value + '/message';
               fetch(url, {
                   method: 'POST',
                   headers: {
                       'Content-Type': 'application/json'
                   },
                   body: message
               })
               .then(response => response.json())
               .then(data => {
                   addEvent('Message sent: ' + JSON.stringify(data));
               })
               .catch(error => {
                   addEvent('Error sending message: ' + error.message);
               });
           });
           
           // Helper to add event to the log
           function addEvent(text) {
               const eventEl = document.createElement('div');
               eventEl.className = 'event';
               eventEl.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
               eventsEl.appendChild(eventEl);
               eventsEl.scrollTop = eventsEl.scrollHeight;
           }
       </script>
   </body>
   </html>
   ```

### Phase 6: Update Documentation

7. Update `MCP_INTEGRATION.md` to include information about SSE

8. Update `README.md` to include information about the SSE mode

### Testing Plan

1. **Unit Tests**:
   - Test the SSE transport implementation
   - Test the MCP server with both stdio and SSE transports

2. **Integration Tests**:
   - Test SSE connection from browser using the test HTML page
   - Test sending and receiving MCP messages over SSE

3. **End-to-End Tests**:
   - Test LibreChat integration using the SSE configuration
   - Verify all MCP tools work over the SSE connection

### Future Enhancements

1. **Authentication** for the SSE endpoint
2. **Reconnection** logic for dropped connections
3. **Multiple client** support for scaling
4. **Message queue** for persistence across reconnections

## Timeline and Milestones

1. **Phase 1-2 (Week 1)**: Implement core SSE transport and server integration
2. **Phase 3-4 (Week 1)**: Update application entry points and add startup scripts
3. **Phase 5 (Week 2)**: Create testing utilities and implement basic tests
4. **Phase 6 (Week 2)**: Update documentation
5. **Testing and Verification (Week 3)**: Full end-to-end testing with LibreChat

## Risk Management

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Connection stability issues | High | Medium | Implement reconnection logic, message queuing |
| Performance bottlenecks with many clients | Medium | Low | Add connection pooling, load testing |
| Compatibility issues with LibreChat | High | Medium | Thorough testing, maintain backward compatibility |
| Security vulnerabilities | High | Low | Implement authentication, input validation |

## Conclusion

Implementing MCP over SSE will provide an alternative integration path for LibreChat and other MCP clients. This approach offers benefits in terms of deployment flexibility and scaling. The implementation is designed to be non-disruptive, allowing the existing stdio transport to continue functioning while adding the new SSE capabilities.