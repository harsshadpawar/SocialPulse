-- CreateEnum
CREATE TYPE "AdherenceEventType" AS ENUM ('created', 'target_edited', 'marked_ready', 'marked_posted', 'actual_edited', 'missed_acknowledged');

-- CreateTable
CREATE TABLE "adherence_event" (
    "id" UUID NOT NULL,
    "platform_post_id" UUID NOT NULL,
    "event_type" "AdherenceEventType" NOT NULL,
    "at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "old_value" TEXT,
    "new_value" TEXT,

    CONSTRAINT "adherence_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting_target" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "daily_target" INTEGER,
    "weekly_target" INTEGER,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "posting_target_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adherence_event_platform_post_id_idx" ON "adherence_event"("platform_post_id");

-- AddForeignKey
ALTER TABLE "adherence_event" ADD CONSTRAINT "adherence_event_platform_post_id_fkey" FOREIGN KEY ("platform_post_id") REFERENCES "platform_post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
