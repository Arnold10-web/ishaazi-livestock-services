#!/bin/bash
# Blog API Test Script
# This script tests the blog API endpoints using curl

# Configuration
API_URL="http://localhost:5000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
YELLOW='\033[0;33m'

# Get auth token (if authentication is required)
echo -e "${YELLOW}Attempting to login to get auth token...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST $API_URL/admin/login -H "Content-Type: application/json" -d '{"username":"admin", "password":"password"}')
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to get auth token. Tests will likely fail if endpoints require authentication.${NC}"
  echo -e "${YELLOW}Continuing without token...${NC}"
else
  echo -e "${GREEN}Successfully obtained auth token.${NC}"
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

echo "============================================"
echo "TEST 1: Create Blog Post with Author in Top Level"
echo "============================================"
curl -s -X POST "$API_URL/content/blogs" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "title": "Test Blog Post via Script",
    "content": "<p>This is a test blog post content created via API test script.</p>",
    "author": "Test Author",
    "category": "General",
    "tags": ["test", "api", "validation"],
    "published": true,
    "metadata": {
      "keywords": ["test", "api", "farming"],
      "summary": "This is a test summary"
    }
  }' | jq '.' || echo "Failed to parse response"

echo -e "\n"
echo "============================================"
echo "TEST 2: Create Blog Post with Author in Metadata"
echo "============================================"
curl -s -X POST "$API_URL/content/blogs" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "title": "Test Blog with Author in Metadata",
    "content": "<p>This blog post has the author information stored in the metadata object.</p>",
    "category": "Technology",
    "tags": ["test", "metadata"],
    "published": true,
    "metadata": {
      "author": "Metadata Author",
      "keywords": ["test", "metadata", "farming"],
      "summary": "This is a test with author in metadata"
    }
  }' | jq '.' || echo "Failed to parse response"

echo -e "\n"
echo "============================================"
echo "TEST 3: Create Blog Post with Minimal Fields"
echo "============================================"
curl -s -X POST "$API_URL/content/blogs" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "title": "Minimal Blog Post",
    "content": "<p>This is a minimal blog post with only required fields.</p>"
  }' | jq '.' || echo "Failed to parse response"

echo -e "\n"
echo "============================================"
echo "TEST 4: Create Blog Post with FormData (Multipart)"
echo "============================================"
echo "Note: This test simulates form data submission but without file upload"
curl -s -X POST "$API_URL/content/blogs" \
  -H "$AUTH_HEADER" \
  -F "title=Form Data Blog Post" \
  -F "content=<p>This is a blog post created using form data.</p>" \
  -F "author=Form Author" \
  -F "category=General" \
  -F "tags=[\"form\", \"data\", \"test\"]" \
  -F "metadata={\"summary\": \"Form data test\"}" \
  -F "published=true" | jq '.' || echo "Failed to parse response"

echo -e "\n"
echo -e "${GREEN}All tests completed. Check results above for each test.${NC}"
