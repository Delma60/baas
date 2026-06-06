import { redirect } from "next/navigation";
import getServerSession from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { auth } from "@/lib/auth";
import { stringify } from "querystring";

export default async function UserRedirectPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }
  return <>{children} </>;
}
