import express from "express";
import {
  createVehicle, searchVehicles, latestVehicles, getVehicle, updateVehicle, myVehicles,
} from "../controllers/vehicleController.js";
import { protect, requireOrgMember } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.get("/latest", latestVehicles);
router.get("/mine", myVehicles);
router.get("/", searchVehicles);
router.post("/", requireOrgMember, createVehicle);
router.get("/:id", getVehicle);
router.patch("/:id", updateVehicle);

export default router;
