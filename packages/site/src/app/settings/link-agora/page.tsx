import { redirect } from "next/navigation";

// Redirect to the security page which now hosts the Agora section
export default function LinkAgoraPage() {
  redirect("/settings/security");
}
