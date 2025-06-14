#!/bin/bash

# Test All Admin Forms
# This script runs all the form testing scripts to validate that admin operations work correctly

# Console colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================="
echo -e "ADMIN FORM TESTING SUITE"
echo -e "===========================================${NC}"
echo ""

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
curl -s http://localhost:5000/api/health > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}Server doesn't appear to be running at http://localhost:5000${NC}"
  echo -e "${YELLOW}Starting server...${NC}"
  
  # Try to start the server in a new terminal window
  # This approach differs depending on your desktop environment and terminal
  # You may need to modify this based on your setup
  gnome-terminal -- npm run start 2>/dev/null || \
  xterm -e "npm run start" 2>/dev/null || \
  echo -e "${RED}Failed to start server automatically.${NC} Please start the server manually with 'npm run start' in a separate terminal."

  # Give the server time to start up
  echo -e "${YELLOW}Waiting for server to start...${NC}"
  sleep 5
  
  # Check again if server is running
  curl -s http://localhost:5000/api/health > /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}Server still not running. Please start the server manually.${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}Server is running!${NC}"
echo ""

# Run the basic CRUD test first
echo -e "${BLUE}==========================================="
echo -e "RUNNING BASIC ADMIN CRUD TEST"
echo -e "==========================================${NC}"
node scripts/admin-crud-test.js
echo ""

# Ask if user wants to run more extensive tests
echo -e "${YELLOW}Do you want to run more comprehensive form tests? This will take longer. (y/n)${NC}"
read answer

if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    # Run the comprehensive admin forms test
    echo -e "${BLUE}==========================================="
    echo -e "RUNNING COMPREHENSIVE ADMIN FORMS TEST"
    echo -e "==========================================${NC}"
    node scripts/admin-forms-test.js
    echo ""
    
    # Run the form data validation test
    echo -e "${BLUE}==========================================="
    echo -e "RUNNING FORM DATA VALIDATION TEST"
    echo -e "==========================================${NC}"
    node scripts/form-data-validation-test.js
    echo ""
fi

echo -e "${GREEN}==========================================="
echo -e "ALL TESTS COMPLETED"
echo -e "==========================================${NC}"
echo ""
echo -e "Check the test results above to verify that your admin forms are working correctly."
echo -e "If any tests failed, review the error messages for details on what needs to be fixed."
