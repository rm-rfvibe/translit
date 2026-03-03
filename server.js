'use strict';

const express = require('express');
const path = require('path');
const { Level } = require('level');
const { transliterate } = require('./translit');

const MAX_INPUT_LENGTH = 10_000;

const app = express();
const db = new Level('./data', { valueEncoding: 'json' });

let counter;
let saving = Promise.resolve();

async function initCounter() {
  try {
    counter = await db.get('_counter');
  } catch {
    counter = 0;
  }
}

function saveEntry(original, result) {
  saving = saving.then(async () => {
    counter++;
    const key = `entry:${String(counter).padStart(12, '0')}`;
    await db.batch()
      .put(key, { original, result, timestamp: Date.now() })
      .put('_counter', counter)
      .write();
  });
  return saving;
}

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api', async (req, res) => {
  try {
    const { data } = req.body;
    if (typeof data !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Field "data" must be a string' });
    }
    if (data.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({ status: 'error', message: `Input exceeds ${MAX_INPUT_LENGTH} characters` });
    }
    const result = transliterate(data);
    await saveEntry(data, result);
    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/history', async (req, res) => {
  try {
    const n = Math.min(Math.max(1, parseInt(req.query.n, 10) || 10), 100);
    const entries = [];

    for await (const [, value] of db.iterator({ gt: 'entry:', lt: 'entry:~', reverse: true, limit: n })) {
      entries.push(value.result);
    }

    res.json({ data: entries });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || 3000;

initCounter().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

  async function shutdown() {
    console.log('\nShutting down...');
    server.close();
    await db.close();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
