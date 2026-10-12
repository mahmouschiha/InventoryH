const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");

let nextId = 4;
let items = [
  { id: 1, name: "Laptop", sku: "TECH-001", quantity: 12, price: 1250, category: "Electronics" },
  { id: 2, name: "Keyboard", sku: "TECH-002", quantity: 25, price: 85, category: "Accessories" },
  { id: 3, name: "Monitor", sku: "TECH-003", quantity: 7, price: 620, category: "Electronics" }
];

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
};

function sendJson(res, status, payload) {
  res.writeHead(status, JSON_HEADERS);
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

function validateItem(data, partial = false) {
  const errors = [];
  if (!partial || data.name !== undefined) {
    if (typeof data.name !== "string" || !data.name.trim()) errors.push("name must be a non-empty string");
  }
  if (!partial || data.sku !== undefined) {
    if (typeof data.sku !== "string" || !data.sku.trim()) errors.push("sku must be a non-empty string");
  }
  if (!partial || data.quantity !== undefined) {
    if (!Number.isInteger(data.quantity) || data.quantity < 0) errors.push("quantity must be a non-negative integer");
  }
  if (!partial || data.price !== undefined) {
    if (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price < 0) errors.push("price must be a non-negative number");
  }
  if (!partial || data.category !== undefined) {
    if (typeof data.category !== "string" || !data.category.trim()) errors.push("category must be a non-empty string");
  }
  return errors;
}

function publicItem(item) {
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    price: item.price,
    category: item.category,
    stockValue: Number((item.quantity * item.price).toFixed(2))
  };
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, { success: true, status: "ok", service: "InventoryHub API" });
  }

  if (url.pathname === "/api/items" && req.method === "GET") {
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const category = (url.searchParams.get("category") || "").trim().toLowerCase();
    const lowStock = url.searchParams.get("lowStock") === "true";
    const filtered = items.filter(item => {
      const matchesSearch = !search || item.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search) || item.category.toLowerCase().includes(search);
      const matchesCategory = !category || item.category.toLowerCase() === category;
      return matchesSearch && matchesCategory && (!lowStock || item.quantity <= 8);
    });
    return sendJson(res, 200, {
      success: true,
      data: filtered.map(publicItem),
      meta: { count: filtered.length }
    });
  }

  if (url.pathname === "/api/items" && req.method === "POST") {
    let data;
    try { data = await readJson(req); }
    catch (error) { return sendJson(res, 400, { success: false, error: error.message }); }
    const errors = validateItem(data);
    if (errors.length) return sendJson(res, 400, { success: false, error: "Validation failed", details: errors });
    if (items.some(item => item.sku.toLowerCase() === data.sku.trim().toLowerCase())) {
      return sendJson(res, 409, { success: false, error: "SKU already exists" });
    }
    const item = {
      id: nextId++,
      name: data.name.trim(),
      sku: data.sku.trim(),
      quantity: data.quantity,
      price: data.price,
      category: data.category.trim()
    };
    items.push(item);
    return sendJson(res, 201, { success: true, data: publicItem(item) });
  }

  const match = url.pathname.match(/^\/api\/items\/(\d+)$/);
  if (match) {
    const id = Number(match[1]);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return sendJson(res, 404, { success: false, error: "Item not found" });

    if (req.method === "GET") return sendJson(res, 200, { success: true, data: publicItem(items[index]) });

    if (req.method === "PUT" || req.method === "PATCH") {
      let data;
      try { data = await readJson(req); }
      catch (error) { return sendJson(res, 400, { success: false, error: error.message }); }
      const errors = validateItem(data, req.method === "PATCH");
      if (errors.length) return sendJson(res, 400, { success: false, error: "Validation failed", details: errors });
      const candidate = { ...items[index], ...data };
      if (items.some(item => item.id !== id && item.sku.toLowerCase() === String(candidate.sku).trim().toLowerCase())) {
        return sendJson(res, 409, { success: false, error: "SKU already exists" });
      }
      candidate.name = candidate.name.trim();
      candidate.sku = candidate.sku.trim();
      candidate.category = candidate.category.trim();
      items[index] = candidate;
      return sendJson(res, 200, { success: true, data: publicItem(candidate) });
    }

    if (req.method === "DELETE") {
      const [deleted] = items.splice(index, 1);
      return sendJson(res, 200, { success: true, data: publicItem(deleted), message: "Item deleted" });
    }
  }

  return sendJson(res, 404, { success: false, error: "API route not found" });
}

function serveStatic(req, res, url) {
  let requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.resolve(PUBLIC_DIR, "." + requested);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== path.join(PUBLIC_DIR, "index.html")) {
    res.writeHead(403); return res.end("Forbidden");
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    const ext = path.extname(filePath);
    const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    try { await handleApi(req, res, url); }
    catch (error) {
      console.error(error);
      if (!res.headersSent) sendJson(res, 500, { success: false, error: "Internal server error" });
    }
    return;
  }
  serveStatic(req, res, url);
});

server.listen(PORT, () => console.log(`InventoryHub running at http://localhost:${PORT}`));
