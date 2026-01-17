import express, { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: 'INTERNAL_ERROR'
    }
  });
};
