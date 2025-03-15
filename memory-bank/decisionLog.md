# Decision Log

This document tracks significant technical decisions made during the project, including context, options considered, and rationale.

## Decision Records

### DR-001: Project Structure Definition
- **Date**: 2025-03-15
- **Context**: Initial project setup requires defining a clear structure for organizing code.
- **Options Considered**:
  1. Flat structure with all files in src directory
  2. MVC-like structure with controllers, services, and utils
  3. Feature-based structure organizing by functionality
- **Decision**: Adopted MVC-like structure (Option 2) with controllers, services, and utils directories.
- **Rationale**: This structure provides clear separation of concerns, is familiar to most developers, and scales well as the project grows.
- **Consequences**:
  - Positive: Better organization, easier maintenance, clear responsibilities
  - Negative: Slightly more directories to navigate, potential for over-engineering in early stages

### DR-002: Docker Environment Configuration
- **Date**: 2025-03-15
- **Context**: The application needs to run in a containerized environment with Puppeteer.
- **Options Considered**:
  1. Use official Node.js image and install dependencies
  2. Use specialized Puppeteer-ready Docker image from community
  3. Build custom image from Debian base with all dependencies
- **Decision**: Use official Node.js image (slim variant) with custom dependency installation (Option 1).
- **Rationale**: Provides better control over the environment, more transparency in what's installed, and relies on official images for better security and maintenance.
- **Consequences**:
  - Positive: Greater control, clear dependency trail, official image support
  - Negative: Larger Dockerfile, more manual configuration

### DR-003: Browser Instance Management
- **Date**: 2025-03-15
- **Context**: The service needs to manage multiple browser instances efficiently.
- **Options Considered**:
  1. Create a new browser instance for each request
  2. Maintain a pool of browser instances with lifecycle management
  3. Use a single browser instance with multiple pages
- **Decision**: Implemented a browser instance pool with lifecycle management (Option 2).
- **Rationale**: Provides better resource utilization than creating a new instance for each request, while offering more isolation than a single browser instance with multiple pages.
- **Consequences**:
  - Positive: Better resource management, isolation between requests, scalability
  - Negative: More complex implementation, need for cleanup mechanisms

### DR-004: Real-time Updates Implementation
- **Date**: 2025-03-15
- **Context**: The service needs to provide real-time updates about browser automation.
- **Options Considered**:
  1. WebSockets for bidirectional communication
  2. Server-Sent Events (SSE) for unidirectional updates
  3. Long polling as a fallback mechanism
- **Decision**: Implemented Server-Sent Events (SSE) for real-time updates (Option 2).
- **Rationale**: SSE is simpler to implement than WebSockets, has good browser support, and is well-suited for the unidirectional nature of browser automation updates.
- **Consequences**:
  - Positive: Simpler implementation, standard HTTP, no need for additional libraries
  - Negative: Limited to unidirectional communication, potential issues with certain proxies

### DR-005: Error Handling Strategy
- **Date**: 2025-03-15
- **Context**: The service needs robust error handling for browser automation.
- **Options Considered**:
  1. Global error handlers with generic responses
  2. Contextual error handling with specific error types
  3. Try-catch blocks with detailed logging
- **Decision**: Implemented contextual error handling with specific error types and detailed logging (Option 2).
- **Rationale**: Provides more detailed information about errors, allows for better debugging, and enables more specific error responses to clients.
- **Consequences**:
  - Positive: Better error information, improved debugging, more specific client responses
  - Negative: More code for error handling, need to maintain error types

### DR-006: LibreChat Network Integration Strategy
- **Date**: 2025-03-15
- **Context**: Multiple LibreChat networks were detected in the Docker environment, and we needed to determine which one to connect to.
- **Options Considered**:
  1. Hardcode a specific network name in docker-compose.yml
  2. Create a flexible configuration using environment variables
  3. Attempt to connect to all networks simultaneously
- **Decision**: Implemented a flexible configuration using environment variables (Option 2).
- **Rationale**: This approach provides the most flexibility, allowing the service to connect to different LibreChat networks without code changes. It accommodates different environments (development, testing, production) and different LibreChat deployments.
- **Consequences**:
  - Positive: Greater flexibility, easier deployment across environments, no hardcoded values
  - Negative: Slightly more complex configuration, requires setting environment variables

### DR-007: Docker Volume Mount Strategy
- **Date**: 2025-03-15
- **Context**: The container was failing to start because it couldn't find the compiled JavaScript files at `/app/dist/index.js`.
- **Options Considered**:
  1. Build TypeScript files locally before running docker-compose
  2. Remove the dist directory volume mount to use the built files in the container
  3. Add a build step in the docker-compose.yml file
- **Decision**: Removed the dist directory volume mount from docker-compose.yml (Option 2).
- **Rationale**: This approach allows us to use the files that are built during the Docker image creation process, while still allowing for source file changes to be reflected in the container for development purposes.
- **Consequences**:
  - Positive: Container starts correctly using the built files from the image
  - Positive: Still allows for development with source file changes
  - Negative: Changes to TypeScript files require rebuilding the container to see the effects

