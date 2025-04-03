// Sidebar Content Component
import { useLocation } from "wouter";
import {
 
  Menu,
  Home,
  ClipboardCheck,
  Bell,
  PlusCircle,
  User,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
// Sidebar Link Component
const SidebarLink = ({ icon, label, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.1 }}
    className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-100 cursor-pointer"
    onClick={onClick}
  >
    {icon}
    <span className="text-gray-700">{label}</span>
  </motion.div>
);

export function SidebarContent () {
const [ location, navigate] = useLocation();
  // Role-based navigation data
  const navigation = {
    driver: [
      { icon: <Home />, label: "Home", path: "/" },
      { icon: <User />, label: "Profile", path: "/profile" },
    ],
    admin: [
      { icon: <Home />, label: "Home", path: "/" },
      { icon: <ClipboardCheck />, label: "Dashboard", path: "/dashboard" },
      { icon: <ClipboardCheck />, label: "Compliance Audit", path: "/compliance" },
      { icon: <Bell />, label: "Manage Alerts", path: "/alerts" },
      { icon: <User />, label: "Manage Users", path: "/profile" },
      { icon: <Settings />, label: "System Settings", path: "/settings" },
    ],
  };

const userNav = navigation.driver; //user?.role === "admin" ? navigation.admin : navigation.driver;

  return(
  <nav className="space-y-4">
    {userNav.map((link) => (
      <SidebarLink key={link.label} {...link} onClick={() => navigate(link.path)} />
    ))}
  </nav>
  )
}
;