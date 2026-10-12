const $ = selector => document.querySelector(selector);
const money = value => new Intl.NumberFormat("en-TN", { style: "currency", currency: "TND", maximumFractionDigits: 2 }).format(value);
let currentItems = [];

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({ success: false, error: "Server returned invalid JSON" }));
  if (!response.ok || !payload.success) {
    const message = payload.details ? payload.details.join("; ") : (payload.error || `Request failed (${response.status})`);
    throw new Error(message);
  }
  return payload;
}

function showMessage(text = "") { $("#message").textContent = text; }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function renderItems(items) {
  const body = $("#inventoryBody");
  if (!items.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty">No products match your search.</td></tr>';
    return;
  }
  body.innerHTML = items.map(item => `
    <tr>
      <td><div class="product-cell"><span class="product-icon">▦</span><span>${escapeHtml(item.name)}</span></div></td>
      <td><span class="sku">${escapeHtml(item.sku)}</span></td>
      <td><span class="pill">${escapeHtml(item.category)}</span></td>
      <td><span class="stock-pill ${item.quantity <= 8 ? "stock-low" : "stock-good"}">${item.quantity} units</span></td>
      <td>${money(item.price)}</td>
      <td><strong>${money(item.stockValue)}</strong></td>
      <td><button class="action-btn" data-edit="${item.id}" aria-label="Edit ${escapeHtml(item.name)}">Edit</button><button class="action-btn" data-delete="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">Delete</button></td>
    </tr>`).join("");
}

async function loadItems() {
  showMessage("");
  $("#inventoryBody").innerHTML = '<tr><td colspan="7" class="empty">Loading inventory…</td></tr>';
  try {
    const query = new URLSearchParams();
    const search = $("#searchInput").value.trim();
    if (search) query.set("search", search);
    if ($("#lowStockFilter").checked) query.set("lowStock", "true");
    const payload = await api(`/api/items?${query}`);
    currentItems = payload.data;
    renderItems(currentItems);
    $("#resultCount").textContent = `${payload.meta.count} product${payload.meta.count === 1 ? "" : "s"} shown`;
    await updateStats();
  } catch (error) {
    $("#inventoryBody").innerHTML = '<tr><td colspan="7" class="empty">Could not load inventory.</td></tr>';
    showMessage(error.message);
  }
}

async function updateStats() {
  const payload = await api("/api/items");
  const items = payload.data;
  $("#totalProducts").textContent = items.length;
  $("#stockValue").textContent = money(items.reduce((sum, item) => sum + item.stockValue, 0));
  $("#lowStockCount").textContent = items.filter(item => item.quantity <= 8).length;
}

function openDialog(item = null) {
  $("#productForm").reset();
  $("#formError").textContent = "";
  $("#productId").value = item ? item.id : "";
  $("#dialogTitle").textContent = item ? "Edit product" : "Add product";
  $("#name").value = item?.name || "";
  $("#sku").value = item?.sku || "";
  $("#quantity").value = item?.quantity ?? 0;
  $("#price").value = item?.price ?? 0;
  $("#category").value = item?.category || "";
  $("#productDialog").showModal();
}
function closeDialog() { $("#productDialog").close(); }

$("#addBtn").addEventListener("click", () => openDialog());
$("#closeDialog").addEventListener("click", closeDialog);
$("#cancelBtn").addEventListener("click", closeDialog);
$("#refreshBtn").addEventListener("click", loadItems);
$("#searchInput").addEventListener("input", () => {
  clearTimeout(window.searchTimer);
  window.searchTimer = setTimeout(loadItems, 200);
});
$("#lowStockFilter").addEventListener("change", loadItems);

$("#inventoryBody").addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const item = currentItems.find(product => product.id === Number(editButton.dataset.edit));
    if (item) openDialog(item);
  }
  if (deleteButton) {
    const id = Number(deleteButton.dataset.delete);
    const item = currentItems.find(product => product.id === id);
    if (!item || !confirm(`Delete "${item.name}"?`)) return;
    try {
      await api(`/api/items/${id}`, { method: "DELETE" });
      await loadItems();
      showMessage("Product deleted successfully.");
    } catch (error) { showMessage(error.message); }
  }
});

$("#productForm").addEventListener("submit", async event => {
  event.preventDefault();
  const id = $("#productId").value;
  const item = {
    name: $("#name").value.trim(),
    sku: $("#sku").value.trim(),
    quantity: Number($("#quantity").value),
    price: Number($("#price").value),
    category: $("#category").value.trim()
  };
  try {
    await api(id ? `/api/items/${id}` : "/api/items", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(item)
    });
    closeDialog();
    await loadItems();
    showMessage(id ? "Product updated successfully." : "Product added successfully.");
  } catch (error) { $("#formError").textContent = error.message; }
});

loadItems();
