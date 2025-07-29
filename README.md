# 🌾 Ishaazi Livestock Services

**Production-Ready Agricultural Content Management Platform**

This is a full-stack web application for an online farming magazine specializing in livestock content (beef, dairy, goats, piggery). The platform features comprehensive admin management, email systems, and real-time notifications.

## 📖 Complete Documentation

**📋 For all deployment, architecture, and optimization details:**
**[COMPLETE_DOCUMENTATION.md](./COMPLETE_DOCUMENTATION.md)** - Complete guide with everything you need

This consolidated document includes:
- ⚡ Immediate deployment commands
- 🔧 Critical fixes implemented  
- 🏗️ Architecture overview
- 📊 Performance monitoring
- 🧹 Script cleanup strategy
- ⚠️ Rollback procedures

## 🚀 Quick Start

### Production Deployment (Railway)
```bash
# Deploy critical optimizations
node scripts/criticalIndexes.js
node scripts/cleanupCode.js --execute

# Clean up deployment scripts
git rm scripts/criticalIndexes.js scripts/cleanupCode.js
git commit -m "Remove deployment scripts" && git push
```

## Technologies Used

### Frontend
- React with modern hooks
- Tailwind CSS for styling
- Service Worker (PWA features)
- Comprehensive Jest/RTL testing

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT for authentication
- Bcrypt for password hashing

## Project Structure

The project is divided into two main parts:

- `farming-magazine-frontend`: Contains the React frontend application.
- Backend: The root directory contains the backend application, including:
    - `controllers`: Request handlers for different routes.
    - `middleware`: Custom middleware for authentication, error handling, etc.
    - `models`: Mongoose schemas for database models.
    - `routes`: Express routes for different API endpoints.
    - `services`: Business logic for various features.
    - `utils`: Utility functions.
    - `config`: Configuration files (e.g., database connection).

## Setup and Running the Project

### Prerequisites

- Node.js and npm installed
- MongoDB installed and running

### Backend Setup

1. Clone the repository.
2. Navigate to the root directory of the project.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add the following environment variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/farming_magazine
   JWT_SECRET=your_jwt_secret
   ```
5. Start the backend server:
   ```bash
   npm start
   ```
   Or, to run in development mode with nodemon:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the `farming-magazine-frontend` directory:
   ```bash
   cd farming-magazine-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm start
   ```
   The frontend will be accessible at `http://localhost:3000`.

## Available Scripts

The following scripts are available in the `package.json` file in the root directory:

- `npm start`: Starts the backend server.
- `npm run dev`: Starts the backend server in development mode with nodemon.
- `npm run lint`: Lints the backend code using ESLint.
- `npm test`: Runs backend tests using Jest.
- `npm run test:watch`: Runs backend tests in watch mode.
- `npm run test:coverage`: Generates a backend test coverage report.
- `npm run frontend:test`: Runs frontend tests.
- `npm run frontend:build`: Builds the frontend application for production.
- `npm run frontend:install`: Installs frontend dependencies.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Submit a pull request.
