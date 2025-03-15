# Puppeteer Service Project Brief

## Overview
A Docker-based service that provides access to Puppeteer browser automation through RESTful endpoints and Server-Sent Events (SSE).

## Project Structure
```
~/Puppeteer/
├── Dockerfile
├── docker-compose.yml
├── src/
│   ├── index.ts          # Main service entry point
│   ├── controllers/      # API endpoint controllers
│   ├── services/         # Puppeteer service implementations
│   └── utils/            # Helper functions
├── tests/                # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Implementation Phases

### Phase 1: Docker Environment Preparation
- Base Docker image: Debian-based (official Debian or Node.js Docker image)
- Node.js LTS latest stable version
- npm package manager
- Git (to pull repositories or for debugging/version control)
- curl (for later endpoint testing from inside the container)
- wget (for downloading necessary resources)
- build-essential for compilation tasks
- TypeScript Compiler (typescript)
- Supervisor or systemd replacement (optional, if required to manage services in a containerized setup)

### Phase 2: Chromium Installation and Puppeteer Dependencies
- Stable headless Chromium (specific version compatible with Puppeteer)
- Puppeteer npm package (community supported or official version)
- MCP Server (specified Puppeteer MCP Server project repository cloned into container)
- Puppeteer additional system dependencies (gconf-service, libappindicator1, etc.)

### Phase 3: MCP (Message Control Protocol) Server Configuration
- Validate cloning, compiling, running Puppeteer MCP server within Docker
- Verify Puppeteer MCP server startup command via Docker entrypoint/cmd
- Set up stdin/stdout redirection testing

### Phase 4: Transforming the MCP Server Into a RESTful Endpoint with SSE
- Node.js HTTP framework (Express.js, Fastify, etc.)
- Server-Sent Events (SSE) support
- Middleware libraries for request parsing
- Logging and monitoring utilities

### Phase 5: Specific Endpoint Design and Functional Requirements
- `/puppeteer-service/start`: Launch Puppeteer/browser instance
- `/puppeteer-service/stop`: Stop active Puppeteer instances
- `/puppeteer-service/test`: Test endpoint to launch Chromium
- `/puppeteer-service/events`: SSE endpoint for real-time updates

### Phase 6: Docker Networking Considerations
- Exposed Docker ports mapping
- Internal networking setup
- Docker Compose configuration

### Phase 7: Testing and Validation Tools
- REST/SSE endpoint testing
- Puppeteer unit testing framework
- Docker container healthchecks