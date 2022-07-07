// PACKAGES
import { Request, Response, NextFunction } from "express";

type ControllerType = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**Utility meant for wrapping controllers.
Handles promise rejections by passing them to globalErrorHandler middleware*/
const catchPromiseRej = (controller: ControllerType) => (req: Request, res: Response, next: NextFunction) =>
  controller(req, res, next).catch(next);

export default catchPromiseRej;
