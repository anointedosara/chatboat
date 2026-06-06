"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { clearCurrentUser, getCurrentUser, type User } from "@/lib/users";

type Item = {
  label: string;
  href?: string;
  icon: React.ReactNode;
  danger?: boolean;
  action?: "logout";
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser() ?? null);
  }, []);

  function logout() {
    clearCurrentUser();
    router.replace("/login");
  }

  const items: Item[] = [
    { label: "Edit Profile", href: "/settings/edit-profile", icon: <IconEdit /> },
    { label: "Blocked users", icon: <IconBlock /> },
    { label: "Delete account", icon: <IconTrash /> },
    { label: "Privacy policy", icon: <IconShield /> },
    { label: "Terms & condition", icon: <IconDoc /> },
    { label: "Logout", icon: <IconLogout />, action: "logout" },
  ];

  return (
    <AppShell active="settings">
      <div className="flex flex-1 flex-col bg-[#f4f6f7]">
        <header className="bg-teal px-5 pb-6 pt-5 text-white">
          <h1 className="text-xl font-bold">Settings</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {/* Profile card */}
          <div className="-mt-3 mb-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <Avatar name={user?.name ?? "User"} src={user?.avatar} size={52} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user?.name ?? "Your name"}</p>
              <p className="truncate text-sm text-ink/50">
                {user?.phone ? `+${user.phone}` : "—"}
              </p>
            </div>
          </div>

          {/* Menu */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {items.map((it, i) => {
              const inner = (
                <span className="flex items-center gap-3.5 px-4 py-3.5">
                  <span className={it.danger ? "text-red-500" : "text-teal-dark"}>{it.icon}</span>
                  <span className="flex-1 text-[15px] text-ink">{it.label}</span>
                  <svg className="text-ink/30" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              );
              const cls = `block border-black/5 ${i > 0 ? "border-t" : ""}`;
              if (it.action === "logout") {
                return (
                  <button key={it.label} onClick={logout} className={`${cls} w-full text-left`}>
                    {inner}
                  </button>
                );
              }
              if (it.href) {
                return (
                  <Link key={it.label} href={it.href} className={cls}>
                    {inner}
                  </Link>
                );
              }
              return (
                <div key={it.label} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const sv = "1.7";
function IconEdit() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sv} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>;
}
function IconBlock() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sv}><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" strokeLinecap="round" /></svg>;
}
function IconTrash() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sv} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6" /></svg>;
}
function IconShield() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sv} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>;
}
function IconDoc() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sv} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></svg>;
}
function IconLogout() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sv} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
}
