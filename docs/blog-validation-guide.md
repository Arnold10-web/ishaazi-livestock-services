# Blog Validation Guide

This document details how blog posts are validated and processed in the Online Farming Magazine system.

## Requirements

### Required Fields
- **title**: String, 3-200 characters
- **content**: String, at least 10 characters
- **author**: String, 2-100 characters (can be provided in metadata)

### Optional Fields
- **category**: String, one of: 'Agriculture', 'Livestock', 'Technology', 'General', 'News'
- **tags**: Array of strings
- **published**: Boolean
- **featured**: Boolean
- **metadata**: Object containing additional information
- **imageUrl**: String (file upload)

## Data Format Validation

The system supports multiple data formats to ensure compatibility with different frontend implementations:

### Tags Handling
Tags can be submitted in multiple formats:
- As a JSON array: `["tag1", "tag2", "tag3"]`
- As a JSON string: `'["tag1", "tag2", "tag3"]'`
- As a comma-separated string: `"tag1,tag2,tag3"`

All formats will be properly converted to an array when saving to the database.

### Boolean Values
Boolean values can be submitted as:
- Actual boolean values: `true` or `false` 
- String values: `"true"` or `"false"`

### Metadata Handling
The metadata field can be:
- A JSON object
- A JSON string that will be parsed into an object

The metadata object can include properties like:
- `author`: String (alternative to the top-level author field)
- `summary`: String (short description for SEO or previews)
- `keywords`: Array of strings (for SEO)

## Testing Blog Form Submission

You can test blog form submission using the included test scripts:

```bash
# Simple blog test
node scripts/simple-blog-test.js

# Comprehensive blog testing
node scripts/complete-blog-test.js
```

## Common Validation Issues

### Tags Not Appearing
Check that tags are being submitted in one of the supported formats. If using FormData, ensure arrays are properly stringified:

```javascript
// Correct way to add tags with FormData
formData.append('tags', JSON.stringify(['tag1', 'tag2']));

// Alternative way
formData.append('tags', 'tag1,tag2'); 
```

### Metadata Not Being Saved
Ensure metadata is submitted as a valid JSON string in FormData:

```javascript
// Correct way to add metadata with FormData
const metadata = {
  summary: 'This is a summary',
  keywords: ['keyword1', 'keyword2']
};
formData.append('metadata', JSON.stringify(metadata));
```

### Author Field Missing
If the author field is missing at the top level, the system will look for it in the metadata. Ensure at least one of these locations has the author information.

## Example: Valid Blog Submission (FormData)

```javascript
const formData = new FormData();

// Required fields
formData.append('title', 'Growing Organic Vegetables');
formData.append('content', '<p>Detailed content about organic vegetables...</p>');
formData.append('author', 'Jane Smith');

// Optional fields
formData.append('category', 'Agriculture');
formData.append('tags', JSON.stringify(['organic', 'vegetables', 'farming']));
formData.append('published', 'true');
formData.append('metadata', JSON.stringify({
  summary: 'Learn how to grow organic vegetables in your backyard',
  keywords: ['organic', 'gardening', 'vegetables']
}));
formData.append('image', imageFile); // If you have an image file
```

## Example: Valid Blog Submission (JSON)

```javascript
const blogData = {
  title: 'Growing Organic Vegetables',
  content: '<p>Detailed content about organic vegetables...</p>',
  author: 'Jane Smith',
  category: 'Agriculture',
  tags: ['organic', 'vegetables', 'farming'],
  published: true,
  metadata: {
    summary: 'Learn how to grow organic vegetables in your backyard',
    keywords: ['organic', 'gardening', 'vegetables']
  }
};
```

## Troubleshooting Steps

If your blog submissions are failing:

1. Check the response from the API for validation errors
2. Ensure all required fields are provided
3. Verify that arrays and objects are properly formatted
4. Check if the author information is present
5. Run the validation test scripts to diagnose issues

If issues persist, check the server logs for more detailed error information.
