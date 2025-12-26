import { Request, Response, NextFunction, RequestHandler } from "express";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  next();
};

export const optionalAuth: RequestHandler = (req, res, next) => {
  next();
};
