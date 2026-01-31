"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";

export type UserRole = "admin" | "manager" | "worker";

interface Profile {
  id: string;
  clerkId: string;
  email: string;
  full_name: string | null;
  imageUrl: string | null;
  job_type_id?: string | null;
}

interface DbUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

interface AuthContextType {
  user: ReturnType<typeof useUser>["user"];
  profile: Profile | null;
  dbUser: DbUser | null;
  primaryRole: UserRole;
  roles: UserRole[];
  loading: boolean;
  syncing: boolean;
  signOut: () => Promise<void>;
  syncUser: () => Promise<DbUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [roles, setRoles] = useState<UserRole[]>(["worker"]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  // Sync user with database
  const syncUser = useCallback(async (): Promise<DbUser | null> => {
    if (!user) return null;
    
    setSyncing(true);
    try {
      const response = await fetch("/api/user/sync", {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Failed to sync user");
        return null;
      }

      const data = await response.json();
      setDbUser(data.user);
      
      if (data.created) {
        console.log("New user created in database");
      }
      
      return data.user;
    } catch (error) {
      console.error("Error syncing user:", error);
      return null;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Create profile from Clerk user data
        setProfile({
          id: user.id,
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          full_name: user.fullName,
          imageUrl: user.imageUrl,
        });
        
        // Get roles from Clerk metadata or default to worker
        const userRoles = (user.publicMetadata?.roles as UserRole[]) || ["worker"];
        setRoles(userRoles);

        // Auto-sync user with database on first load
        if (!hasSynced) {
          setHasSynced(true);
          syncUser();
        }
      } else {
        setProfile(null);
        setDbUser(null);
        setRoles(["worker"]);
        setHasSynced(false);
      }
      setLoading(false);
    }
  }, [user, isLoaded, hasSynced, syncUser]);

  const signOut = async () => {
    await clerkSignOut();
    setProfile(null);
    setDbUser(null);
    setRoles(["worker"]);
    setHasSynced(false);
  };

  const primaryRole = roles[0] || "worker";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        dbUser,
        primaryRole,
        roles,
        loading,
        syncing,
        signOut,
        syncUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
