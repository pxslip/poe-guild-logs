import express from 'express';
import path from 'path';
import axios from 'axios';
import history from 'connect-history-api-fallback';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const api = axios.create({
  baseURL: 'https://www.pathofexile.com/api',
});

const app = express();

const endpoints = {
  async 'guild-logs'(queries) {
    const params = {};
    if (queries.from !== '0') {
      params.from = queries.from;
    }
    const response = await api.get(`/guild/${queries.guildId}/stash/history`, {
      headers: {
        Cookie: `POESESSID=${queries.sessionId};`,
      },
      params: params,
    });
    return response.data.entries;
  },
};
app.get('/proxy/:endpoint', async (req, res) => {
  const data = await endpoints[req.params.endpoint](req.query);
  return res.json(data);
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
