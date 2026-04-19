# Canonical Job Status

Single source of truth for **job/booking status** and **allowed transitions**. Keep backend, frontend, and n8n in sync with this document. For entity naming (booking vs job, canonical ID), see [PURETASK_PRODUCT_BRAIN.md](./PURETASK_PRODUCT_BRAIN.md) § 0.

---

## 1. Status enum

Use these exact string values in API payloads, DB, and workflows.

| Value | Description | Who sees it |
|-------|-------------|-------------|
| `pending` | Booking created; no cleaner assigned yet (or assignment in progress). | Client, Admin |
| `accepted` | Cleaner assigned and accepted. | Client, Cleaner, Admin |
| `scheduled` | Same as accepted; sometimes used when slot is confirmed. | Client, Cleaner, Admin |
| `on_my_way` | Cleaner marked en route. | Client, Cleaner, Admin |
| `in_progress` | Cleaner checked in; job in progress. | Client, Cleaner, Admin |
| `awaiting_approval` | Cleaner submitted; waiting for client to approve or dispute. | Client, Cleaner, Admin |
| `completed` | Client approved (or admin resolved); job closed, escrow released. | Client, Cleaner, Admin |
| `cancelled` | Job cancelled (by client, cleaner, or system). | Client, Cleaner, Admin |
| `disputed` | Client opened a dispute; awaiting admin resolution. | Client, Cleaner, Admin |

**True terminal (no outgoing transitions):** `completed`, `cancelled`. **Non-terminal but closed loop:** `disputed` — only admin can transition it to `completed` or `cancelled`; after that, the job is terminal.

---

## 2. Allowed transitions

Only these transitions are valid. Backend and n8n should reject any other transition (e.g. return 400).

| From | To | Trigger / Notes |
|------|-----|-----------------|
| `pending` | `accepted` | Cleaner accepts (or auto-assign). |
| `pending` | `cancelled` | Client or system cancels before acceptance. |
| `accepted` / `scheduled` | `on_my_way` | Cleaner sends “En route”. |
| `accepted` / `scheduled` | `cancelled` | Client or cleaner cancels. |
| `on_my_way` | `in_progress` | Cleaner checks in (GPS). |
| `on_my_way` | `cancelled` | Client or cleaner cancels. |
| `in_progress` | `awaiting_approval` | Cleaner submits job (after photos, etc.). |
| `in_progress` | `cancelled` | Rare; e.g. cleaner leaves, client cancels. |
| `awaiting_approval` | `completed` | Client approves (POST /tracking/:jobId/approve). |
| `awaiting_approval` | `disputed` | Client opens dispute (POST /tracking/:jobId/dispute). |
| `disputed` | `completed` | Admin resolves (e.g. no refund, release to cleaner). |
| `disputed` | `cancelled` | Admin resolves with refund / cancel. |

**No transition from:** `completed`, `cancelled` (and `disputed` only via admin resolve).

---

## 3. Sync checklist

- **Backend:** Persist only the enum values above; enforce transitions in job/booking state machine; return `status` in job/booking/details/timeline responses.
- **Frontend:** Use `JOB_STATUS` and `JOB_STATUS_TRANSITIONS` from `src/constants/jobStatus.ts` for labels, badges, and transition checks.
- **n8n:** Use the same enum and transition table in workflows (e.g. “If status = awaiting_approval then …”, “Only allow transition to completed from awaiting_approval”).

---

## 4. Optional aliases

Some systems use `requested` for `pending` or `confirmed` for `accepted`/`scheduled`. Prefer the canonical values above; if the backend exposes aliases, map them to this enum at the API boundary so frontend and n8n only see the canonical set.
