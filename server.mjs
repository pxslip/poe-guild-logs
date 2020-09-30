import express from 'express';
import path, { resolve } from 'path';
import axios from 'axios';
import history from 'connect-history-api-fallback';

/**
 * Sleep the event loop for n milliseconds
 * @param n How long to sleep in milliseconds
 */
const sleep = function(n) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
};

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const api = axios.create({
  baseURL: 'https://www.pathofexile.com/api',
});

const app = express();

const endpoints = {
  async 'guild-logs'(queries) {
    if (queries.sessionId && queries.guildId) {
      const end = Date.now() / 1000 - parseInt(queries.days || 5) * 24 * 60 * 60;
      const map = new Map();
      let from = queries.startTime ? queries.startTime : false;
      const maxLoops = 29;
      let entries = [];
      for (let current = 0; current <= maxLoops; current++) {
        try {
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
          entries = response.data.entries;
          if (entries.length > 0 && entries[0].time < end) {
            return {
              entries: [],
            };
          }
          entries.forEach(entry => {
            if (!map.has(entry.id)) {
              map.set(entry.id, entry);
            }
          });
          if (current >= maxLoops || entries.length < 1 || entries[entries.length - 1].time > end) {
            let resp = {
              entries: Array.from(map.values()),
            };
            if (current >= maxLoops) {
              resp = Object.assign(resp, {
                lastTime: entries.length < 1 ? from : entries[entries.length - 1].time,
                waitUntil: Date.now() + 60 * 1000,
              });
            }
            return resp;
            break;
          } else {
            from = entries[entries.length - 1].time;
          }
        } catch (error) {
          if (error.response.status === 429) {
            const resp = {
              entries: Array.from(map.values()),
              lastTime: entries.length < 1 ? from : entries[entries.length - 1].time,
              waitUntil: Date.now() + parseInt(error.response.headers['retry-after'], 10) * 1000,
            };
            return resp;
          }
          throw error;
        }
      }
    }
    throw new Error('Missing required parameters');
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
