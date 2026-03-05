import type { CommentWithAuthor } from "./comments";

export interface ExchangePair {
  id: string;
  comments: CommentWithAuthor[];
  pairScore: number;
}
