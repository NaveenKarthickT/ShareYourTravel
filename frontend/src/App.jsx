import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import OrgSelect from "./pages/OrgSelect.jsx";
import CreateOrg from "./pages/CreateOrg.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import Profile from "./pages/Profile.jsx";
import PostVehicle from "./pages/PostVehicle.jsx";
import SearchVehicles from "./pages/SearchVehicles.jsx";
import VehicleDetails from "./pages/VehicleDetails.jsx";
import TripsList from "./pages/TripsList.jsx";
import OngoingTrips from "./pages/OngoingTrips.jsx";
import Feedback from "./pages/Feedback.jsx";
import Chat from "./pages/Chat.jsx";
import AdminDashboard, { MembershipRequests, AdminVehicles } from "./pages/AdminDashboard.jsx";
import AdminAddVehicle from "./pages/AdminAddVehicle.jsx";
import AdminAnalytics from "./pages/AdminAnalytics.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import Notifications from "./pages/Notifications.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />
      <CommandPalette />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/organizations" element={<ProtectedRoute><OrgSelect /></ProtectedRoute>} />
          <Route path="/organizations/create" element={<ProtectedRoute><CreateOrg /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/superadmin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute requireOrg><UserDashboard /></ProtectedRoute>} />
          <Route path="/vehicles/post" element={<ProtectedRoute requireOrg><PostVehicle /></ProtectedRoute>} />
          <Route path="/vehicles/search" element={<ProtectedRoute requireOrg><SearchVehicles /></ProtectedRoute>} />
          <Route path="/vehicles/:id" element={<ProtectedRoute requireOrg><VehicleDetails /></ProtectedRoute>} />

          <Route path="/trips/confirmed" element={<ProtectedRoute requireOrg><TripsList status="confirmed" title="Confirmed Trips" /></ProtectedRoute>} />
          <Route path="/trips/ongoing" element={<ProtectedRoute requireOrg><OngoingTrips /></ProtectedRoute>} />
          <Route path="/trips/requests" element={<ProtectedRoute requireOrg><TripsList status="requested" title="My Requests" /></ProtectedRoute>} />
          <Route path="/trips/completed" element={<ProtectedRoute requireOrg><TripsList status="completed" title="Completed Trips" /></ProtectedRoute>} />
          <Route path="/feedback/:bookingId" element={<ProtectedRoute requireOrg><Feedback /></ProtectedRoute>} />
          <Route path="/chat/:bookingId" element={<ProtectedRoute requireOrg><Chat /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute requireOrg><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute requireOrg><MembershipRequests /></ProtectedRoute>} />
          <Route path="/admin/vehicles" element={<ProtectedRoute requireOrg><AdminVehicles /></ProtectedRoute>} />
          <Route path="/admin/add-vehicle" element={<ProtectedRoute requireOrg><AdminAddVehicle /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute requireOrg><AdminAnalytics /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}