import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import routes from './app/routes/routes';
import HttpException from './app/models/http-exception.model';
import * as redis from 'redis';

const app = express();
const client = redis.createClient({url: process.env.REDIS_URL});

/**
 * App Configuration
 */

const forbiddenOrigins = [
  'https://datadoghq.dev',
  'null',
  '*',
  'https://vuex-project-fullstackloyiha.netlify.app',
  'https://mits-gossau.github.io',
  'https://blog-platform-woad.vercel.app',
  'https://filterbar-57906r89m-adilma53s-projects.vercel.app',
  'https://mediumwebcloneproject.vercel.app',
  'required',

];

app.use(async (req,res,next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (forbiddenOrigins.includes(origin) || (!origin && !referer)) {
    // console.log('Blocked', req.headers);
    // Send an error response if Origin is undefined
    return res.status(400).json({ error: 'Origin header is required' });
  }

  const header = origin || referer;
  await client.incr(header);

  next();
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes);

// Serves images
app.use(express.static(__dirname + '/assets'));

app.get('/', (req: express.Request, res: express.Response) => {
  console.log('done')
  res.json({ status: 'API is running on /api' });
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
