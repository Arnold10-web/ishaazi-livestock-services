#!/bin/bash

# Direct curl test for blog update

# Get a token
echo "Getting authentication token..."
TOKEN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"Admin","password":"Admin123"}' \
  http://localhost:5000/api/admin/login | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi
echo "Got token: $TOKEN"

# Create a test blog
echo -e "\nCreating test blog..."
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Blog for curl update $(date +%s)" \
  -F "content=<p>Test content</p>" \
  -F "author=Test Author" \
  http://localhost:5000/api/content/blogs)

echo "Create response: $CREATE_RESPONSE"
BLOG_ID=$(echo $CREATE_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$BLOG_ID" ]; then
  echo "Failed to get blog ID"
  exit 1
fi
echo "Created blog with ID: $BLOG_ID"

# Update the blog with simple fields only
echo -e "\nUpdating blog with simple title only..."
UPDATE_RESPONSE=$(curl -v -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Updated Title via curl" \
  http://localhost:5000/api/content/blogs/$BLOG_ID 2>&1)

echo -e "\nUpdate response: $UPDATE_RESPONSE"

# Get the blog to verify the update
echo -e "\nGetting updated blog..."
GET_RESPONSE=$(curl -s -X GET http://localhost:5000/api/content/blogs/$BLOG_ID)
echo "Get response: $GET_RESPONSE"
