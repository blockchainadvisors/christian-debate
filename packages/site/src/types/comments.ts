export interface CommentAuthor {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export interface CommentWithAuthor {
  id: string;
  debateId: string;
  authorId: string;
  parentId: string | null;
  rootId: string | null;
  depth: number;
  content: string;
  stanceSide: "side_a" | "side_b" | "neutral" | "meta";
  ancestorPath: string[] | null;
  isQuarantined: boolean;
  quarantineReason: string | null;
  status: "active" | "edited" | "deleted_by_author" | "removed_by_mod";
  score: number;
  createdAt: string;
  editedAt: string | null;
  author: CommentAuthor;
  isGuestComment?: boolean;
}

export interface CommentNode extends CommentWithAuthor {
  children: CommentNode[];
  isGuestComment?: boolean;
}

/**
 * Builds a nested tree from a flat array of comments.
 * Assumes comments are ordered by createdAt asc.
 */
export function buildCommentTree(comments: CommentWithAuthor[]): CommentNode[] {
  const nodeMap = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  // First pass: create nodes
  for (const comment of comments) {
    nodeMap.set(comment.id, { ...comment, children: [] });
  }

  // Second pass: link children to parents
  for (const comment of comments) {
    const node = nodeMap.get(comment.id)!;
    if (comment.parentId) {
      const parent = nodeMap.get(comment.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found (possibly deleted/filtered), treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}
