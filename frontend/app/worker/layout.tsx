import { AuthProvider } from "@/lib/auth";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
