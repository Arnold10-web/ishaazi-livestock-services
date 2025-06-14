#!/bin/bash

# Simple Admin Form Verification
# This script provides a minimal verification of admin forms without getting caught by rate limiting

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================="
echo -e "ADMIN FORMS VERIFICATION"
echo -e "=============================================${NC}"

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
curl -s http://localhost:5000/api/health > /dev/null

if [ $? -ne 0 ]; then
  echo -e "${RED}Server doesn't appear to be running!${NC}"
  echo -e "Please start the server with 'npm run start' in a separate terminal."
  exit 1
fi

echo -e "${GREEN}Server is running.${NC}"
echo ""

# Function to run a curl command and highlight the result
function run_test() {
  local name=$1
  local command=$2
  
  echo -e "${YELLOW}$name${NC}"
  echo -e "Running: $command"
  
  eval "$command"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Success!${NC}"
  else
    echo -e "${RED}Failed!${NC}"
  fi
  echo ""
}

# Step 1: Get a token
echo -e "${BLUE}Step 1: Get authentication token${NC}"
token=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"Admin","password":"Admin123"}' \
  http://localhost:5000/api/admin/login | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$token" ]; then
  echo -e "${RED}Failed to get authentication token!${NC}"
  echo "Make sure your admin credentials are correct."
  exit 1
fi

echo -e "${GREEN}Successfully got authentication token!${NC}"
echo ""

# Step 2: Create a test blog post
echo -e "${BLUE}Step 2: Create a test blog post${NC}"
timestamp=$(date +%s)
blog_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d "{\"title\":\"Test Blog $timestamp\",\"content\":\"<p>Test content</p>\",\"author\":\"Test Author\"}" \
  http://localhost:5000/api/content/blogs)

blog_id=$(echo $blog_response | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$blog_id" ]; then
  echo -e "${RED}Failed to create blog post!${NC}"
  echo "Response: $blog_response"
  echo ""
  echo -e "${YELLOW}This could be due to:${NC}"
  echo "1. Rate limiting (try waiting 15 minutes)"
  echo "2. Invalid form data"
  echo "3. Server configuration issue"
  exit 1
fi

echo -e "${GREEN}Successfully created blog post with ID: $blog_id${NC}"
echo ""

# Final assessment
echo -e "${BLUE}============================================="
echo -e "VERIFICATION RESULTS"
echo -e "=============================================${NC}"
echo ""
echo -e "${GREEN}✅ Your admin forms are working correctly!${NC}"
echo ""
echo "The test successfully:"
echo "1. Authenticated as an admin"
echo "2. Created a blog post"
echo ""
echo -e "${YELLOW}Note: For more comprehensive testing, run:${NC}"
echo "NODE_ENV=test node scripts/admin-crud-test.js"
echo ""
