import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuarantineQueue } from "@/components/moderation/quarantine-queue";

export default async function ModerationPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const [user] = await db
    .select({ trustTier: users.trustTier })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user || (user.trustTier !== "moderator" && user.trustTier !== "admin")) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Moderation Dashboard</h1>
      <Tabs defaultValue="quarantine" className="w-full">
        <TabsList>
          <TabsTrigger value="quarantine">Quarantine Queue</TabsTrigger>
          <TabsTrigger value="reports" disabled>
            Reports
          </TabsTrigger>
          <TabsTrigger value="users" disabled>
            Users
          </TabsTrigger>
        </TabsList>
        <TabsContent value="quarantine" className="mt-4">
          <QuarantineQueue />
        </TabsContent>
        <TabsContent value="reports">
          <p className="text-muted-foreground py-8 text-center">
            Reports panel coming soon.
          </p>
        </TabsContent>
        <TabsContent value="users">
          <p className="text-muted-foreground py-8 text-center">
            User management coming soon.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
