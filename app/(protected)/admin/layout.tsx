import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEmailFromJwt, isAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  const userEmail = getEmailFromJwt(accessToken);

  if (!accessToken) {
    redirect("/login");
  }

  if (!isAdmin(userEmail || undefined)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 border-r border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>

        <nav className="mt-8 space-y-4">
          <Link
            href="/admin"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/draws"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Manage Draws
          </Link>
          <Link
            href="/admin/charities"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Manage Charities
          </Link>
          <Link
            href="/admin/users"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Users
          </Link>
          <Link
            href="/dashboard"
            className="mt-8 block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Back to Dashboard
          </Link>
        </nav>
      </div>

      <div className="flex-1">
        <div className="mx-auto max-w-6xl px-8 py-12">{children}</div>
      </div>
    </div>
  );
}
