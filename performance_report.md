# Performance and Integration Notes

## Implemented
- Uses a small Node.js server with no third-party runtime dependencies, reducing install overhead.
- Filters inventory on the server and returns only the fields needed by the dashboard.
- Uses a debounced search input (200 ms) to avoid sending a request on every keystroke.
- Uses event delegation for row actions instead of registering handlers on every row.
- Uses `textContent` for status messages and HTML escaping for product fields rendered in the table.
- Adds a JSON response envelope and explicit HTTP status codes for predictable client behavior.
- Validates data on the server and checks duplicate SKUs before changing inventory.
- Uses a responsive layout and accessible labels/status announcements.

## Manual verification checklist
1. Run `npm start` and open `http://localhost:3000`.
2. Verify the overview cards match the seeded products.
3. Search by product name or SKU.
4. Turn on “Low stock only” and confirm only products with 8 or fewer units are shown.
5. Add a valid product; confirm it appears and the metrics update.
6. Edit a product and verify the changes.
7. Delete a product and verify it disappears.
8. Try a duplicate SKU or invalid quantity and confirm the UI displays an error.
9. Open `/api/items` directly and inspect the JSON response.

## Further production improvements
- Persist data in PostgreSQL or SQLite.
- Add pagination for large inventories and indexes for searchable columns.
- Add authentication, role-based access control, structured logging and rate limiting.
- Use a load test and browser performance profiler before claiming quantified performance gains.

No benchmark figures are claimed in this report; measure before and after changes to make quantitative conclusions.
