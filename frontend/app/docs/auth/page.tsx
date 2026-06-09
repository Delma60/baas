// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/docs/auth/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
import { getAuthStats } from "@/lib/api/auth-client";
import {
  DocPage,
  DocSection,
  DocSubSection,
  DocP,
  DocTabs,
  DocAlert,
  DocTable,
} from "@/components/docs/DocPage";

export const metadata: Metadata = { title: "Authentication · Docs · YourBaaS" };

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function AuthDocsPage({ params }: Props) {
  const { projectId } = await params;

  let userCount = 0;
  try {
    const project = await getProjectById(projectId);
    const stats = await getAuthStats(projectId, project.db_schema).catch(() => null);
    userCount = stats?.total_users ?? 0;
  } catch {}

  return (
    <DocPage
      title="Authentication"
      description="Per-project user management with email/password auth, magic links, and OAuth. Issue JWTs, manage sessions, and protect any resource with a single API call."
      badge="JWT sessions"
      badgeColor="bg-red-500/10 text-red-600 dark:text-red-400"
      toc={[
        { id: "setup", label: "Setup" },
        { id: "signup", label: "Sign Up" },
        { id: "signin", label: "Sign In" },
        { id: "session", label: "Session Management" },
        { id: "signout", label: "Sign Out" },
        { id: "me", label: "Get current user" },
        { id: "listen", label: "Session listener" },
        { id: "rest-api", label: "REST API" },
      ]}
    >
      {userCount > 0 && (
        <DocAlert type="success">
          Your project currently has{" "}
          <strong>{userCount.toLocaleString()}</strong> registered user
          {userCount !== 1 ? "s" : ""}. Manage them in the{" "}
          <a href={`/u/${projectId}/projects/${projectId}/auth`} className="underline font-medium">
            Auth dashboard
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
  apiKey: "sk_anon_...", // use anon key for client auth
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

      <DocSection id="signup" title="Sign Up">
        <DocP>
          Create a new user account. Returns a session with access and refresh tokens.
          The user is automatically signed in.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const session = await baas.auth.signUp({
  email: "user@example.com",
  password: "secure-password-123",
  name: "Alice",         // optional
})

console.log(session.user.id)         // "usr_abc..."
console.log(session.accessToken)     // JWT to use in subsequent requests`,
            },
            {
              label: "Python",
              lang: "python",
              code: `session = await baas.auth.sign_up(
    email="user@example.com",
    password="secure-password-123",
    name="Alice",
)

print(session.user.id)       # "usr_abc..."
print(session.access_token)  # JWT`,
            },
            {
              label: "curl",
              lang: "bash",
              code: `curl -X POST "${process.env.NEXT_PUBLIC_APP_URL ?? "https://api.yourbaas.com"}/v1/auth/${projectId}/signup" \\
  -H "Authorization: Bearer sk_anon_..." \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"secure-password-123"}'`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="signin" title="Sign In">
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const session = await baas.auth.signIn({
  email: "user@example.com",
  password: "secure-password-123",
})`,
            },
            {
              label: "Python",
              lang: "python",
              code: `session = await baas.auth.sign_in(
    email="user@example.com",
    password="secure-password-123",
)`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="session" title="Session Management">
        <DocSubSection id="get-session" title="Get the current session">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `// Synchronous — no network call
const session = baas.auth.getSession()
if (session) {
  console.log("Logged in as", session.user.email)
} else {
  console.log("Not authenticated")
}`,
              },
              {
                label: "Python",
                lang: "python",
                code: `session = baas.auth.get_session()
if session:
    print("Logged in as", session.user.email)`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="refresh" title="Refresh tokens">
          <DocP>
            Access tokens expire. Use the refresh token to get a new one without requiring
            the user to log in again.
          </DocP>
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `// Automatically uses session's refresh token
const session = await baas.auth.refresh()

// Or pass an explicit refresh token
const session = await baas.auth.refresh(storedRefreshToken)`,
              },
              {
                label: "Python",
                lang: "python",
                code: `session = await baas.auth.refresh()`,
              },
            ]}
          />
        </DocSubSection>
      </DocSection>

      <DocSection id="signout" title="Sign Out">
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `await baas.auth.signOut()
// Session cleared locally and on the server`,
            },
            {
              label: "Python",
              lang: "python",
              code: `await baas.auth.sign_out()`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="me" title="Get current user">
        <DocP>
          Fetch the authenticated user&apos;s profile from the server. Requires an active session.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const user = await baas.auth.me()
// {
//   id: "usr_abc...",
//   email: "user@example.com",
//   name: "Alice",
//   isEmailVerified: true,
//   createdAt: "2024-01-01T00:00:00Z",
// }`,
            },
            {
              label: "Python",
              lang: "python",
              code: `user = await baas.auth.me()
print(user.id, user.email)`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="listen" title="Session change listener">
        <DocP>
          Subscribe to session changes (sign-in, sign-out, token refresh). Useful for
          reactively updating your UI.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const unsub = baas.auth.onSessionChange((session) => {
  if (session) {
    console.log("Signed in as", session.user.email)
    // update your app state
  } else {
    console.log("Signed out")
    // redirect to login
  }
})

// Stop listening
unsub()`,
            },
            {
              label: "Python",
              lang: "python",
              code: `def on_change(session):
    if session:
        print("Signed in as", session.user.email)
    else:
        print("Signed out")

unsub = baas.auth.on_session_change(on_change)
unsub()  # stop listening`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="rest-api" title="REST API">
        <DocTable
          headers={["Method", "Path", "Description"]}
          rows={[
            ["POST", `/v1/auth/${projectId}/signup`, "Create a new user account"],
            ["POST", `/v1/auth/${projectId}/signin`, "Sign in, returns JWT tokens"],
            ["POST", `/v1/auth/${projectId}/signout`, "Sign out (invalidate session)"],
            ["POST", `/v1/auth/${projectId}/refresh`, "Refresh access token"],
            ["GET", `/v1/auth/${projectId}/me`, "Get current user profile"],
          ]}
        />
        <DocAlert type="warning">
          Always use the <strong>anon</strong> API key for client-side auth calls. Never
          expose the service key in browser code.
        </DocAlert>
      </DocSection>
    </DocPage>
  );
}