# LibreChat Puppeteer Service

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![Status: Pre-Alpha](https://img.shields.io/badge/Status-Pre--Alpha-red.svg)]()
[![MCP: Enabled](https://img.shields.io/badge/MCP-Enabled-brightgreen.svg)]()

A containerized Puppeteer service with RESTful API, Server-Sent Events (SSE), and Model Context Protocol (MCP) capabilities, designed for seamless integration with [LibreChat](https://github.com/danny-avila/LibreChat).

> **⚠️ PRE-ALPHA RELEASE**: This is a pre-alpha release with significant [known limitations](LIMITATIONS.md). Not recommended for production use.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [MCP Integration](#mcp-integration)
- [Getting Started](#getting-started)
- [Integration with LibreChat](#integration-with-librechat)
- [Development](#development)
- [Docker Network Configuration](#docker-network-configuration)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)
- [GitHub Preparation](#github-preparation)
- [Contributing](#contributing)
- [License](#license)

## Overview

This service provides a RESTful API for browser automation using Puppeteer, with real-time updates via Server-Sent Events (SSE). It's designed to run in a Docker container and can be easily integrated with LibreChat or other services.

**Current Status**: Alpha - Core functionality is working, but the API may change and additional features are planned.

## Features

- Headless Chrome/Chromium browser automation via Puppeteer
- RESTful API endpoints for control and management
- Server-Sent Events (SSE) for real-time browser automation updates
- Model Context Protocol (MCP) implementation for native LibreChat integration
- Dual-mode operation: REST API (port 3007) or MCP (port 3000)
- Containerized deployment with Docker
- TypeScript implementation
- Docker network integration with LibreChat

### MCP Connection Methods

| Method | Status | Description |
|--------|--------|-------------|
| **stdio** | ✅ Available | Connect using Docker exec and stdin/stdout (default) |
| **SSE** | 🚧 In Development | Connect using HTTP Server-Sent Events (coming soon) |

## API Endpoints

### Browser Management

#### Start Browser Instance
- **Endpoint**: `POST /puppeteer-service/start`
- **Description**: Creates a new browser instance and returns a browserId
- **Request Body**: None
- **Response**:
  ```json
  {
    "browserId": "7cb84fc4-c933-49e9-b265-4edfba166917",
    "message": "Browser instance created successfully"
  }
  ```

#### Stop Browser Instance
- **Endpoint**: `POST /puppeteer-service/stop`
- **Description**: Stops a browser instance
- **Request Body**:
  ```json
  {
    "browserId": "7cb84fc4-c933-49e9-b265-4edfba166917"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Browser instance 7cb84fc4-c933-49e9-b265-4edfba166917 closed successfully"
  }
  ```

### Testing

#### Navigate and Screenshot
- **Endpoint**: `POST /puppeteer-service/test`
- **Description**: Navigates to a URL, takes a screenshot, and returns the screenshot as base64
- **Request Body**:
  ```json
  {
    "browserId": "7cb84fc4-c933-49e9-b265-4edfba166917",
    "url": "https://example.com"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Test completed successfully",
    "screenshot": "base64-encoded-image-data",
    "content": "HTML content of the page"
  }
  ```

### Server-Sent Events

#### SSE Connection
- **Endpoint**: `GET /puppeteer-service/events`
- **Description**: Establishes a Server-Sent Events connection for real-time updates
- **Response**: Stream of events in the format:
  ```
  event: browser-event
  data: {"type":"browser-started","browserId":"7cb84fc4-c933-49e9-b265-4edfba166917"}
  ```

#### Test SSE
- **Endpoint**: `POST /puppeteer-service/events/test`
- **Description**: Sends a test event to all connected SSE clients
- **Request Body**:
  ```json
  {
    "message": "Test event"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Event sent successfully"
  }
  ```

### Health Check

- **Endpoint**: `GET /health`
- **Description**: Returns the health status of the service
- **Response**:
  ```json
  {
    "status": "UP",
    "timestamp": "2025-03-15T16:03:53.898Z",
    "puppeteer": "READY",
    "mode": "REST API"
  }
  ```

## MCP Integration

The Puppeteer service implements the [Model Context Protocol (MCP)](https://github.com/model-context-protocol/mcp), enabling native integration with LibreChat.

### MCP Tools

The following tools are available via MCP:

#### Browser Management Tools
- `create_browser`: Create a new browser instance
- `close_browser`: Close a browser instance
- `list_browsers`: List all active browser instances

#### Page Navigation Tools
- `create_page`: Create a new page in a browser instance
- `navigate_to`: Navigate to a URL in a page
- `get_page_content`: Get the HTML content of a page
- `close_page`: Close a page

#### Screenshot Tools
- `take_screenshot`: Take a screenshot of a page

### MCP Resources

The following resources are available via MCP:

- `puppeteer://browsers`: List of active browser instances
- `puppeteer://browser/{browserId}/page/{pageId}/screenshot`: Screenshot of a specific page
- `puppeteer://browser/{browserId}/page/{pageId}/content`: HTML content of a specific page

### Running in MCP Mode

To start the service in MCP mode:

```bash
# Make the script executable
chmod +x start-mcp.sh

# Run with default network (librechat_default)
./start-mcp.sh

# Or specify a network
./start-mcp.sh librechat2_default
```

For detailed instructions on MCP integration, see [MCP_INTEGRATION.md](MCP_INTEGRATION.md).

## Getting Started

### Prerequisites

- Docker
- Docker Compose (optional, for local development)

### Running with Docker

1. Build the Docker image:

```bash
docker build -t puppeteer-service .
```

2. Run the container:

```bash
docker run -p 3000:3000 puppeteer-service
```

### Running with Docker Compose

```bash
docker-compose up
```

### Integration with LibreChat

There are two ways to integrate with LibreChat:

#### Option 1: MCP Integration (Recommended)

This is the preferred method as it provides native integration with LibreChat's AI capabilities:

1. Start the Puppeteer service in MCP mode:

```bash
# Make the script executable
chmod +x start-mcp.sh

# Run with default network (librechat_default)
./start-mcp.sh
```

2. Add the Puppeteer service to LibreChat's `librechat.yaml` configuration:

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
    timeout: 300000
```

3. Restart LibreChat to apply the changes.

See [MCP_INTEGRATION.md](MCP_INTEGRATION.md) for detailed instructions.

#### Option 2: REST API Integration

For legacy or custom integrations, you can use the REST API:

1. Start the Puppeteer service with a specific LibreChat network:

```bash
# Make the script executable
chmod +x start-puppeteer-service.sh

# Run with default network (librechat_default)
./start-puppeteer-service.sh

# Or specify a network
./start-puppeteer-service.sh librechat2_default
```

2. Test the API endpoints:

```bash
# Make the script executable
chmod +x test-puppeteer-api.sh

# Run the tests
./test-puppeteer-api.sh
```

3. Update the LibreChat docker-compose.override.yml file to integrate with our service. See `memory-bank/librechat-override-update.md` for detailed instructions.

## Development

### Prerequisites

- Node.js 20 or later
- npm

### Installation

```bash
npm install
```

### Running in Development Mode

```bash
# Run in REST API mode (default)
npm run dev

# Run in REST API mode explicitly
npm run dev:rest

# Run in MCP mode
npm run dev:mcp
```

### Building

```bash
npm run build
```

### Running in Production Mode

```bash
# Run in REST API mode (default)
npm start

# Run in REST API mode explicitly
npm run start:rest

# Run in MCP mode
npm run start:mcp
```

## Docker Network Configuration

The service is configured to connect to two Docker networks:

1. **LibreChat Network**: Allows communication with the LibreChat application
2. **MCP Services Network**: A dedicated network for microservices

You can specify which LibreChat network to connect to using the `LIBRECHAT_NETWORK` environment variable:

```bash
# For REST API mode
LIBRECHAT_NETWORK=librechat_default docker-compose up -d

# For MCP mode
LIBRECHAT_NETWORK=librechat_default MCP_MODE=true docker-compose up -d
```

The service exposes different ports depending on the mode:

- **REST API Mode**: Port 3007 for RESTful API endpoints
- **MCP Mode**: Port 3000 for MCP communication

## Troubleshooting

### Common Issues

#### Docker Network Issues

**Problem**: The Puppeteer service can't connect to LibreChat.

**Solution**: Make sure you're using the correct LibreChat network name. You can list available networks with:
```bash
docker network ls | grep librechat
```

Then start the service with the correct network:
```bash
./run-with-network.sh <network_name>
```

#### URL Validation Errors

**Problem**: When trying to navigate to a Docker hostname URL, you get a validation error.

**Solution**: Make sure you're using the latest version of the service, which includes a custom URL validator that accepts Docker hostnames.

#### Browser Instance Limit

**Problem**: You receive an error when trying to create too many browser instances.

**Solution**: The service has a limit of 5 concurrent browser instances. Close unused instances before creating new ones.

#### MCP Integration Issues

**Problem**: LibreChat can't connect to the Puppeteer service via MCP.

**Solution**:
1. Make sure the Puppeteer service is running in MCP mode (`MCP_MODE=true`).
2. Verify the `librechat.yaml` configuration is correct.
3. Check that both services are on the same Docker network.
4. Verify the Docker exec command works manually:
   ```bash
   docker exec -i puppeteer-service node /app/dist/index.js
   ```

#### MCP SDK Installation Issues

**Problem**: The Docker build fails with MCP SDK installation errors.

**Solution**: The Dockerfile has been updated with enhanced MCP SDK installation verification. If you're still experiencing issues:
1. Make sure you're using the latest Dockerfile
2. Try rebuilding with `docker build --no-cache -t puppeteer-service .`
3. Check the Docker build logs for specific error messages

#### Container Resource Issues

**Problem**: The container crashes or becomes unresponsive.

**Solution**: Increase the resource limits in docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
```

### Debugging

#### Viewing Logs

To view the container logs:
```bash
docker logs puppeteer-service
```

For more detailed logs, set the LOG_LEVEL environment variable to "debug" in docker-compose.yml:
```yaml
environment:
  - LOG_LEVEL=debug
```

#### Health Check

You can check the service health at any time:
```bash
# For REST API mode
curl http://localhost:3007/health

# For MCP mode (no HTTP endpoint, check logs instead)
docker logs puppeteer-service | grep "MCP server is running"
```

## Known Limitations

This project is currently in **pre-alpha** status and has several known limitations. Please refer to the [LIMITATIONS.md](LIMITATIONS.md) file for a comprehensive list of current limitations and issues.

Key limitations include:
- Limited to 5 concurrent browser instances
- Browser sessions are not persistent across container restarts
- Only supports stdio transport for MCP integration (SSE transport in development)
- No authentication mechanism for API access
- No built-in support for load balancing or horizontal scaling
- Limited error handling and propagation
- Limited URL validation
- Not recommended for production use

## GitHub Preparation

Before pushing this project to GitHub, ensure the following tasks are completed:

### Required Files

- [x] Code of Conduct (`CODE_OF_CONDUCT.md`)
- [x] Contributing Guide (`CONTRIBUTING.md`)
- [x] License (`LICENSE.md`)
- [x] Security Policy (`SECURITY.md`)
- [x] Comprehensive README (`README.md`)
- [x] Known Limitations (`LIMITATIONS.md`)
- [ ] Issue Templates (`.github/ISSUE_TEMPLATE/*.md`)
- [ ] Pull Request Template (`.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`)
- [ ] GitHub Workflow Files (`.github/workflows/*.yml`)

### GitHub-Specific Configuration

1. **Issue Templates**: Create templates for bug reports, feature requests, and documentation updates:
   ```bash
   mkdir -p .github/ISSUE_TEMPLATE
   # Create template files here
   ```

2. **Pull Request Template**: Create a template for pull requests:
   ```bash
   mkdir -p .github/PULL_REQUEST_TEMPLATE
   # Create pull_request_template.md
   ```

3. **GitHub Actions Workflow**: Set up CI/CD for testing and building:
   ```bash
   mkdir -p .github/workflows
   # Create workflow files here
   ```

4. **Branch Protection Rules**: Configure these in the GitHub repository settings after pushing.

5. **Repository Description and Topics**: Prepare these for the GitHub repository settings.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.