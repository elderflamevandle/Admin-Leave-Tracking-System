import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as TimelogController from "../controllers/timelog.controller";

const router = Router();

router.use(requireAuth);

router.get("/", TimelogController.getTimelogs);
router.post("/", TimelogController.createTimelog);
router.post("/import", TimelogController.importTimelogs);
router.patch("/:id", TimelogController.patchTimelog);

export default router;
