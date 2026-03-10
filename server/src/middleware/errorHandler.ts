import { Request, Response, NextFunction } from 'express';
import * as Sentry from "@sentry/node";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  // Send error to Sentry
  Sentry.captureException(err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: true,
    message: message,
    code: statusCode,
  });
};
