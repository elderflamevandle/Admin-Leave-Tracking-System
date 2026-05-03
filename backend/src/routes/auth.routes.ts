import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as AuthController from "../controllers/auth.controller";

const router = Router();

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/refresh", AuthController.refresh);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

export default router;
