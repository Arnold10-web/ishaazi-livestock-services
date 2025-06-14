#!/bin/bash

# Simple Blog Update Test Script Using curl
# This script tests blog creation and updating specifically focusing on tag handling

echo "Starting curl-based blog update test..."
echo "---------------------------------------"

# Step 1: Login to get token
echo "Logging in to get authentication token..."
TOKEN_RESP=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"Admin","password":"Admin123"}' \
  http://localhost:5000/api/admin/login)

echo "Login response: $TOKEN_RESP"
TOKEN=$(echo $TOKEN_RESP | sed 's/.*"token":"\([^"]*\)".*/\1/')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Authentication token obtained"

# Step 2: Create a test blog
echo "---------------------------------------"
echo "Creating test blog..."
CREATE_RESP=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Blog Created with curl" \
  -F "content=<p>This is a test blog created with curl</p>" \
  -F "author=Test Author" \
  -F 'tags=["test","curl","script"]' \
  http://localhost:5000/api/content/blogs)

echo "Create response: $CREATE_RESP"

# Try to extract blog ID
BLOG_ID=$(echo $CREATE_RESP | sed 's/.*"_id":"\([^"]*\)".*/\1/')

if [ -z "$BLOG_ID" ]; then
  echo "❌ Failed to extract blog ID"
  exit 1
fi

echo "✅ Blog created with ID: $BLOG_ID"

# Step 3: Test updating with array tags as JSON string
echo "---------------------------------------"
echo "Testing update with JSON string tags..."
UPDATE_RESP1=$(curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Updated Blog Title - JSON String Tags" \
  -F 'tags=["updated","json","tags"]' \
  http://localhost:5000/api/content/blogs/$BLOG_ID)

echo "Update Response: $UPDATE_RESP1"

echo "---------------------------------------"
echo "Test completed!"
