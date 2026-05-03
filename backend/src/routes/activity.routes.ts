import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as ActivityController from "../controllers/activity.controller";

const router = Router();

router.use(requireAuth);

router.get("/", ActivityController.getActivities);
router.post("/", ActivityController.createActivity);
router.patch("/:id", ActivityController.patchActivity);

export default router;
