import express from 'express';
import path, { resolve } from 'path';
import axios from 'axios';
import history from 'connect-history-api-fallback';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const api = axios.create({
  baseURL: 'https://www.pathofexile.com/api',
});

const app = express();

const endpoints = {
  async 'guild-logs'(queries) {
    return await new Promise(resolve => {
      const end = parseInt(queries.days) * 24 * 60 * 60;
      const map = new Map();
      let from = false;
      const maxLoops = 30;
      let current = 1;
      const intervalId = setInterval(async () => {
        const params = {};
        if (from !== false) {
          params.from = from;
        }
        const response = await api.get(`/guild/${queries.guildId}/stash/history`, {
          headers: {
            Cookie: `POESESSID=${queries.sessionId};`,
          },
          params: params,
        });
        if (response.status === 429) {
          resolve(Array.from(map.values()));
        }
        const entries = response.data.entries;
        entries.forEach(entry => {
          map.set(entry.id, entry);
        });
        if (current >= maxLoops || entries.length < 1 || entries[entries.length - 1].time <= end) {
          const resp = {
            entries: Array.from(map.values()),
          };
          if (current >= maxLoops) {
            resp = Object.assign(resp, {
              lastTime: entries.length < 1 ? from : entries[entries.length - 1].time,
              waitUntil: Date.now() + 60 * 1000,
            });
          }
          resolve(resp);
          clearInterval(intervalId);
        } else {
          from = entries[entries.length - 1].time;
        }
        current++;
      }, 100);
    });
  },
};
app.get('/proxy/:endpoint', async (req, res) => {
  endpoints[req.params.endpoint](req.query).then(map => {
    return res.json(map);
  });
});
app.use(
  '/',
  history({
    verbose: true,
  }),
);
app.use('/', express.static(path.join(__dirname, 'dist')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  if (process.env.NODE_ENV !== 'PROD') {
    console.log(`listening on ${port}`);
  }
});
