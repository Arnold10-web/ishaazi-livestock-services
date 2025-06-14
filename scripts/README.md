# Admin Form Testing Suite

This directory contains several test scripts to ensure that all your admin forms are working correctly for submitting information to the database, and that admins can create, update, and delete content without any issues.

## Available Test Scripts

1. **admin-crud-test.js** - A simple test script that verifies basic CRUD (Create, Read, Update, Delete) operations for the admin panel.

2. **admin-forms-test.js** - A comprehensive test suite that checks all admin forms for different content types using both JSON and FormData.

3. **form-data-validation-test.js** - Focuses on testing form data validation and handling of complex data types.

4. **simple-blog-test.js** - A basic script that tests blog creation with FormData.

## Running the Tests

Before running the tests, ensure your server is running:

```bash
# Start your server
npm run start
```

Then, in a separate terminal, run any of the test scripts:

```bash
# Simple admin CRUD test (recommended for quick verification)
node scripts/admin-crud-test.js

# Comprehensive admin forms test
node scripts/admin-forms-test.js

# Form data validation test
node scripts/form-data-validation-test.js

# Simple blog test
node scripts/simple-blog-test.js
```

## What Each Test Verifies

### admin-crud-test.js
- Admin login authentication
- Creating a blog post
- Updating the blog post
- Verifying the update was successful
- Deleting the blog post
- Verifying the deletion was successful

### admin-forms-test.js
- Tests multiple content types (blogs, news, events)
- Tests both JSON and FormData submissions
- Tests updating content
- Tests deleting content

### form-data-validation-test.js
- Tests handling of required fields
- Tests handling of complex data types (arrays, objects)
- Tests validation error handling
- Tests different formats for array data (JSON string, comma-separated)

## Troubleshooting

If any tests fail:

1. Check the error messages in the test output
2. Verify that your server is running 
3. Check that your database connection is working
4. Verify that the admin credentials in the test scripts match your system

## Additional Notes

- These tests are designed to run against your local development environment
- They use the admin credentials specified at the top of each script (modify if needed)
- The tests clean up after themselves to avoid leaving test data in your database
