"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/Authcontext";
import LoginPage from "./Loginpage";
import LoadingScreen from "./LoadingScreen";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <LoginPage />;
  return <>{children}</>;
}