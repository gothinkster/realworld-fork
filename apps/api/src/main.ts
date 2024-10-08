import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import routes from './app/routes/routes';
import HttpException from './app/models/http-exception.model';
import * as redis from 'redis';

const app = express();
const client = redis.createClient({ url: process.env.REDIS_URL });

client.connect();

/**
 * App Configuration
 */

app.use(async (req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  const header = origin || referer;
  if (header) {
    await client.incr(header.replace(/\/$/, ''));
  } else {
    await client.incr('undefined-header');
  }

  next();
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes);

// Serves images
app.use(express.static(__dirname + '/assets'));

app.get('/', (req: express.Request, res: express.Response) => {
  console.log('done');
  res.json({ status: 'API is running on /api' });
});

app.get('/redis', async (req, res) => {
  try {
    // Get all keys from Redis
    const keys = await client.keys('*');

    // Get the values for each key
    const values = await Promise.all(
      keys.map(async key => {
        const value = await client.get(key);
        return { key, value };
      }),
    );

    // Send the keys and values as a response
    res.json(values);
  } catch (err) {
    console.error('Error fetching data from Redis:', err);
    res.status(500).send('Error fetching data from Redis');
  }
});

/* eslint-disable */
app.use(
  (
    err: Error | HttpException,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    // @ts-ignore
    if (err && err.name === 'UnauthorizedError') {
      return res.status(401).json({
        status: 'error',
        message: 'missing authorization credentials',
      });
      // @ts-ignore
    } else if (err && err.errorCode) {
      // @ts-ignore
      res.status(err.errorCode).json(err.message);
    } else if (err) {
      res.status(500).json(err.message);
    }
  },
);

/**
 * Server activation
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.info(`server up on port ${PORT}`);
});
