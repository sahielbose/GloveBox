import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Use in server components / actions under /app — redirects to sign-in if needed. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/signin");
  return user as { id: string; email: string; name?: string | null };
}
