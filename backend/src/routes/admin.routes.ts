import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as AdminController from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth);

// Users
router.get("/users", AdminController.adminGetUsers);
router.post("/users", AdminController.adminCreateUser);
router.patch("/users/:id", AdminController.adminUpdateUser);
router.post("/users/:id/force-logout", AdminController.adminForceLogout);
router.post("/users/:id/reset-password", AdminController.adminResetPassword);

// Audit
router.get("/audit", AdminController.getAuditLogs);

// Holidays
router.get("/holidays", AdminController.getHolidays);
router.post("/holidays", AdminController.createHoliday);
router.delete("/holidays/:id", AdminController.deleteHoliday);

// Reports
router.get("/reports", AdminController.getReports);

// Roles
router.get("/roles", AdminController.getRoles);

// Settings
router.get("/settings", AdminController.getSettings);
router.patch("/settings", AdminController.patchSettings);

// Leave Balance
router.patch("/leave-balance/:id", AdminController.adjustLeaveBalance);

export default router;
