import { middleware, MiddlewareConfig, WebhookEvent } from '@line/bot-sdk';
import serverlessExpress from '@vendia/serverless-express';
// import bodyParser from 'body-parser';
// import cors from 'cors';
import express, { Request, Response } from 'express';
import * as sourceMapSupport from 'source-map-support';

import { textEventHandler } from './lib/line/textEventHandler';

sourceMapSupport.install();

const app = express();

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

app.use((_req, res) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

export const handler = serverlessExpress({ app });
