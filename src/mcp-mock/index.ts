/**
 * MCP Mock Implementation
 * This provides a simplified mock implementation of the MCP SDK for use when the real SDK is not available
 */

// Basic server implementation
export class Server {
  private name: string;
  private version: string;
  public onerror: (error: any) => void = () => {};

  constructor(info: { name: string; version: string }, options: any) {
    this.name = info.name;
    this.version = info.version;
    console.log(`[Mock MCP] Creating server: ${this.name} v${this.version}`);
  }

  async connect(transport: any): Promise<void> {
    console.log(`[Mock MCP] Server connected with transport type: ${transport.type}`);
  }

  async close(): Promise<void> {
    console.log(`[Mock MCP] Server closed`);
  }

  setRequestHandler(schema: any, handler: any): void {
    console.log(`[Mock MCP] Request handler registered for schema: ${schema.name || 'unnamed'}`);
  }
}

// Basic transport implementation
export class StdioServerTransport {
  public type = 'stdio';

  constructor() {
    console.log(`[Mock MCP] StdioServerTransport created`);
  }
}

// Basic error types and schemas
export const ErrorCode = {
  InvalidRequest: 'invalid_request',
  InternalError: 'internal_error',
  InvalidParams: 'invalid_params',
  MethodNotFound: 'method_not_found',
};

export class McpError extends Error {
  constructor(code: string, message: string) {
    super(message);
    this.name = 'McpError';
  }
}

export const ListToolsRequestSchema = { name: 'tools/list' };
export const CallToolRequestSchema = { name: 'tools/call' };
export const ListResourcesRequestSchema = { name: 'resources/list' };
export const ListResourceTemplatesRequestSchema = { name: 'resources/templates/list' };
export const ReadResourceRequestSchema = { name: 'resources/read' };