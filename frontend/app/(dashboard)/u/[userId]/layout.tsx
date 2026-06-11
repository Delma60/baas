// frontend/app/(dashboard)/u/[userId]/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { userId } = await params;

  // Prevent users accessing another user's dashboard
  if (session.user.id !== userId) {
    redirect(`/u/${session.user.id}`);
  }

  return <>{children}</>;
}