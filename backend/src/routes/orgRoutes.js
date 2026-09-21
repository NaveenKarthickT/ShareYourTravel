import express from "express";
import {
  createOrganization, listOrganizations, getOrganization, requestToJoin,
  myMemberships, listMembers, reviewMembership,
} from "../controllers/orgController.js";
import { protect, requireOrgAdmin } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.post("/", createOrganization);
router.get("/", listOrganizations);
router.get("/mine", myMemberships);
router.get("/:orgId", getOrganization);
router.post("/:orgId/join", requestToJoin);
router.get("/:orgId/members", requireOrgAdmin, listMembers);
router.patch("/:orgId/members/:membershipId", requireOrgAdmin, reviewMembership);

export default router;
