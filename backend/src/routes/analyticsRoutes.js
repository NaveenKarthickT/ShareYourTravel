import express from "express";
import {
  tripsPerDay, topRoutes, bookingStatusBreakdown, userRoleBreakdown, orgSummary,
} from "../controllers/analyticsController.js";
import { protect, requireOrgAdmin } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/org/:orgId/summary", requireOrgAdmin, orgSummary);
router.get("/org/:orgId/trips-per-day", requireOrgAdmin, tripsPerDay);
router.get("/org/:orgId/top-routes", requireOrgAdmin, topRoutes);
router.get("/org/:orgId/booking-status", requireOrgAdmin, bookingStatusBreakdown);
router.get("/org/:orgId/user-roles", requireOrgAdmin, userRoleBreakdown);

export default router;
