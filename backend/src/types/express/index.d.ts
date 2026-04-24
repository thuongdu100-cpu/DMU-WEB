import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    /** Thiết lập bởi authMiddleware.authenticate (JWT + DB). */
    authUser?: {
      id: number;
      role: string;
      username: string;
    };
  }
}
