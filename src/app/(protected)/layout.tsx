import { redirect } from "next/navigation";
import { getOwnerSession } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOwnerSession();
  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
