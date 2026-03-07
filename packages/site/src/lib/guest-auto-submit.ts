import type {
  GuestComment,
  GuestVote,
  GuestStance,
  PreviewResponse,
  ConflictResolutions,
} from "@/types/guest";

export interface SubmitResult {
  submittedComments: number;
  submittedVotes: number;
  submittedStances: number;
  skippedComments: number;
  skippedVotes: number;
  skippedStances: number;
  errors: Array<{ localId: string; error: string }>;
  failedLocalIds: string[];
}

export async function previewGuestData(
  comments: GuestComment[],
  votes: GuestVote[],
  stances: GuestStance[] = []
): Promise<PreviewResponse> {
  const res = await fetch("/api/guest/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comments, votes, stances }),
  });

  if (!res.ok) {
    throw new Error(`Preview failed: ${res.status}`);
  }

  return res.json();
}

export async function submitGuestData(
  comments: GuestComment[],
  votes: GuestVote[],
  stances: GuestStance[] = [],
  resolutions?: ConflictResolutions
): Promise<SubmitResult> {
  const res = await fetch("/api/guest/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comments, votes, stances, resolutions }),
  });

  if (!res.ok) {
    throw new Error(`Submit failed: ${res.status}`);
  }

  return res.json();
}
