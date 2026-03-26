"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/db";

interface UserRow {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  subscription_status: string;
  subscription_plan: string | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  auth_user_id: string;
  full_name: string;
  subscription_status: string;
  subscription_plan: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select(
            "id, auth_user_id, full_name, subscription_status, subscription_plan, created_at",
          )
          .order("created_at", { ascending: false });

        const profiles = (data ?? []) as ProfileRow[];
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const emailByAuthUserId = new Map(
          (authUsers?.users ?? []).map((user) => [
            user.id,
            user.email ?? "N/A",
          ]),
        );

        const enrichedUsers = profiles.map((profile) => ({
          ...profile,
          email: emailByAuthUserId.get(profile.auth_user_id) ?? "N/A",
        }));

        setUsers(enrichedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      lapsed: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return badges[status] || badges.inactive;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="mt-2 text-gray-600">View and manage registered users.</p>
      </div>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-600"
                >
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                        user.subscription_status,
                      )}`}
                    >
                      {user.subscription_status.charAt(0).toUpperCase() +
                        user.subscription_status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.subscription_plan
                      ? user.subscription_plan.charAt(0).toUpperCase() +
                        user.subscription_plan.slice(1)
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {users.length}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Active Subscriptions</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {
              users.filter((user) => user.subscription_status === "active")
                .length
            }
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Inactive</p>
          <p className="mt-1 text-2xl font-bold text-gray-600">
            {
              users.filter((user) => user.subscription_status === "inactive")
                .length
            }
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Conversion Rate</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {users.length > 0
              ? Math.round(
                  (users.filter(
                    (user) => user.subscription_status !== "inactive",
                  ).length /
                    users.length) *
                    100,
                )
              : 0}
            %
          </p>
        </div>
      </div>
    </div>
  );
}
