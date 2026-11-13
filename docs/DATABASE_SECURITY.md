# TradeLink Database Security and Row-Level Access

## Database engine and RLS status

TradeLink currently uses **MySQL 8.0** through Knex and mysql2 (see server/knexfile.js and server/src/config/db.js).

**The database does not have native row-level security (RLS) policies.** MySQL 8.0 does not implement PostgreSQL-style ENABLE ROW LEVEL SECURITY, CREATE POLICY, or per-row policies. The schema's foreign keys and indexes are integrity controls, not RLS.

Do not describe the current database as RLS-enabled.

## Current application-level access controls

The backend applies authorization at the API layer:

- Student and admin JWTs use separate signing secrets, issuers/audiences, and authentication middleware (authenticate and authenticateAdmin).
- Student-only actions use requireStudent and, where needed, requireVerified.
- Listing updates and deletion check the authenticated user's seller_id or administrator role.
- Transaction reads and state changes check buyer/seller participation, with a separate administrator override path.
- Chat controllers verify that the authenticated user is a conversation participant before returning or changing messages.
- Flash-request deletion/fulfillment checks the requester or administrator.
- Swap responses check that the authenticated user owns the target listing.
- Administrator mutations are mounted after authenticateAdmin on /api/admin/*; category creation also requires the dedicated admin JWT.

These are application-level row access checks. Every new query/controller must repeat the appropriate ownership predicate on the server. Never trust client-supplied owner IDs, hidden buttons, or route parameters as authorization.

## Important limitations and recommendations

1. Add integration tests for every read/update/delete endpoint that prove a second student cannot access another student's private row.
2. Keep admin-only list, transaction, and moderation endpoints behind authenticateAdmin; do not reuse student-token routes in the admin app.
3. Use a least-privilege MySQL account for the running API. Do not run the API as the MySQL root user in production.
4. Restrict database network access to the backend service and require TLS for managed production databases.
5. If native database-enforced RLS is a hard requirement, migrate to a database engine that supports it (for example PostgreSQL) and implement policies before moving production traffic. A MySQL migration alone cannot turn on PostgreSQL-style RLS.
6. Review backups, logs, and upload storage separately; SQL authorization does not protect public media URLs or files accidentally committed to Git.

## Verification performed for this audit

The tracked schema and migrations were searched for RLS statements and policy definitions. No native RLS policies were found. The project is MySQL-based, so this is expected rather than a missing SQL migration.
