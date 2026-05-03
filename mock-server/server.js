// mock-server/server.js

const express = require('express');
const { db } = require('./db');
const usersRouter = require('./routes/users');
const sessionsRouter = require('./routes/sessions');

const app = express();
const PORT = 4010;

app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/users', usersRouter);
app.use('/sessions', sessionsRouter);


// ---------------------------------------------------------------------------
// Debug route — see current db state
// ---------------------------------------------------------------------------

app.get('/_db', (req, res) => res.json(db));

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log(`Debug DB: http://localhost:${PORT}/_db`);
});