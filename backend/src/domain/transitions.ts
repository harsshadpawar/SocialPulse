// Event vocabulary (decision #24). No bus, no store, no subscribers — a typed seam.
// applyTransition() in the service layer returns one of these per mutation; v0.2
// reminders / audit-log attach here instead of requiring a refactor.
// *Detected events are derive-on-read findings, not stored transitions (ADR-2).

export type TransitionEvent =
  | { type: 'PostMarkedReady'; postId: string; at: Date }
  | { type: 'PostMarkedPosted'; postId: string; at: Date; actualDatetime: Date }
  | { type: 'MissedAcknowledged'; postId: string; at: Date }
  | { type: 'PostDueDetected'; postId: string; at: Date }
  | { type: 'GraceExpiredDetected'; postId: string; at: Date };
