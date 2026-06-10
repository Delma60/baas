import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function ProjectRootPage({ params }: Props) {
  // Await the params in Next.js 15
  const { userId, projectId } = await params;
  
  // Perform the server-side redirect
  redirect(`/u/${userId}/projects/${projectId}/overview`);
}