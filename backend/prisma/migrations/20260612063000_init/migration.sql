-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('linkedin', 'x', 'youtube', 'instagram');

-- CreateEnum
CREATE TYPE "Format" AS ENUM ('text_post', 'short_post', 'short_video', 'reel');

-- CreateEnum
CREATE TYPE "Readiness" AS ENUM ('draft', 'ready');

-- CreateTable
CREATE TABLE "content_idea" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "core_message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_post" (
    "id" UUID NOT NULL,
    "content_idea_id" UUID NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'linkedin',
    "format" "Format" NOT NULL DEFAULT 'text_post',
    "caption" TEXT NOT NULL DEFAULT '',
    "target_datetime" TIMESTAMPTZ(6),
    "readiness" "Readiness" NOT NULL DEFAULT 'draft',
    "actual_datetime" TIMESTAMPTZ(6),
    "native_post_url" TEXT,
    "grace_window_minutes" INTEGER NOT NULL DEFAULT 30,
    "missed_acknowledged_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "platform_post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_post_target_datetime_idx" ON "platform_post"("target_datetime");

-- CreateIndex
CREATE INDEX "platform_post_content_idea_id_idx" ON "platform_post"("content_idea_id");

-- AddForeignKey
ALTER TABLE "platform_post" ADD CONSTRAINT "platform_post_content_idea_id_fkey" FOREIGN KEY ("content_idea_id") REFERENCES "content_idea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
