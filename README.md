# Express.js Mock Server & API Contract

## Overview

This project contains two key components:

1. **Mock Server** - A local Express.js server used during frontend development
2. **API Contract** - OpenAPI specification defining the interface between backend and frontend

### What is the Mock Server?

The mock server (`/mock-server`) is a temporary, local Express.js application that simulates the real backend API. It's used during frontend development to:

- **Develop independently**: Frontend developers don't need to wait for the backend to be fully implemented
- **Test API interactions**: Mock realistic API responses without a live backend
- **Prototype features**: Quickly test new features and user flows
- **Speed up development**: Avoid network delays during development
- **Work offline**: Continue development without backend server availability

### What is the API Contract?

The **API Contract** (`/api-contract.yaml`) is an OpenAPI specification that defines the exact structure and behavior of all API endpoints. It serves as a **bridge between backend and frontend**:

**Purpose:**
- **Single Source of Truth**: Both frontend and backend teams reference the same contract
- **Clear Expectations**: Defines exactly what data is sent and received
- **Documentation**: Auto-generates API documentation
- **Validation**: Ensures requests/responses match the specification
- **Independence**: Frontend can build against the contract while backend builds separately
- **Testing**: Provides structure for mocking and testing

**How it Works:**
1. **Backend Team** implements endpoints that match the API contract
2. **Frontend Team** uses the contract to:
   - Configure the mock server responses
   - Develop UI components
   - Handle error scenarios
3. **Mock Server** follows the contract to provide realistic test data
4. When the real backend is ready, the frontend switches to the actual API (same contract = seamless integration)

---

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

## 7. Integration with Frontend Development

The **MCD frontend project** (located in `/MCD`) communicates with this mock server during development:

1. **Frontend makes API calls** to `http://localhost:3000` (mock server)
2. **Mock server responds** with data matching the API contract
3. **Frontend renders** the data and tests user interactions
4. **When backend is ready**, update frontend API endpoints to point to production backend (no code changes needed - same contract!)

### Workflow During Development

```
Frontend Developer Working on MCD/
    ↓
Starts mock server: npm start (in mock-server/)
    ↓
Runs frontend: npm run dev (in MCD/)
    ↓
Frontend code makes HTTP requests to http://localhost:3000
    ↓
Mock server returns test data according to API Contract
    ↓
Frontend displays and tests the UI
```

This allows parallel development - backend team builds the real API while frontend team builds features using the mock server.
