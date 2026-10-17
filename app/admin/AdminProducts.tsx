"use client";

import { useEffect, useState } from "react";

type Product = { id: number; name: string; category: string | null };

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/products");
    setItems(response.ok ? await response.json() : []);
  }

  useEffect(() => {
    void fetch("/api/admin/products").then(async (response) => {
      setItems(response.ok ? await response.json() : []);
    });
  }, []);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    setMessage(response.ok ? "Product added" : "D1 is not configured");
    if (response.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  async function remove(id: number) {
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <h3>Products</h3>
      <form onSubmit={add} className="contact-form">
        <input name="name" placeholder="Product name" required />
        <input name="category" placeholder="Category" />
        <input name="description" placeholder="Description" />
        <button className="btn btn-primary">Add product</button>
      </form>
      {message && <p>{message}</p>}
      <ul>
        {items.map((product) => (
          <li key={product.id}>
            {product.name} ({product.category}){" "}
            <button onClick={() => remove(product.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
