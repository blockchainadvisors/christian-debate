"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sites", label: "Sites" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/health", label: "Health" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        width: 220,
        minHeight: "100vh",
        borderRight: "1px solid #e5e7eb",
        padding: "24px 0",
        background: "#f9fafb",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "0 20px 20px",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          Agora Hub
        </h2>
        <span style={{ fontSize: 12, color: "#6b7280" }}>Admin Panel</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                style={{
                  display: "block",
                  padding: "10px 20px",
                  textDecoration: "none",
                  color: isActive ? "#2563eb" : "#374151",
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? "#eff6ff" : "transparent",
                  borderRight: isActive ? "3px solid #2563eb" : "3px solid transparent",
                  fontSize: 14,
                }}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
