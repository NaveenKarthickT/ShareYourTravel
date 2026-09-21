import express from "express";
import {
  orgStats, orgVehicles, orgVehicleInterest,
  platformStats, platformOrganizations, setOrganizationActive,
  platformUsers, setUserPlatformRole,
  platformOrgDetails, platformDeleteOrg,
  platformPromoteToOrgAdmin, platformRemoveMember,
} from "../controllers/adminController.js";
import { protect, requireOrgAdmin, superAdminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

// Org admin
router.get("/orgs/:orgId/stats", requireOrgAdmin, orgStats);
router.get("/orgs/:orgId/vehicles", requireOrgAdmin, orgVehicles);
router.get("/orgs/:orgId/vehicles/:vehicleId/interest", requireOrgAdmin, orgVehicleInterest);

// Platform super admin — overview
router.get("/platform/stats", superAdminOnly, platformStats);
router.get("/platform/orgs", superAdminOnly, platformOrganizations);
router.patch("/platform/orgs/:orgId", superAdminOnly, setOrganizationActive);
router.get("/platform/users", superAdminOnly, platformUsers);
router.patch("/platform/users/:userId", superAdminOnly, setUserPlatformRole);

// Platform super admin — org management
router.get("/platform/orgs/:orgId/details", superAdminOnly, platformOrgDetails);
router.delete("/platform/orgs/:orgId", superAdminOnly, platformDeleteOrg);
router.post("/platform/orgs/:orgId/make-admin/:userId", superAdminOnly, platformPromoteToOrgAdmin);
router.delete("/platform/orgs/:orgId/members/:userId", superAdminOnly, platformRemoveMember);

export default router;
