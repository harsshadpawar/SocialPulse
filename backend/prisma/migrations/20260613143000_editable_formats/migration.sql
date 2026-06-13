-- v0.2f: editable formats per platform — add the new Format values (appended to preserve enum order).
ALTER TYPE "Format" ADD VALUE IF NOT EXISTS 'thread';
ALTER TYPE "Format" ADD VALUE IF NOT EXISTS 'carousel';
ALTER TYPE "Format" ADD VALUE IF NOT EXISTS 'video';
ALTER TYPE "Format" ADD VALUE IF NOT EXISTS 'long_video';
ALTER TYPE "Format" ADD VALUE IF NOT EXISTS 'image';
