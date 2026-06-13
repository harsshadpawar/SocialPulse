-- Phase 2 (D-48): Weekly Review reflection notes — user-authored, keyed by Dubai ISO week.
CREATE TABLE "weekly_review" (
  "week_start_key" TEXT NOT NULL,
  "blockers" TEXT NOT NULL DEFAULT '',
  "repeat" TEXT NOT NULL DEFAULT '',
  "stop" TEXT NOT NULL DEFAULT '',
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "weekly_review_pkey" PRIMARY KEY ("week_start_key")
);
