# Reflective Summary: AI-Assisted Development

Use this reflection as a draft and revise it so it accurately describes the work you personally completed and the suggestions you actually accepted from Microsoft Copilot.

During development of InventoryHub, I used an AI coding assistant as a support tool for reviewing the structure of the application and thinking through front-end/back-end integration. I focused on keeping the REST endpoints resource-oriented and using predictable JSON response shapes so the client could handle success and error cases consistently.

For debugging, I checked the API responses and tested cases such as invalid input, duplicate SKUs, and requests for products that do not exist. I used server-side validation to avoid relying only on browser validation. For performance, I included a debounced search, server-side filtering, and event delegation for product actions. These choices reduce unnecessary client requests and avoid attaching a separate event listener to every table row.

The most important lesson was to verify AI-assisted suggestions rather than accept them automatically. I checked behavior through manual scenarios and API smoke tests. Before submitting, I would also run the application locally, capture any issues found, and describe the exact Copilot suggestions and changes I made. The current demo stores inventory in memory, so a production version would need persistent storage and appropriate security controls.
