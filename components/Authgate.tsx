"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";
import LoginPage from "./LoginPage";
import LoadingScreen from "./LoadingScreen";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <LoginPage />;
  return <>{children}</>;
}