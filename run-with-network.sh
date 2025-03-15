#!/bin/bash

# Script to run the Puppeteer service with a specified LibreChat network
# Usage: ./run-with-network.sh <network_name>

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

# Run with the specified network
echo "Starting puppeteer-service with network: $NETWORK"
LIBRECHAT_NETWORK=$NETWORK docker-compose up -d

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
else
  echo "Failed to start container."
fi

echo -e "\nTo test API endpoints:"
echo "curl -X POST http://localhost:3000/puppeteer-service/start -H \"Content-Type: application/json\""
echo "curl -X POST http://localhost:3000/puppeteer-service/test -H \"Content-Type: application/json\" -d '{\"browserId\": \"<BROWSER_ID>\", \"url\": \"http://LibreChat:3080\"}'"
echo "curl -X POST http://localhost:3000/puppeteer-service/stop -H \"Content-Type: application/json\" -d '{\"browserId\": \"<BROWSER_ID>\"}'"