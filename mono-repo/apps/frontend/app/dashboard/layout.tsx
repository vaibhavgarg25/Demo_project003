"use client";

import React, { useState } from "react";
import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Header } from "@/components/Header";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/Sidebar";
import { IconBrandTabler } from "@tabler/icons-react";
import {
  BarChart3Icon,
  Calendar,
  Train,
  History,
  Settings,
  Upload,
} from "lucide-react";

// Logo component
const Logo = ({ open }: { open: boolean }) => (
  <a
    href="#"
    className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
  >
    <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    {open && (
      <span className="font-medium whitespace-pre text-black dark:text-white">
        Kochi Metro Rail
      </span>
    )}
  </a>
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  const links = [
    { label: "Dashboard", href: "/dashboard", icon: <IconBrandTabler className="h-5 w-5" /> },
    { label: "Profile", href: "/dashboard/trainsets", icon: <Train className="h-5 w-5" /> },
    { label: "Planner", href: "/dashboard/planner", icon: <Calendar className="h-5 w-5" /> },
    { label: "Simulation", href: "/dashboard/simulation", icon: <BarChart3Icon className="h-5 w-5" /> },
    { label: "History", href: "/dashboard/history", icon: <History className="h-5 w-5" /> },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings className="h-5 w-5" /> },
    { label: "Upload", href: "/dashboard/csv-template", icon: <Upload className="h-5 w-5" /> },
  ];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-bg">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <Logo open={open} />
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            <div>
              <SidebarLink
                link={{
                  label: "User",
                  href: "#",
                  icon: (
                    <img
                      src="https://assets.aceternity.com/manu.png"
                      className="h-7 w-7 shrink-0 rounded-full"
                      width={50}
                      height={50}
                      alt="Avatar"
                    />
                  ),
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
