-- v0.2d (D-43): extend the one-row posting_target into the commitments store.
-- All nullable — a commitment not set is simply not judged.
ALTER TABLE "posting_target" ADD COLUMN "prepare_ahead_target" INTEGER;
ALTER TABLE "posting_target" ADD COLUMN "completion_target_pct" INTEGER;
ALTER TABLE "posting_target" ADD COLUMN "missed_ceiling" INTEGER;
ALTER TABLE "posting_target" ADD COLUMN "weekly_capacity" INTEGER;
