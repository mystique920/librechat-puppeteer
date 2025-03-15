# Product Context

## Product Definition
Puppeteer service providing browser automation capabilities through a RESTful API and Server-Sent Events (SSE). This service will be containerized using Docker for easy deployment and integration with other systems like LibreChat.

## Key Features
- Headless Chrome/Chromium browser automation via Puppeteer
- RESTful API endpoints for control and management
- Server-Sent Events (SSE) for real-time browser automation updates
- Containerized deployment with Docker
- MCP Server integration

## Technical Stack
- Node.js and TypeScript
- Puppeteer for browser automation
- Express.js (or similar) for RESTful API
- Docker for containerization
- Jest/Mocha for testing

## Target Users & Use Cases
- Integration with LibreChat service
- Developers needing browser automation capabilities
- Systems requiring headless browser testing or scraping functionality

## Integration Points
- RESTful API endpoints
- SSE events stream
- Docker networking with other containers (especially LibreChat)

## Constraints & Requirements
- Must run efficiently in a Docker container
- Needs to handle multiple simultaneous browser instances
- Should provide real-time updates via SSE
- Must be secure and stable