### DR-008: Cross-Architecture Chromium Strategy
- **Date**: 2025-03-15
- **Context**: Puppeteer was failing to initialize in the Docker container when built on Apple Silicon (M1 Max) due to architecture mismatch issues.
- **Options Considered**:
  1. Use Puppeteer's built-in Chromium download mechanism
  2. Install Chromium directly from Debian repositories
  3. Use a browser-specific Docker image
- **Decision**: Install Chromium directly from Debian repositories and configure Puppeteer to use it (Option 2).
- **Rationale**: This approach ensures architecture compatibility when building on Apple Silicon and running in a Linux container. Using the system-installed Chromium avoids cross-architecture binary issues.
- **Consequences**:
  - Positive: Resolves architecture compatibility issues
  - Positive: Uses the Debian-maintained version of Chromium, which is likely to be more stable
  - Positive: Reduces Docker image size by not downloading a separate Chromium binary
  - Negative: May not always have the latest version of Chromium
  - Negative: Requires explicit configuration of Puppeteer to use the system Chromium

### DR-009: URL Validation for Docker Hostnames
- **Date**: 2025-03-15
- **Context**: The express-validator's `isURL()` validation was rejecting Docker hostnames like "http://LibreChat:3080" because they don't conform to standard URL validation rules.
- **Options Considered**:
  1. Disable URL validation entirely
  2. Modify the URL before validation to use a valid domain
  3. Implement a custom URL validator that accepts both standard URLs and Docker hostnames
- **Decision**: Implemented a custom URL validator that accepts both standard URLs and Docker hostnames (Option 3).
- **Rationale**: This approach maintains security by still validating URLs, while also allowing internal Docker hostnames that are valid in the containerized environment.
- **Consequences**:
  - Positive: Allows navigation to Docker hostnames like "LibreChat"
  - Positive: Maintains security by still validating URL format
  - Positive: Provides better error messages for invalid URLs
  - Negative: More complex validation logic
  - Negative: Requires custom regex patterns that may need maintenance

### DR-010: GitHub Repository Structure and Documentation
- **Date**: 2025-03-15
- **Context**: Preparing the project for GitHub publication requires setting up appropriate repository structure, documentation, and CI/CD.
- **Options Considered**:
  1. Minimal GitHub setup with just code and basic README
  2. Standard GitHub setup with issue/PR templates and basic CI
  3. Comprehensive GitHub setup with detailed templates, CI/CD, CODEOWNERS, and security documentation
- **Decision**: Implemented a comprehensive GitHub setup (Option 3) with detailed templates, CI/CD workflow, CODEOWNERS, and security documentation.
- **Rationale**: This approach provides a professional, well-structured repository that encourages contributions, maintains code quality, and addresses security concerns from the start.
- **Consequences**:
  - Positive: Professional repository appearance and structure
  - Positive: Clear guidelines for contributors
  - Positive: Automated testing and building through CI/CD
  - Positive: Defined code ownership and review responsibilities
  - Positive: Security vulnerability reporting process
  - Negative: More files to maintain
  - Negative: More complex initial setup

### DR-011: MCP SDK Installation Strategy
- **Date**: 2025-03-15
- **Context**: The MCP SDK installation in the Dockerfile was failing, preventing the service from starting in MCP mode.
- **Options Considered**:
  1. Add SDK as explicit dependency in package.json
  2. Enhance npm install command with verification steps
  3. Use multi-stage Docker build with separate dependency layer
  4. Direct download and installation from NPM registry
- **Decision**: Enhanced npm install command with verification steps (Option 2).
- **Rationale**: This approach provides better visibility into the installation process while maintaining the simplicity of the Dockerfile. The additional verification steps help identify and diagnose installation issues.
- **Consequences**:
  - Positive: More robust SDK installation
  - Positive: Better debugging of installation issues
  - Positive: Maintains simplicity compared to multi-stage builds
  - Negative: Slightly more complex Dockerfile
  - Negative: Increased build time due to verification steps

### DR-012: MCP Transport Layer Strategy
- **Date**: 2025-03-15
- **Context**: The current MCP implementation uses stdio transport via Docker exec, but we want to explore alternative transport mechanisms for greater flexibility.
- **Options Considered**:
  1. Continue with stdio transport only
  2. Implement WebSocket transport
  3. Implement Server-Sent Events (SSE) transport
  4. Implement TCP socket transport
- **Decision**: Develop a plan for Server-Sent Events (SSE) transport implementation (Option 3).
- **Rationale**: SSE provides a standardized HTTP-based approach that works well with existing infrastructure while eliminating the need for Docker exec permissions. It's also relatively simple to implement and compatible with LibreChat's configuration options.
- **Consequences**:
  - Positive: More deployment flexibility without Docker exec requirements
  - Positive: Potentially more stable connections
  - Positive: Better scalability for multi-instance deployments
  - Negative: Requires additional code to implement bidirectional communication
  - Negative: Requires changes to both server and client configuration