#!/bin/bash

# Blog Update Test Script Using curl
# This script tests blog creation and updating specifically focusing on tag handling

echo "Starting curl-based blog update test..."
echo "---------------------------------------"

# Step 1: Login to get token
echo "Logging in to get authentication token..."
TOKEN_RESP=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"Admin","password":"Admin123"}' \
  http://localhost:5000/api/admin/login)

TOKEN=$(echo $TOKEN_RESP | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  echo "Response: $TOKEN_RESP"
  exit 1
fi

echo "✅ Authentication token obtained"

# Step 2: Create a test blog
echo "---------------------------------------"
echo "Creating test blog..."
BLOG_ID=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Blog Created with curl $(date +"%Y-%m-%d %H:%M")" \
  -F "content=<p>This is a test blog created with curl</p>" \
  -F "author=Test Author" \
  -F "tags=$(echo '["test","curl","script"]' | jq -c .)" \
  http://localhost:5000/api/content/blogs | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$BLOG_ID" ]; then
  echo "❌ Failed to create blog"
  curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Blog Created with curl" \
  -F "content=<p>This is a test blog created with curl</p>" \
  -F "author=Test Author" \
  -F "tags=$(echo '["test","curl","script"]' | jq -c .)" \
  http://localhost:5000/api/content/blogs
  exit 1
fi

echo "✅ Blog created with ID: $BLOG_ID"

# Step 3: Test updating with array tags as JSON string
echo "---------------------------------------"
echo "Testing update with JSON string tags..."
UPDATE_RESP1=$(curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Updated Blog Title - JSON String Tags" \
  -F "tags=$(echo '["updated","json","tags"]' | jq -c .)" \
  http://localhost:5000/api/content/blogs/$BLOG_ID)

echo "Update Response: $UPDATE_RESP1"

if echo "$UPDATE_RESP1" | grep -q "error" || echo "$UPDATE_RESP1" | grep -q "Error"; then
  echo "❌ Update with JSON string tags failed"
else
  echo "✅ Update with JSON string tags successful"
fi

# Step 4: Verify the update worked by fetching the blog
echo "---------------------------------------"
echo "Verifying update by fetching blog..."
GET_RESP=$(curl -s -X GET \
  http://localhost:5000/api/content/blogs/$BLOG_ID)

echo "Blog Data: $GET_RESP"

echo "---------------------------------------"
echo "Test completed!"
