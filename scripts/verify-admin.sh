#!/bin/bash

# Admin Forms Test Suite Runner
# This script runs tests to verify admin forms are working correctly

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================="
echo -e "ADMIN FORMS TESTING SOLUTION"
echo -e "=============================================${NC}"
echo ""

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
curl -s http://localhost:5000/api/health > /dev/null
SERVER_RUNNING=$?

if [ $SERVER_RUNNING -ne 0 ]; then
  echo -e "${YELLOW}Starting server in the background...${NC}"
  # Start the server in the background
  npm run start > server.log 2>&1 &
  SERVER_PID=$!
  echo -e "Server started with PID: $SERVER_PID"
  
  # Give server time to start
  echo -e "Waiting for server to initialize..."
  sleep 5
  
  # Check again if server is running
  curl -s http://localhost:5000/api/health > /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}Server didn't start properly. Please check server.log${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}Server is running!${NC}"
echo ""

# Temporarily modify the rate limiter to allow tests
echo -e "${YELLOW}Temporarily modifying rate limiter for testing...${NC}"

# Create backup of sanitization.js
cp middleware/sanitization.js middleware/sanitization.js.bak

# Replace the rate limiter with a dummy function
cat > middleware/sanitization.js.temp << EOL
// This is a temporary version for testing

$(grep -v "export const sensitiveOperationLimiter" middleware/sanitization.js)

// TEMPORARILY DISABLED FOR TESTING
export const sensitiveOperationLimiter = (req, res, next) => {
  // Bypass rate limiting during testing
  next();
};
EOL

# Replace the original file with the temporary version
mv middleware/sanitization.js.temp middleware/sanitization.js

# Restart server if we started it
if [ $SERVER_RUNNING -ne 0 ]; then
  echo -e "${YELLOW}Restarting server with modified rate limiter...${NC}"
  kill $SERVER_PID
  npm run start > server.log 2>&1 &
  SERVER_PID=$!
  echo -e "Server restarted with PID: $SERVER_PID"
  sleep 5
fi

# Run the simple verification test
echo -e "${BLUE}============================================="
echo -e "RUNNING ADMIN FORM VERIFICATION"
echo -e "=============================================${NC}"
echo ""

# Run verification script (CommonJS version for compatibility)
NODE_OPTIONS="--experimental-modules" node scripts/verify-admin-forms.js

# Check exit code from verification script
VERIFICATION_RESULT=$?

# Restore original files
echo -e "${YELLOW}Restoring original configuration...${NC}"
mv middleware/sanitization.js.bak middleware/sanitization.js

# Stop server if we started it
if [ $SERVER_RUNNING -ne 0 ]; then
  echo -e "${YELLOW}Stopping test server...${NC}"
  kill $SERVER_PID
fi

# Final status message
if [ $VERIFICATION_RESULT -eq 0 ]; then
  echo -e "${GREEN}============================================="
  echo -e "ALL TESTS COMPLETED SUCCESSFULLY"
  echo -e "=============================================${NC}"
  echo ""
  echo -e "Your admin forms are working properly!"
else
  echo -e "${RED}============================================="
  echo -e "TESTS FAILED"
  echo -e "=============================================${NC}"
  echo ""
  echo -e "Please check the error messages above for details."
fi
