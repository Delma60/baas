// frontend/components/database/CreateDatabaseButton.tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { provisionProjectDatabase } from "@/lib/actions/provision-actions";
import { Button } from "@/components/ui/button";
import { Database, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      size="lg"
      className="gap-2 bg-[--brand] hover:bg-[--brand-hover] text-white border-0 px-8"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Provisioning…
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          Create SQL Database
        </>
      )}
    </Button>
  );
}

interface Props {
  projectId: string;
  userId: string;
}

export function CreateDatabaseButton({ projectId, userId }: Props) {
  const router = useRouter();
  const [state, action] = useActionState(provisionProjectDatabase, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="userId" value={userId} />
      {state?.error && (
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <SubmitButton />
    </form>
  );
}