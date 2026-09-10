# Walkthrough

## Phase 10: Search ??
Added a powerful Slack-style message search system entirely backed by PostgreSQL! 

### What's New:
- **Search API & Abstraction**: Created a scalable backend \SearchService\ that delegates to a \PostgresSearchProvider\. This ensures we can easily swap to Elasticsearch or OpenSearch in a future phase without breaking the frontend API contract.
- **Slack-Style Search Syntax**: We support a rich set of operators right out of the box using a custom \search-parser.ts\:
  - \rom:john\ (finds messages from a specific username)
  - \in:general\ (finds messages within a specific channel)
  - \fter:2026-09-01\ (finds messages after a date)
  - \efore:2026-09-10\ (finds messages before a date)
  - \has:file\ (finds messages with attachments)
  - \has:voice\ (finds voice messages)
  - Plain text (case-insensitive substring search)
- **Ironclad Authorization**: The \PostgresSearchProvider\ enforces authorization at the database level. Users will ONLY see messages from public channels, private channels they belong to, and DMs they belong to. Searches inside an \in:\ channel are validated to ensure membership.
- **Search UI**:
  - Added a search bar directly into the top of the \WorkspaceSidebar\ for quick access.
  - Built a dedicated \SearchPage\ that renders results in real-time, displays the channel/DM context, and clicking a result jumps straight to the conversation.
  - Search state is preserved flawlessly via URL parameters (e.g. \?q=project+deadline\).
- **Pagination**: Implemented cursor-based pagination (\loadMore\) ensuring scalable frontend performance even with thousands of results.

### Next Steps:
Test it out! Type \hello in:general has:voice\ in the sidebar search bar and see the magic!
