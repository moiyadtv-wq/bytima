# Session Summary — Archive 500 Bug & Fixes

## Problem
`POST /admin/orders/:id/archive` consistently returned 500 Internal Server Error.

## Root Causes (3 layers)
1. **Nested forms** in `views/admin/orders.ejs` — the archive form `<form action="/admin/orders/:id/archive">` was nested inside the status update form. Invalid HTML caused unpredictable browser submission behavior (wrong form submitted, CSRF token missing).
2. **Missing `!token` guard** in `middleware/security.js` `csrfProtect` — `tokens.verify(secret, undefined)` thrown when CSRF token was `undefined`, causing an unhandled 500.
3. **No try/catch** around csrfProtect — any error in the CSRF middleware was unhandled.

## Fixes Applied
- **Nested forms fix**: Closed the status `<form>` tag before the archive form (commit `33fda04`).
- **`!token` guard**: Added `if (!token || !tokens.verify(...))` so `undefined` tokens are rejected gracefully instead of thrown (commit `b0fb993`).
- **try/catch in csrfProtect**: Wrapped entire function in `try/catch(next(err))` (commit `b0fb993`).
- **Controller simplification**: Changed `toggleArchiveOrder` from `findById()` + field mutate + `save()` to `findById().lean()` + `updateOne()` — avoids stale document / version conflicts (commit `fffacf3`).

## Verification
- Archive toggle works both ways: active → archived (302 `?archived=1`) and archived → active (302 `/admin/orders`).
- All other POST routes (`/admin/orders/:id/status`, `/admin/customers/:id/toggle-status`) also work.
- `toggleCustomerStatus`, `updateOrderStatus` all return 302 as expected.
