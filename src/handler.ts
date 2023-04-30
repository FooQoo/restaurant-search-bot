import { middleware, MiddlewareConfig, WebhookEvent } from '@line/bot-sdk';
import serverlessExpress from '@vendia/serverless-express';
// import bodyParser from 'body-parser';
// import cors from 'cors';
import express, { Request, Response } from 'express';
import * as sourceMapSupport from 'source-map-support';

import { searchRestaurant } from './lib/langchain/chat';
import { textEventHandler } from './lib/line/textEventHandler';

sourceMapSupport.install();

const app = express();
// const router = express.Router();

// router.use(bodyParser.json());
// router.use(cors());
// router.use(bodyParser.urlencoded({ extended: true }));

// middleware
const middlewareConfig: MiddlewareConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET || '',
};

const basePath = '/api';

// This route is used for the Webhook.
app.post(
  `${basePath}/webhook`,
  middleware(middlewareConfig),
  async (req: Request, res: Response): Promise<Response> => {
    const events: WebhookEvent[] = req.body.events;

    // Process all of the received events asynchronously.
    const results = await Promise.all(
      events.map(async (event: WebhookEvent) => {
        try {
          await textEventHandler(event);
        } catch (err: unknown) {
          if (err instanceof Error) {
            console.error(err);
          }

          // Return an error message.
          return res.status(500).json({
            status: 'error',
          });
        }
      })
    );

    // Return a successfull message.
    return res.status(200).json({
      status: 'success',
      results,
    });
  }
);

app.get(basePath, async (_req: Request, res: Response) => {
  console.info(
    await searchRestaurant('おすすめのレストランを教えてください。')
  );

  return res.status(200).json({
    message: 'Hello from root!',
  });
});

// app.use('/', router);

app.use((_req, res) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

export const handler = serverlessExpress({ app });
