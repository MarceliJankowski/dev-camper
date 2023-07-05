// PACKAGES
import { Request, Response, NextFunction } from "express";

type Controller = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**@desc utility meant for wrapping controllers. Catches promise rejections and passes them to `next` (which propagates them to `globalErrorHandler`)*/
export const handlePromiseRej =
  (controller: Controller) => (req: Request, res: Response, next: NextFunction) =>
    controller(req, res, next).catch(next);
