// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/docs/functions/page.tsx
import type { Metadata } from "next";
import { getFunctionStats } from "@/lib/api/functions-client";
import {
  DocPage,
  DocSection,
  DocSubSection,
  DocP,
  DocTabs,
  DocAlert,
  DocTable,
} from "@/components/docs/DocPage";

export const metadata: Metadata = { title: "Edge Functions · Docs · YourBaaS" };

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function FunctionsDocsPage({ params }: Props) {
  const { projectId } = await params;

  let stats = { total: 0, active: 0, total_invocations: 0 };
  try {
    stats = await getFunctionStats(projectId).catch(() => stats);
  } catch {}

  return (
    <DocPage
      title="Edge Functions"
      description="Invoke serverless functions with a JSON payload. Trigger on HTTP, run business logic securely on the server, and chain function calls from the SDK or REST API."
      badge="Serverless"
      badgeColor="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      toc={[
        { id: "setup", label: "Setup" },
        { id: "invoke", label: "Invoke a function" },
        { id: "payload", label: "With a payload", level: 3 },
        { id: "headers", label: "Custom headers", level: 3 },
        { id: "response", label: "Response shape" },
        { id: "manage", label: "Manage functions" },
        { id: "rest-api", label: "REST API" },
      ]}
    >
      {stats.total > 0 && (
        <DocAlert type="info">
          Your project has <strong>{stats.total}</strong> function
          {stats.total !== 1 ? "s" : ""} with{" "}
          <strong>{stats.total_invocations.toLocaleString()}</strong> total invocation
          {stats.total_invocations !== 1 ? "s" : ""}. Manage them in the{" "}
          <a href={`/u/${projectId}/projects/${projectId}/functions`} className="underline font-medium">
            Functions dashboard
          </a>
          .
        </DocAlert>
      )}

      <DocSection id="setup" title="Setup">
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `import { BaasClient } from "@yourbaas/sdk"

const baas = new BaasClient({
  projectId: "${projectId}",
  apiKey: "sk_anon_...",
})`,
            },
            {
              label: "Python",
              lang: "python",
              code: `from baas import BaasClient

baas = BaasClient(project_id="${projectId}", api_key="sk_anon_...")`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="invoke" title="Invoke a function">
        <DocSubSection id="payload" title="With a payload">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `// Simple call with no payload
const result = await baas.functions.invoke("ping").call()

// Call with payload
const result = await baas.functions.invoke("send-welcome-email")
  .with({
    userId: "user_abc123",
    template: "welcome",
    locale: "en",
  })
  .call()

console.log(result.status) // HTTP status from the function
console.log(result.data)   // JSON response body`,
              },
              {
                label: "Python",
                lang: "python",
                code: `# Simple call
result = await baas.functions("ping").call()

# With payload
result = await baas.functions("send-welcome-email") \\
    .with_({"userId": "user_abc123", "template": "welcome"}) \\
    .call()

print(result.status_code)
print(result.data)`,
              },
              {
                label: "curl",
                lang: "bash",
                code: `curl -X POST "${process.env.NEXT_PUBLIC_APP_URL ?? "https://api.yourbaas.com"}/v1/functions/${projectId}/invoke/send-welcome-email" \\
  -H "Authorization: Bearer sk_anon_..." \\
  -H "Content-Type: application/json" \\
  -d '{"payload": {"userId": "user_abc123", "template": "welcome"}}'`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="headers" title="Custom headers">
          <DocP>
            Forward custom headers to the function endpoint. Useful for passing
            authentication tokens or tracing IDs.
          </DocP>
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `const result = await baas.functions.invoke("webhook-relay")
  .with({ event: "user.created", payload: userData })
  .headers({
    "X-Idempotency-Key": crypto.randomUUID(),
    "X-Trace-Id": "req_abc123",
  })
  .call()`,
              },
              {
                label: "Python",
                lang: "python",
                code: `result = await baas.functions("webhook-relay") \\
    .with_({"event": "user.created"}) \\
    .headers({"X-Idempotency-Key": "key-123"}) \\
    .call()`,
              },
            ]}
          />
        </DocSubSection>
      </DocSection>

      <DocSection id="response" title="Response shape">
        <DocTable
          headers={["Field", "Type", "Description"]}
          rows={[
            ["status", "number", "HTTP status code returned by the function (200, 400, etc.)"],
            ["data", "any", "Parsed JSON response body from the function"],
            ["headers", "Record<string, string>", "Response headers from the function"],
          ]}
        />
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const result = await baas.functions.invoke("process-order")
  .with({ orderId: "ord_123" })
  .call()

if (result.status === 200) {
  console.log("Order processed:", result.data)
} else {
  console.error("Function error:", result.data)
}`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="manage" title="Manage functions">
        <DocP>
          Create, edit, test, and monitor functions from the{" "}
          <a href={`/u/${projectId}/projects/${projectId}/functions`} className="text-brand underline">
            Functions dashboard
          </a>
          . Each function has:
        </DocP>
        <DocTable
          headers={["Property", "Description"]}
          rows={[
            ["name", "URL-safe slug used in invoke calls"],
            ["endpoint_url", "HTTP URL that receives the POST request"],
            ["method", "HTTP method (POST by default)"],
            ["timeout_ms", "Request timeout (default 5000ms)"],
            ["is_active", "Whether the function accepts invocations"],
          ]}
        />
        <DocAlert type="info">
          Functions are invoked on your behalf by the YourBaaS server — the API key
          is never exposed to the function&apos;s endpoint. Use the service key for
          privileged operations inside function code.
        </DocAlert>
      </DocSection>

      <DocSection id="rest-api" title="REST API">
        <DocTable
          headers={["Method", "Path", "Description"]}
          rows={[
            ["POST", `/v1/functions/${projectId}/invoke/{name}`, "Invoke a function by name"],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}