import type { GuestComment, GuestVote, GuestStance } from "@/types/guest";

export interface SubmitResult {
  submittedComments: number;
  submittedVotes: number;
  submittedStances: number;
  errors: Array<{ localId: string; error: string }>;
}

export async function submitGuestData(
  comments: GuestComment[],
  votes: GuestVote[],
  stances: GuestStance[] = []
): Promise<SubmitResult> {
  const res = await fetch("/api/guest/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comments, votes, stances }),
  });

  if (!res.ok) {
    throw new Error(`Submit failed: ${res.status}`);
  }

  return res.json();
}
