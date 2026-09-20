import { Navigate } from "react-router-dom";
import PostVehicle from "./PostVehicle.jsx";

// Thin wrapper so admins land on the same form but with a clear URL.
// PostVehicle already checks activeOrg and posts to the right org.
export default function AdminAddVehicle() {
  return <PostVehicle />;
}