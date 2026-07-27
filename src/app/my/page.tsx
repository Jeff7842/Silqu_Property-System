import { auth, signOut } from "@/server/auth/tenant";
import { requireUser } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

// ponytail: placeholder landing — the real tenant home is Phase 9. This just
// proves the auth round-trip (login -> session -> protected route) works.
export default async function TenantHome() {
  const session = await auth();
  const user = requireUser(session);

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/my/login" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page">
      <p className="text-lg text-ink">
        Signed in as <span className="font-semibold">{user.fullName}</span>
      </p>
      <SignOutButton action={doSignOut} />
    </div>
  );
}
