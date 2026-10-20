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
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const section = useMemo(() => sections.find((item) => item[0] === active) ?? sections[2], [active]);
  const filteredRows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { void fetch("/api/admin/auth").then((r) => r.json()).then((data: { authenticated: boolean }) => setAuthenticated(data.authenticated)); }, []);
  useEffect(() => { if (authenticated) void load(active); }, [active, authenticated]);

  async function load(table: string) {
    const response = await fetch(`/api/admin/data?table=${table}`);
    const data = response.ok ? await response.json() as Row[] : [];
    setRows(data);
    setCounts((old) => ({ ...old, [table]: data.length }));
  }
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    setMessage(response.ok ? "" : "Invalid credentials or missing admin configuration.");
    if (response.ok) setAuthenticated(true);
  }
  async function save(event: React.FormEvent<HTMLFormElement>, id?: number) {
    event.preventDefault();
    const response = await fetch(`/api/admin/data?table=${active}`, { method: id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(new FormData(event.currentTarget)), ...(id ? { id } : {}) }) });
    setMessage(response.ok ? "Saved successfully." : ((await response.json()).error ?? "Unable to save."));
    if (response.ok) { if (!id) event.currentTarget.reset(); await load(active); }
  }
  async function remove(id: number) {
    if (!window.confirm("Delete this record permanently?")) return;
    const response = await fetch(`/api/admin/data?table=${active}&id=${id}`, { method: "DELETE" });
    setMessage(response.ok ? "Deleted successfully." : "Unable to delete.");
    if (response.ok) await load(active);
  }
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    const form = new FormData(); form.set("file", file);
    const response = await fetch("/api/admin/media", { method: "POST", body: form });
    const data = await response.json() as { url?: string; error?: string };
    setMessage(response.ok ? `Uploaded: ${data.url}` : data.error ?? "Upload failed.");
  }
  if (authenticated === null) return <p>Checking admin access…</p>;
  if (!authenticated) return <form className="contact-form" onSubmit={login}><h2>Site administration</h2><p>Sign in to manage the website.</p><label>Username</label><input name="username" required autoComplete="username" /><label>Password</label><input name="password" type="password" required autoComplete="current-password" /><button className="btn btn-primary">Sign in</button>{message && <p>{message}</p>}</form>;
  return <div className="admin-layout">
    <aside className="admin-sidebar"><h2>Control panel</h2><button className={active === "products" ? "active" : ""} onClick={() => setActive("products")}>Overview</button>{sections.map(([key, label]) => <button className={active === key ? "active" : ""} key={key} onClick={() => setActive(key)}>{label} {counts[key] !== undefined && <small>({counts[key]})</small>}</button>)}<label className="admin-upload">Upload image<input type="file" accept="image/*" onChange={upload} /></label><button onClick={async () => { await fetch("/api/admin/auth", { method: "DELETE" }); setAuthenticated(false); }}>Sign out</button></aside>
    <div className="admin-content"><h2>{section[1]}</h2><div className="admin-toolbar"><input placeholder="Search records…" value={query} onChange={(event) => setQuery(event.target.value)} /><button onClick={() => load(active)}>Refresh</button></div><form className="contact-form admin-form" onSubmit={(event) => save(event)}>{section[2].map((field) => field === "content" || field === "description" || field === "message" || field === "cover_letter" ? <label key={field}>{field}<textarea name={field} rows={3} /> </label> : <label key={field}>{field}<input name={field} /></label>)}<button className="btn btn-primary">Add record</button></form>{message && <p>{message}</p>}<div className="admin-table">{filteredRows.map((row) => <article key={String(row.id)}><strong>#{row.id}</strong><form onSubmit={(event) => save(event, row.id)}>{section[2].map((field) => field === "content" || field === "description" || field === "message" || field === "cover_letter" ? <label key={field}>{field}<textarea name={field} rows={3} defaultValue={String(row[field] ?? "")} /></label> : <label key={field}>{field}<input name={field} defaultValue={String(row[field] ?? "")} /></label>)}<button className="btn btn-primary">Save changes</button><button type="button" onClick={() => remove(row.id!)}>Delete</button></form></article>)}</div></div>
  </div>;
}
