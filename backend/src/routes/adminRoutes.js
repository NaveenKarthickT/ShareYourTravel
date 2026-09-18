import express from "express";
import {
  orgStats, orgVehicles, orgVehicleInterest, platformStats, platformOrganizations,
} from "../controllers/adminController.js";
import { protect, requireOrgAdmin, superAdminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

// Organization admin
router.get("/orgs/:orgId/stats", requireOrgAdmin, orgStats);
router.get("/orgs/:orgId/vehicles", requireOrgAdmin, orgVehicles);
router.get("/orgs/:orgId/vehicles/:vehicleId/interest", requireOrgAdmin, orgVehicleInterest);

// Platform super admin
router.get("/platform/stats", superAdminOnly, platformStats);
router.get("/platform/orgs", superAdminOnly, platformOrganizations);

export default router;
