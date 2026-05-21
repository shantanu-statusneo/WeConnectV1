"use client";

import { useSyncExternalStore } from "react";

export type LoginRole = "buyer" | "seller" | "admin" | "buyer_admin";

export type AuthSession = {
  role: LoginRole;
  name: string;
  email: string;
  supplierId?: string;
  companyName?: string;
  createdAt: string;
};

export const AUTH_SESSION_KEY = "weconnect.auth";
export const SELLER_SESSION_ID_KEY = "weconnect.seller.sessionId";

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed.role === "buyer" || parsed.role === "seller" || parsed.role === "admin" || parsed.role === "buyer_admin") {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  }
  return null;
}

export function writeAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("weconnect-auth-change"));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new Event("weconnect-auth-change"));
}

export function readSellerSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SELLER_SESSION_ID_KEY);
}

export function writeSellerSessionId(sessionId: string) {
  window.localStorage.setItem(SELLER_SESSION_ID_KEY, sessionId);
}

function subscribeAuthSession(onChange: () => void) {
  window.addEventListener("weconnect-auth-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("weconnect-auth-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getAuthSnapshot() {
  return window.localStorage.getItem(AUTH_SESSION_KEY) ?? "";
}

export function useAuthSession(): AuthSession | null {
  const raw = useSyncExternalStore(subscribeAuthSession, getAuthSnapshot, () => "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed.role === "buyer" || parsed.role === "seller" || parsed.role === "admin" || parsed.role === "buyer_admin") return parsed;
  } catch {
    return null;
  }
  return null;
}
