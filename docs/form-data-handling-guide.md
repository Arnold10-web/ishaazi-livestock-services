# Form Data Handling Guide

## Overview

This document explains how form data is handled in the Online Farming Magazine application. Understanding this system is important for developers working on the frontend forms and for diagnosing any issues with form submissions.

## Form Data Processing Flow

1. **Client Side**: Forms are submitted either as JSON (direct API calls) or FormData (browser forms)
2. **Server Middleware**: The `formDataCompatibility.js` middleware processes the incoming data
3. **Validation**: The `validation.js` middleware validates the processed data
4. **Controller**: The appropriate controller handles the validated data
5. **Database**: Data is saved to MongoDB via the Mongoose model

## Types of Form Data

### JSON Data
Suitable for API calls from JavaScript:
```javascript
// Example JSON blog submission
fetch('/api/content/blogs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: "Blog Title",
    content: "Blog content",
    author: "Author Name",
    tags: ["tag1", "tag2"]
  })
})
```

### FormData
Suitable for browser form submissions, especially with file uploads:
```javascript
// Example FormData blog submission
const formData = new FormData();
formData.append('title', 'Blog Title');
formData.append('content', 'Blog content');
formData.append('author', 'Author Name');
formData.append('tags', JSON.stringify(['tag1', 'tag2']));
formData.append('image', imageFile);

fetch('/api/content/blogs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

## Special Data Handling

The form data compatibility middleware handles several special cases:

### Arrays (e.g., tags)
- If submitted as a JSON string: `'["tag1","tag2"]'` → Will be parsed into an array
- If submitted as a comma-separated string: `'tag1,tag2'` → Will be split into an array
- If submitted directly as an array: Will be preserved as is

### Objects (e.g., metadata)
- If submitted as a JSON string: Will be parsed into an object
- If submitted directly as an object: Will be preserved as is

### Boolean Values
- String values 'true'/'false' are converted to actual boolean values
- This applies to fields: published, featured, urgent, notificationSent

### Date Fields
- String dates are standardized to ISO format
- This applies to fields: startDate, endDate, registrationDeadline

### Numeric Fields
- String numbers are converted to actual numbers
- This applies to fields: readTime, maxAttendees, ticketPrice

## Testing Forms

To verify form submissions are working correctly:

1. Run the test scripts in the `/scripts` directory
2. Check server logs for any validation errors
3. Verify the data in the MongoDB database

For comprehensive testing, run:
```
./scripts/test-all-forms.sh
```

## Common Issues and Solutions

### Issue: Tags not being saved correctly
**Solution**: Ensure tags are either sent as a JSON string array (`'["tag1","tag2"]'`) or comma-separated string (`'tag1,tag2'`).

### Issue: Boolean fields not being recognized
**Solution**: Send boolean fields as strings 'true'/'false' in FormData, or as actual booleans in JSON.

### Issue: Images not uploading
**Solution**: 
- Ensure the form has `enctype="multipart/form-data"`
- Don't set Content-Type header when using FormData
- Check file size limits in the fileUpload middleware

### Issue: Form validation errors
**Solution**: 
- Check the validation schemas in validation.js
- Look at the detailed error response from the API
- Ensure all required fields are provided

## More Resources

- [Form Data API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [Node.js Multer Documentation](https://github.com/expressjs/multer)
- [Joi Validation Documentation](https://joi.dev/api/?v=17.6.0)
