// mock-server/server.js

const express = require('express');
const { db } = require('./db');
const usersRouter = require('./routes/users');
const sessionsRouter = require('./routes/sessions');
const geoRouter = require('./routes/geo');

const app = express();
const BASE_PORT = Number(process.env.PORT || 4010);
const MAX_PORT_TRIES = 10;

app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/users', usersRouter);
app.use('/sessions', sessionsRouter);
app.use('/geo', geoRouter);


// ---------------------------------------------------------------------------
// Debug route — see current db state
// ---------------------------------------------------------------------------

app.get('/_db', (req, res) => res.json(db));

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

function start(port, triesLeft) {
  const server = app.listen(port, () => {
    console.log(`Mock server running on http://localhost:${port}`);
    console.log(`Debug DB: http://localhost:${port}/_db`);
    if (port !== BASE_PORT) {
      console.log(`Note: ${BASE_PORT} was in use, using ${port} instead.`);
    }
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && triesLeft > 0) {
      return start(port + 1, triesLeft - 1);
    }
    throw err;
  });
}

start(BASE_PORT, MAX_PORT_TRIES);