# InventoryHub — Full-Stack Inventory Management

A small full-stack learning project demonstrating front-end/back-end communication, REST API design, JSON response consistency, validation, error handling, and lightweight performance choices.

## Requirements
- Node.js 18 or newer
- No third-party npm dependencies

## Run locally
1. Extract the ZIP.
2. Open a terminal in the `InventoryHub_Project` folder.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/items` | List inventory; supports `search` and `lowStock=true` |
| GET | `/api/items/:id` | Get one product |
| POST | `/api/items` | Create a product |
| PUT/PATCH | `/api/items/:id` | Update a product |
| DELETE | `/api/items/:id` | Delete a product |

Successful responses use a consistent JSON envelope such as `{"success":true,"data":...}`. Errors include a status code and a clear message. The API validates request fields and prevents duplicate SKUs.

## Project structure
- `server.js` — Node.js HTTP server, REST API, validation and static file delivery
- `public/index.html` — accessible dashboard structure and product form
- `public/styles.css` — responsive dashboard styles
- `public/app.js` — front-end API integration, rendering and CRUD actions
- `test/api.test.js` — automated API smoke tests
- `performance_report.md` — performance decisions and follow-up ideas
- `llm_contribution_reflection.md` — reflective summary template

## Run tests
Start the server in one terminal with `npm start`. In another terminal, run `node --test`. Tests use the built-in Node test runner and make requests to `http://localhost:3000`.

## Important limitation
This is a learning/demo app. Inventory data is held in server memory and resets when the server restarts. A production system should use a database, authentication, authorization, request logging, rate limiting, and deployment secrets.
