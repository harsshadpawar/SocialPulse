# v0.2f — Editable formats per platform · frozen decision (2026-06-13)

**Why:** posting a *video* on X recorded as "Post" (X was hard-locked to one format), so the content type
was wrong **and** the effort was undercounted (video scored as low). Format is now chosen, not fixed.

## D-52 · Format is a per-post choice; effort derives from the format

- **Format enum expanded** (migration `20260613143000_editable_formats`): + `thread`, `carousel`, `video`,
  `long_video`, `image` (appended to preserve enum order).
- **PLATFORM_FORMATS** now lists options per platform (first = default, used on create / repurpose /
  platform-switch fallback):
  - LinkedIn: Text post · Carousel · Video
  - X: Post · Thread · Video
  - YouTube: Short video · Long video
  - Instagram: Reel · Carousel · Image
- **Effort per format** (`deriveEffort`): low = text post / X post / image · medium = thread / carousel /
  reel / short video · high = video / long video. So a video now correctly reads **high** effort and
  feeds the weekly capacity meter properly.
- **Editor**: the Format dropdown is **enabled** (while the post is editable) and offers the platform's
  formats. Switching platform keeps the format if it's still valid, else falls back to the default.
- **Labels/nouns** moved from per-platform (`PLATFORM_META`) to **per-format** (`FORMAT_META`) so cards,
  the Result view, and the due-microcopy say the right thing ("Your X **video** is due", "Video", etc.).
- `isValidPair` still enforces platform↔format in the service layer (schema stays the single authority).

Pure-domain only where possible; the persistence write goes through the typed client (needs one
`prisma migrate dev` to add the enum values + regenerate the client). 96 backend tests green
(effort/planning tests updated for the new effort mapping); frontend tsc clean.
