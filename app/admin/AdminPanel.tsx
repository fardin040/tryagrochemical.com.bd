"use client";

import { useEffect, useMemo, useState } from "react";

const sections = [
  ["settings", "Site settings", ["setting_key", "setting_value"]],
  ["pages", "Pages", ["slug", "title", "content", "meta_description"]],
  ["products", "Products", ["name", "description", "category", "image"]],
  ["categories", "Categories", ["name", "slug"]],
  ["jobs", "Jobs", ["title", "location", "type", "description", "deadline"]],
  ["job_applications", "Applications", ["job_id", "applicant_name", "email", "phone", "cover_letter", "resume", "status", "is_general"]],
  ["messages", "Messages", ["name", "phone", "message"]],
  ["dealers", "Dealers", ["name", "organization", "address", "district", "phone"]],
  ["sales_officers", "Sales officers", ["name", "designation", "area", "phone", "image"]],
  ["certifications", "Certifications", ["title", "description", "icon"]],
] as const;

type Section = typeof sections[number];
type Row = Record<string, unknown> & { id?: number };

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [active, setActive] = useState<Section[0]>("products");
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState("");
  const section = useMemo(() => sections.find((item) => item[0] === active) ?? sections[2], [active]);

  useEffect(() => {
    void fetch("/api/admin/auth").then((response) => response.json()).then((data: { authenticated: boolean }) => setAuthenticated(data.authenticated));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void load(active);
  }, [active, authenticated]);

  async function load(table: string) {
    const response = await fetch(`/api/admin/data?table=${table}`);
    setRows(response.ok ? await response.json() : []);
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    setMessage(response.ok ? "" : "Invalid credentials or missing admin configuration.");
    if (response.ok) setAuthenticated(true);
  }

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/admin/data?table=${active}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    setMessage(response.ok ? "Saved successfully." : (await response.json()).error ?? "Unable to save.");
    if (response.ok) { event.currentTarget.reset(); await load(active); }
  }

  async function remove(id: number) {
    const response = await fetch(`/api/admin/data?table=${active}&id=${id}`, { method: "DELETE" });
    setMessage(response.ok ? "Deleted successfully." : "Unable to delete.");
    if (response.ok) await load(active);
  }

  async function edit(event: React.FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/admin/data?table=${active}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, id }) });
    setMessage(response.ok ? "Updated successfully." : "Unable to update.");
    if (response.ok) await load(active);
  }

  if (authenticated === null) return <p>Checking admin access…</p>;
  if (!authenticated) return <form className="contact-form" onSubmit={login}><h2>Site administration</h2><p>Sign in to manage the website.</p><label>Username</label><input name="username" required autoComplete="username" /><label>Password</label><input name="password" type="password" required autoComplete="current-password" /><button className="btn btn-primary">Sign in</button>{message && <p>{message}</p>}</form>;

  return <div className="admin-layout">
    <div className="admin-sidebar"><h2>Site control panel</h2>{sections.map(([key, label]) => <button className={active === key ? "active" : ""} key={key} onClick={() => setActive(key)}>{label}</button>)}<button onClick={async () => { await fetch("/api/admin/auth", { method: "DELETE" }); setAuthenticated(false); }}>Sign out</button></div>
    <div className="admin-content"><h2>{section[1]}</h2><form className="contact-form admin-form" onSubmit={add}>{section[2].map((field) => <label key={field}>{field}<input name={field} /></label>)}<button className="btn btn-primary">Add record</button></form>{message && <p>{message}</p>}<div className="admin-table">{rows.map((row) => <article key={String(row.id)}><strong>#{row.id}</strong><form onSubmit={(event) => edit(event, row.id!)}>{section[2].map((field) => <label key={field}>{field}<input name={field} defaultValue={String(row[field] ?? "")} /></label>)}<button className="btn btn-primary">Save changes</button><button type="button" onClick={() => remove(row.id!)}>Delete</button></form></article>)}</div></div>
  </div>;
}
