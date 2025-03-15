import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Export a mapping of our error types to MCP error codes
export const McpErrorCodes = {
  // Common error codes
  InvalidRequest: ErrorCode.InvalidRequest,
  InternalError: ErrorCode.InternalError,
  InvalidParams: ErrorCode.InvalidParams,
  MethodNotFound: ErrorCode.MethodNotFound,
  
  // Resource-specific error codes - use InvalidRequest for not found resources
  ResourceNotFound: ErrorCode.InvalidRequest,
  
  // Tool-specific error codes
  ToolNotFound: ErrorCode.MethodNotFound,
  ToolExecutionFailed: ErrorCode.InternalError
};