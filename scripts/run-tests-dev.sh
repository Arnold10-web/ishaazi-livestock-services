#!/bin/bash

# Run Admin Form Tests with NODE_ENV=test
# This script runs the admin form tests with NODE_ENV set to 'test'
# to bypass rate limiting for testing purposes.

# Set environment variable for tests
export NODE_ENV="test"

echo "🔹 Running admin CRUD test with NODE_ENV=test"
node scripts/admin-crud-test.js

echo ""
echo "🔹 Do you want to run more comprehensive tests? (y/n)"
read response

if [[ "$response" == "y" || "$response" == "Y" ]]; then
  echo ""
  echo "🔹 Running admin forms test with NODE_ENV=test"
  node scripts/admin-forms-test.js
  
  echo ""
  echo "🔹 Running form data validation test with NODE_ENV=test"
  node scripts/form-data-validation-test.js
fi

# Reset environment variable
unset NODE_ENV

echo ""
echo "✅ Testing completed!"
