import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as NotificationsController from "../controllers/notifications.controller";

const router = Router();

router.use(requireAuth);

router.get("/", NotificationsController.getNotifications);
router.post("/mark-read", NotificationsController.markAllRead);

export default router;
