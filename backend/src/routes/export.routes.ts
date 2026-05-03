import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as ExportController from "../controllers/export.controller";

const router = Router();

router.use(requireAuth);

router.get("/timelog", ExportController.exportTimelogs);
router.get("/leave", ExportController.exportLeaves);

export default router;
