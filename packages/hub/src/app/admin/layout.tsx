import { AdminNav } from "@/components/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <AdminNav />
      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1100 }}>
        {children}
      </main>
    </div>
  );
}
