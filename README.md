Ishaazi Livestock Services
Welcome to the Ishaazi Livestock Services platform, a comprehensive online farming magazine and livestock services application. This project consists of a backend server built with Node.js, Express, and MongoDB, and a frontend application developed using React. The platform offers features such as managing content, handling admin operations, and providing services related to farming, livestock, and auctions.

Table of Contents
Features
Getting Started
Backend Structure
Frontend Structure
Scripts
Environment Variables
Contributing
License


Features
Content Management: Create, update, and delete blog posts and news articles.
Admin Operations: Manage users, content, and other administrative tasks.
Livestock Services: Provide services related to farming, livestock, and auctions.
Secure Authentication: User authentication using JSON Web Tokens (JWT).
Responsive Design: Frontend built with React for a seamless user experience.


Getting Started
Backend
1.
Clone the repository:
git clone https://github.com/arnold-ishaazi/ishaazi-livestock-services.git
2.
Navigate to the project directory:
cd ishaazi-livestock-services
3.
Install dependencies:
npm install
4.
Set up environment variables:
cp .env.example .env
5.
Start the server:
npm start


Frontend
1.
Navigate to the frontend directory:
cd farming-magazine-frontend
2.
Install dependencies:
npm install
3.
Set up environment variables:
cp .env.example .env
4.
Start the app:
npm start


Backend Structure
config: Contains configuration files, such as db.js for database connection.
controllers: Handles the logic for different routes and endpoints.
middleware: Contains middleware functions for request and response handling.
models: Defines Mongoose schemas for MongoDB collections.
routes: Defines the routes and endpoints for the application.


Frontend Structure
src: Contains the source code for React components.
public: Contains static assets like images, CSS, and JavaScript files.


Scripts
Backend
start: Runs the application using Node.js.
dev: Runs the application using nodemon for automatic restarts.
lint: Checks code quality using ESLint.
test: Runs tests using Jest.


Frontend
start: Starts the React application.
build: Builds the React application for production.
test: Runs tests using Jest.
eject: Ejects the project from the Create React App template.


Environment Variables
Ensure you have the following environment variables set in your .env file:

PORT: The port on which the server will run.
MONGODB_URI: The URI for connecting to MongoDB.
JWT_SECRET: Secret key for signing JWTs.
REACT_APP_FRONTEND_URL: URL of the frontend application.



