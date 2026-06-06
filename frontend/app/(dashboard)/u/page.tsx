// frontend/app/(dashboard)/u/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  redirect(`/u/${session.user.id}`);
}