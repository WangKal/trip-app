import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogEntryForm } from "@/components/log-entry-form";
import {
  LogOut,
  Menu,
  Home,
  ClipboardCheck,
  Bell,
  PlusCircle,
  User,
  Settings,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {SidebarContent} from "../components/sidebar-content";

export default function LogEntry() {
  const { user, logoutMutation } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background z-50 shadow-sm">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          {/* Mobile Sidebar */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <ScrollArea className="h-full py-6">
                <SidebarContent/>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* App Title */}
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-bold text-indigo-600"
          >
            Trip App
          </motion.h1>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground hidden sm:inline"
            >
              @{user?.username}
            </motion.span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 flex">
        {/* Sidebar (Desktop) */}
        <aside className="w-64 fixed left-0 top-16 bottom-0 border-r hidden lg:block bg-white shadow-sm">
          <ScrollArea className="h-full py-6 px-4">
            <SidebarContent />
          </ScrollArea>
        </aside>

        {/* Main Section */}
        <main className="flex-1 p-6 lg:ml-64">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isMounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            {/* Welcome Section */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-3xl font-semibold text-gray-800">
                Welcome, {user?.username}!
              </h2>
              <p className="text-gray-600 mt-2">
                Stay compliant and track your trips effortlessly.
              </p>
            </div>

            {/* Quick Actions */}
            <div>
              
                <LogEntryForm/>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}


// Quick Action Component
const QuickAction = ({ icon, label, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
    onClick={onClick}
  >
    {icon}
    <span className="text-gray-800 font-medium">{label}</span>
  </motion.div>
);
