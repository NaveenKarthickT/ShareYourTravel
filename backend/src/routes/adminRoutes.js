import express from "express";
import {
  orgStats, orgVehicles, orgVehicleInterest, platformStats, platformOrganizations,
  setOrganizationActive, platformUsers, setUserPlatformRole,
} from "../controllers/adminController.js";
import { protect, requireOrgAdmin, superAdminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/orgs/:orgId/stats", requireOrgAdmin, orgStats);
router.get("/orgs/:orgId/vehicles", requireOrgAdmin, orgVehicles);
router.get("/orgs/:orgId/vehicles/:vehicleId/interest", requireOrgAdmin, orgVehicleInterest);

router.get("/platform/stats", superAdminOnly, platformStats);
router.get("/platform/orgs", superAdminOnly, platformOrganizations);
router.patch("/platform/orgs/:orgId", superAdminOnly, setOrganizationActive);
router.get("/platform/users", superAdminOnly, platformUsers);
router.patch("/platform/users/:userId", superAdminOnly, setUserPlatformRole);

export default router;
