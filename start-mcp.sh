#!/bin/bash

# Script to run the Puppeteer service in MCP mode with a specified LibreChat network
# Usage: ./start-mcp.sh <network_name>

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

# Run with the specified network in MCP mode
echo "Starting puppeteer-service in MCP mode with network: $NETWORK"
LIBRECHAT_NETWORK=$NETWORK MCP_MODE=true docker-compose up -d

# Check if the container started successfully
if [ $? -eq 0 ]; then
  echo "Container started successfully in MCP mode."
  echo "Container status:"
  docker ps | grep puppeteer-service
  
  echo -e "\nContainer logs:"
  docker logs puppeteer-service
  
  echo -e "\nNetwork connections:"
  echo "Connected to $NETWORK:"
  docker network inspect $NETWORK | grep puppeteer-service
  
  echo "Connected to mcp-services:"
  docker network inspect mcp-services | grep puppeteer-service
  
  echo -e "\nThe MCP server is now running and ready to be used by LibreChat."
  echo "Make sure to update LibreChat's librechat.yaml to include the Puppeteer MCP server:"
  echo -e "\n---"
  echo "mcpServers:"
  echo "  puppeteer-service:"
  echo "    type: stdio"
  echo "    command: docker"
  echo "    args:"
  echo "      - exec"
  echo "      - -i"
  echo "      - puppeteer-service"
  echo "      - node"
  echo "      - /app/dist/index.js"
  echo "    env:"
  echo "      - MCP_MODE=true"
  echo "    timeout: 300000"
  echo -e "---\n"
else
  echo "Failed to start container."
fi