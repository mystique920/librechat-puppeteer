#!/bin/bash

# Script to start the Puppeteer service with a specified LibreChat network
# Usage: ./start-puppeteer-service.sh <network_name>

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
else
  echo "Failed to start container."
fi

echo -e "\nTo test the health endpoint:"
echo "curl http://localhost:3000/health"