import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as UsersController from "../controllers/users.controller";

const router = Router();

router.use(requireAuth);

router.get("/", UsersController.getUsers);
router.get("/me", UsersController.getMe);
router.patch("/me", UsersController.patchMe);
router.get("/:id", UsersController.getUserById);

export default router;
