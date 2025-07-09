const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const API_KEY = 'RfWBg7gAS8tmRtddX_rbj9iSQLPGr9DUE1MeJV22pu87nz4pi7HUPCitoe0l42ET';

app.post('/check-domain', async (req, res) => {
  const { host } = req.body;
  try {
    const response = await fetch('https://api.apivoid.com/v2/domain-reputation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({ host })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ Server-side APIVoid error:', err);
    res.status(500).json({ error: 'Failed to fetch from APIVoid' });
  }
});

app.listen(3000, () => console.log('Proxy server running at http://localhost:3000'));
