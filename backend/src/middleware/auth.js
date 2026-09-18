import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Membership from "../models/Membership.js";

// Verifies JWT and attaches req.user
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer")) {
    token = header.split(" ")[1];
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user || !req.user.isActive) {
      res.status(401);
      throw new Error("Not authorized, user not found or inactive");
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

// Restrict to platform super admin only
export const superAdminOnly = (req, res, next) => {
  if (req.user?.platformRole !== "super_admin") {
    res.status(403);
    throw new Error("Super admin access required");
  }
  next();
};

// Requires an approved membership in :orgId (route param or body.organization).
// Attaches req.membership for downstream handlers.
export const requireOrgMember = asyncHandler(async (req, res, next) => {
  const orgId = req.params.orgId || req.body.organization || req.query.organization;
  if (!orgId) {
    res.status(400);
    throw new Error("Organization id is required");
  }
  const membership = await Membership.findOne({
    user: req.user._id,
    organization: orgId,
    status: "approved",
  });
  if (!membership) {
    res.status(403);
    throw new Error("You are not an approved member of this organization");
  }
  req.membership = membership;
  next();
});

// Requires the caller to be org_admin (approved) for :orgId
export const requireOrgAdmin = asyncHandler(async (req, res, next) => {
  const orgId = req.params.orgId || req.body.organization || req.query.organization;
  if (!orgId) {
    res.status(400);
    throw new Error("Organization id is required");
  }
  const membership = await Membership.findOne({
    user: req.user._id,
    organization: orgId,
    status: "approved",
    role: "org_admin",
  });
  if (!membership && req.user.platformRole !== "super_admin") {
    res.status(403);
    throw new Error("Organization admin access required");
  }
  req.membership = membership;
  next();
});
