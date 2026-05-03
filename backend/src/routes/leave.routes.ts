import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as LeaveController from "../controllers/leave.controller";

const router = Router();

router.use(requireAuth);

router.get("/", LeaveController.getLeaves);
router.post("/", LeaveController.createLeave);
router.get("/calendar", LeaveController.getLeaveCalendar);
router.get("/:id", LeaveController.getLeaveById);
router.patch("/:id", LeaveController.patchLeave);
router.post("/:id/approve", LeaveController.approveLeave);
router.post("/:id/reject", LeaveController.rejectLeave);

export default router;
