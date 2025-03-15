#!/bin/bash

# Script to test the Puppeteer service API endpoints
# Usage: ./test-puppeteer-api.sh

# Base URL for the API
BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Function to check if jq is installed
check_jq() {
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}Warning: jq is not installed. JSON responses will not be formatted.${NC}"
    JQ_AVAILABLE=false
  else
    JQ_AVAILABLE=true
  fi
}

# Function to format JSON if jq is available
format_json() {
  if [ "$JQ_AVAILABLE" = true ]; then
    echo "$1" | jq
  else
    echo "$1"
  fi
}

# Check health endpoint
test_health() {
  print_header "Testing Health Endpoint"
  
  response=$(curl -s $BASE_URL/health)
  echo "Response:"
  format_json "$response"
  
  if [[ $response == *"UP"* ]]; then
    echo -e "\n${GREEN}✓ Health check passed${NC}"
    return 0
  else
    echo -e "\n${RED}✗ Health check failed${NC}"
    return 1
  fi
}

# Start a browser instance
start_browser() {
  print_header "Starting Browser Instance"
  
  response=$(curl -s -X POST $BASE_URL/puppeteer-service/start \
    -H "Content-Type: application/json")
  
  echo "Response:"
  format_json "$response"
  
  if [[ $response == *"browserId"* ]]; then
    browser_id=$(echo $response | grep -o '"browserId":"[^"]*' | cut -d'"' -f4)
    echo -e "\n${GREEN}✓ Browser started successfully${NC}"
    echo "Browser ID: $browser_id"
    return 0
  else
    echo -e "\n${RED}✗ Failed to start browser${NC}"
    return 1
  fi
}

# Test navigation to a URL
test_navigation() {
  local browser_id=$1
  local url=$2
  
  print_header "Testing Navigation to $url"
  
  response=$(curl -s -X POST $BASE_URL/puppeteer-service/test \
    -H "Content-Type: application/json" \
    -d "{\"browserId\":\"$browser_id\",\"url\":\"$url\"}")
  
  # Only show a portion of the response if it contains a screenshot (to avoid flooding the terminal)
  if [[ $response == *"screenshot"* ]]; then
    echo "Response contains screenshot data (truncated for readability)"
    echo "$response" | head -c 300
    echo "..."
  else
    echo "Response:"
    format_json "$response"
  fi
  
  if [[ $response == *"message"*"Test completed successfully"* ]]; then
    echo -e "\n${GREEN}✓ Navigation successful${NC}"
    return 0
  else
    echo -e "\n${RED}✗ Navigation failed${NC}"
    return 1
  fi
}

# Stop a browser instance
stop_browser() {
  local browser_id=$1
  
  print_header "Stopping Browser Instance"
  
  response=$(curl -s -X POST $BASE_URL/puppeteer-service/stop \
    -H "Content-Type: application/json" \
    -d "{\"browserId\":\"$browser_id\"}")
  
  echo "Response:"
  format_json "$response"
  
  if [[ $response == *"message"*"closed successfully"* ]]; then
    echo -e "\n${GREEN}✓ Browser stopped successfully${NC}"
    return 0
  else
    echo -e "\n${RED}✗ Failed to stop browser${NC}"
    return 1
  fi
}

# Main test sequence
main() {
  check_jq
  
  # Test health endpoint
  test_health
  if [ $? -ne 0 ]; then
    echo -e "\n${RED}Health check failed. Aborting tests.${NC}"
    exit 1
  fi
  
  # Start a browser
  start_browser
  if [ $? -ne 0 ]; then
    echo -e "\n${RED}Failed to start browser. Aborting tests.${NC}"
    exit 1
  fi
  
  # Get the browser ID from the response
  browser_id=$(echo $response | grep -o '"browserId":"[^"]*' | cut -d'"' -f4)
  
  # Test navigation to example.com
  test_navigation "$browser_id" "https://example.com"
  
  # Test navigation to LibreChat (if available)
  test_navigation "$browser_id" "http://LibreChat:3080"
  
  # Stop the browser
  stop_browser "$browser_id"
  
  print_header "Test Summary"
  echo -e "${GREEN}All tests completed.${NC}"
}

# Run the tests
main