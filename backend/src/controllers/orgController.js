import asyncHandler from "express-async-handler";
import Organization from "../models/Organization.js";
import Membership from "../models/Membership.js";

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// @route POST /api/orgs  (create a new pooling server/community)
export const createOrganization = asyncHandler(async (req, res) => {
  const { name, type, size, description, location } = req.body;
  if (!name) {
    res.status(400);
    throw new Error("Organization name is required");
  }
  let slug = slugify(name);
  const existingSlug = await Organization.findOne({ slug });
  if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;

  const org = await Organization.create({
    name,
    slug,
    type,
    size,
    description,
    location,
    createdBy: req.user._id,
  });

  // Creator automatically becomes the approved org_admin of their new server
  await Membership.create({
    user: req.user._id,
    organization: org._id,
    role: "org_admin",
    status: "approved",
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  });

  res.status(201).json({ success: true, data: org });
});

// @route GET /api/orgs?search=abc  (browse/search existing communities)
export const listOrganizations = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { isActive: true };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }
  const orgs = await Organization.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: orgs });
});

// @route GET /api/orgs/:orgId
export const getOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.orgId);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }
  res.json({ success: true, data: org });
});

// @route POST /api/orgs/:orgId/join  (request to join an existing community)
export const requestToJoin = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.orgId);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }
  const existing = await Membership.findOne({ user: req.user._id, organization: org._id });
  if (existing) {
    res.status(400);
    throw new Error(`You already have a ${existing.status} request for this organization`);
  }
  const membership = await Membership.create({
    user: req.user._id,
    organization: org._id,
    role: "member",
    status: "pending",
  });
  res.status(201).json({ success: true, data: membership });
});

// @route GET /api/orgs/mine  (all orgs/memberships for the logged-in user)
export const myMemberships = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ user: req.user._id }).populate("organization");
  res.json({ success: true, data: memberships });
});

// @route GET /api/orgs/:orgId/members?status=pending  (admin: list membership requests)
export const listMembers = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { organization: req.params.orgId };
  if (status) filter.status = status;
  const members = await Membership.find(filter).populate("user", "name email phone");
  res.json({ success: true, data: members });
});

// @route PATCH /api/orgs/:orgId/members/:membershipId  (admin: approve/reject)
export const reviewMembership = asyncHandler(async (req, res) => {
  const { decision } = req.body; // "approved" | "rejected"
  if (!["approved", "rejected"].includes(decision)) {
    res.status(400);
    throw new Error("decision must be 'approved' or 'rejected'");
  }
  const membership = await Membership.findOne({
    _id: req.params.membershipId,
    organization: req.params.orgId,
  });
  if (!membership) {
    res.status(404);
    throw new Error("Membership request not found");
  }
  membership.status = decision;
  membership.reviewedBy = req.user._id;
  membership.reviewedAt = new Date();
  await membership.save();
  res.json({ success: true, data: membership });
});
