# Express.js Mock Server

## 1. Install Dependencies
Navigate to the mock-server directory and install dependencies:
```
cd mock-server
npm install
```

## 2. Understanding Express.js
Express.js is a minimal and flexible Node.js web application framework. It provides:
- **Routing**: Handle HTTP requests to different URLs
- **Middleware**: Process requests before they reach route handlers
- **Static Files**: Serve files like CSS, JavaScript, and images
- **Request/Response Handling**: Easily parse JSON, query strings, and form data

## 3. Project Structure
- **server.js**: Main Express server entry point
- **routes/users.js**: API endpoints for user management
- **routes/sessions.js**: API endpoints for session management
- **db.js**: Mock database/data storage

## 4. Run the Mock Server
```
npm start
```
The server will start at http://localhost:3000

## 5. Test the API
```
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"device_uuid":"550e8400-e29b-41d4-a716-446655440000","user_type":"YOUTH","age_range":"18_25","gender":"MALE","language":"FR"}'
```

## 6. Express.js Basics
- **Routes**: Define endpoints using `app.get()`, `app.post()`, `app.put()`, `app.delete()`
- **Middleware**: Use `app.use()` to add middleware like `express.json()`
- **Response Methods**: `res.json()`, `res.send()`, `res.status()`
- **Error Handling**: Implement error middleware for centralized error handling
