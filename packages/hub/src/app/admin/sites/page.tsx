import { db } from "@/db";
import { siteRegistrations } from "@/db/schema";
import { AdminDashboard } from "../admin-dashboard";

export default async function SitesPage() {
  const adminToken = process.env.HUB_ADMIN_TOKEN;

  if (!adminToken) {
    return (
      <>
        <h1>Sites</h1>
        <p style={{ color: "red" }}>HUB_ADMIN_TOKEN is not configured.</p>
      </>
    );
  }

  const sites = await db.select().from(siteRegistrations);

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Sites</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>
        Manage registered federation sites.
      </p>
      <AdminDashboard initialSites={sites} adminToken={adminToken} />
    </>
  );
}
