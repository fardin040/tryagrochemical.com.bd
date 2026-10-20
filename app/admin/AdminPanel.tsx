"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const sections = [
  ["settings", "Site settings", ["setting_key", "setting_value"], "Configuration"],
  ["pages", "Pages", ["slug", "title", "content", "meta_description"], "Content"],
  ["products", "Products", ["name", "description", "category", "image"], "Catalog"],
  ["categories", "Categories", ["name", "slug"], "Catalog"],
  ["jobs", "Jobs", ["title", "location", "type", "description", "deadline"], "Careers"],
  ["job_applications", "Applications", ["job_id", "applicant_name", "email", "phone", "cover_letter", "resume", "status", "is_general"], "Careers"],
  ["dealer_applications", "Dealer applications", ["business_name", "contact_person", "email", "phone", "address", "district", "upazila", "license", "status"], "Network"],
  ["dealer_orders", "Dealer orders", ["dealer_id", "items", "subtotal", "delivery_address", "district", "upazila", "notes", "payment_method", "payment_status", "status"], "Network"],
  ["messages", "Messages", ["name", "phone", "message"], "Communication"],
  ["dealers", "Dealers", ["name", "organization", "address", "district", "phone"], "Network"],
  ["sales_officers", "Sales officers", ["name", "designation", "area", "phone", "image"], "Network"],
  ["certifications", "Certifications", ["title", "description", "icon"], "Content"],
] as const;
type Section = typeof sections[number];
type Row = Record<string, unknown> & { id?: number };

const settingMeta: Record<string, { label: string; description: string; group: string; type?: "email" | "tel" | "url" }> = {
  site_title: { label: "Website name", description: "Shown in the public header, footer, and browser title.", group: "Branding" },
  phone: { label: "Phone number", description: "The main number customers see on the website and WhatsApp link.", group: "Contact information", type: "tel" },
  email: { label: "Email address", description: "The public email address customers can use to contact your team.", group: "Contact information", type: "email" },
  address: { label: "Office address", description: "Displayed in the contact section and website footer.", group: "Contact information" },
  facebook: { label: "Facebook URL", description: "Link used for your Facebook profile or company page.", group: "Social links", type: "url" },
  linkedin: { label: "LinkedIn URL", description: "Link used for your LinkedIn profile or company page.", group: "Social links", type: "url" },
};

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [active, setActive] = useState<Section[0] | "dashboard">("dashboard");
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const section = useMemo(() => sections.find((item) => item[0] === active) ?? sections[2], [active]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = rows.filter((row) => !normalizedQuery || JSON.stringify(row).toLowerCase().includes(normalizedQuery));
  const navigate = (next: Section[0] | "dashboard") => {
    setQuery("");
    setActive(next);
  };

  useEffect(() => { void fetch("/api/admin/auth").then((r) => r.json()).then((data: { authenticated: boolean }) => setAuthenticated(data.authenticated)); }, []);
  useEffect(() => { if (authenticated && active !== "dashboard") void load(active); }, [active, authenticated]);

  async function load(table: string) {
    setLoading(true);
    const response = await fetch(`/api/admin/data?table=${table}`);
    const data = response.ok ? await response.json() as Row[] : [];
    setRows(data);
    setCounts((old) => ({ ...old, [table]: data.length }));
    setLoading(false);
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
    if (response.ok && data.url) {
      const label = event.currentTarget.closest("label");
      const urlInput = label?.querySelector<HTMLInputElement>("input[type='text']");
      if (urlInput) {
        urlInput.value = data.url;
        urlInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    event.currentTarget.value = "";
  }
  function renderSettings() {
    const groupedRows = rows.reduce<Record<string, Row[]>>((groups, row) => {
      const key = String(row.setting_key ?? "");
      const group = settingMeta[key]?.group ?? "Other settings";
      (groups[group] ??= []).push(row);
      return groups;
    }, {});
    return <div className="admin-settings">
      <div className="admin-settings-intro">
        <div><p className="admin-eyebrow">Configuration</p><h3>Keep your website information up to date</h3><span>These details appear across your public pages. Save each card after making changes.</span></div>
        <span className="admin-settings-tip">Changes publish immediately</span>
      </div>
      {Object.entries(groupedRows).map(([group, groupRows]) => {
        const matchingRows = groupRows.filter((row) => !normalizedQuery || JSON.stringify(row).toLowerCase().includes(normalizedQuery));
        if (!matchingRows.length) return null;
        return <section className="admin-settings-group" key={group}>
        <div className="admin-settings-group-heading"><h3>{group}</h3><span>{groupRows.length} {groupRows.length === 1 ? "setting" : "settings"}</span></div>
        <div className="admin-settings-grid">{matchingRows.map((row) => {
          const key = String(row.setting_key ?? "");
          const meta = settingMeta[key] ?? { label: key.replaceAll("_", " "), description: "Custom website setting.", group };
          return <form className="admin-setting-card" key={String(row.id)} onSubmit={(event) => save(event, row.id)}>
            <input type="hidden" name="setting_key" value={key} />
            <div className="admin-setting-card-heading"><label htmlFor={`setting-${row.id}`}>{meta.label}</label><span>{key}</span></div>
            <p>{meta.description}</p>
            <input id={`setting-${row.id}`} name="setting_value" type={meta.type ?? "text"} defaultValue={String(row.setting_value ?? "")} />
            <button className="btn btn-primary">Save setting</button>
          </form>;
        })}</div>
      </section>;
      })}
      {!rows.length && <div className="admin-empty"><strong>No site settings found</strong><p>Add a setting below to configure your website.</p></div>}
      {!!rows.length && normalizedQuery && !filteredRows.length && <div className="admin-empty"><strong>No matching settings</strong><p>Try a different search term or clear the search filter.</p></div>}
    </div>;
  }
  function renderField(field: string, value?: unknown) {
    const isLongText = field === "content" || field === "description" || field === "message" || field === "cover_letter";
    const isMedia = field === "image" || field === "icon";
    if (isMedia) return <label key={field}>{field.replaceAll("_", " ")}<input type="text" name={field} defaultValue={String(value ?? "")} placeholder="Upload an image or paste a URL" /><span className="admin-media-upload"><input type="file" accept="image/*" onChange={upload} /><small>Choose image from device</small></span></label>;
    if (isLongText) return <label key={field}>{field.replaceAll("_", " ")}<textarea name={field} rows={3} defaultValue={String(value ?? "")} /></label>;
    return <label key={field}>{field.replaceAll("_", " ")}<input name={field} defaultValue={String(value ?? "")} /></label>;
  }
  if (authenticated === null) return <p>Checking admin access…</p>;
  if (!authenticated) return <div className="admin-login"><div className="admin-login-card"><Image className="admin-logo" src="/images/admin-logo.png" alt="Try Agro Chemical Ltd" width={220} height={164} /><h2>Welcome back</h2><p>Sign in to manage your Try Agro Chemical website.</p><form className="contact-form" onSubmit={login}><label>Username<input name="username" required autoComplete="username" placeholder="Enter your username" /></label><label>Password<input name="password" type="password" required autoComplete="current-password" placeholder="Enter your password" /></label><button className="btn btn-primary">Sign in to dashboard</button>{message && <p className="admin-error">{message}</p>}</form></div></div>;
  const groups = [...new Set(sections.map((item) => item[3]))];
  return <div className="admin-shell">
    <aside className="admin-sidebar"><div className="admin-sidebar-brand"><Image className="admin-sidebar-logo" src="/images/admin-logo.png" alt="Try Agro Chemical Ltd" width={174} height={130} /><small>Site control panel</small></div><button className={`admin-nav-overview ${active === "dashboard" ? "active" : ""}`} onClick={() => navigate("dashboard")}>Dashboard</button>{groups.map((group) => <div className="admin-nav-group" key={group}><small>{group}</small>{sections.filter((item) => item[3] === group).map(([key, label]) => <button className={active === key ? "active" : ""} key={key} onClick={() => navigate(key)}><span>{label}</span>{counts[key] !== undefined && <small>{counts[key]}</small>}</button>)}</div>)}<label className="admin-upload">Upload image<input type="file" accept="image/*" onChange={upload} /></label><button className="admin-signout" onClick={async () => { await fetch("/api/admin/auth", { method: "DELETE" }); setAuthenticated(false); }}>Sign out</button></aside>
    <div className="admin-main"><header className="admin-topbar"><div><p className="admin-eyebrow">Administration</p><h1>{active === "dashboard" ? "Dashboard" : section[1]}</h1></div><a className="admin-view-site" href="/" target="_blank" rel="noreferrer">View website ↗</a></header>{active === "dashboard" ? <div className="admin-dashboard"><p className="admin-intro">Manage your website content, catalog, careers, and customer communication from one place.</p><div className="admin-stat-grid">{sections.slice(0, 6).map(([key, label]) => <button className="admin-stat-card" key={key} onClick={() => navigate(key)}><span>{label}</span><strong>{counts[key] ?? "—"}</strong><small>Manage {label.toLowerCase()} →</small></button>)}</div><div className="admin-quick-actions"><h2>Quick actions</h2><button className="btn btn-primary" onClick={() => navigate("products")}>Add product</button><button className="btn btn-outline" onClick={() => navigate("pages")}>Edit website content</button><button className="btn btn-outline" onClick={() => navigate("jobs")}>Post a job</button></div></div> : <div className="admin-content"><div className="admin-section-heading"><div><p>{section[3]} management</p><h2>{section[1]}</h2></div><button className="admin-refresh" type="button" onClick={() => load(active)} disabled={loading} aria-busy={loading} title={`Refresh ${section[1].toLowerCase()}`}><span className="admin-refresh-icon" aria-hidden="true">↻</span>{loading ? "Refreshing..." : "Refresh"}</button></div><div className="admin-toolbar"><div className="admin-search"><span className="admin-search-icon" aria-hidden="true">⌕</span><input type="search" aria-label={`Search ${section[1]}`} placeholder={`Search ${section[1].toLowerCase()}...`} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }} /><button className={`admin-search-clear${query ? " visible" : ""}`} type="button" aria-label="Clear search" onClick={() => setQuery("")}>×</button></div><span className="admin-result-count">{normalizedQuery ? `${filteredRows.length} matching` : `${rows.length} total`} {rows.length === 1 ? "record" : "records"}</span></div>{message && <p className="admin-status">{message}</p>}{active === "settings" ? renderSettings() : <><form className="contact-form admin-form" onSubmit={(event) => save(event)}><h3>Add new {section[1].toLowerCase().replace(/s$/, "")}</h3>{section[2].map((field) => renderField(field))}<button className="btn btn-primary">Add record</button></form>{loading ? <p className="admin-empty">Loading records…</p> : <div className="admin-table">{filteredRows.map((row) => <article key={String(row.id)}><div className="admin-record-header"><strong>Record #{row.id}</strong><span>{String(row.updated_at ?? row.created_at ?? "")}</span></div><form onSubmit={(event) => save(event, row.id)}>{section[2].map((field) => renderField(field, row[field]))}<div className="admin-record-actions"><button className="btn btn-primary">Save changes</button><button type="button" className="admin-danger" onClick={() => remove(row.id!)}>Delete</button></div></form></article>)}</div>}{!loading && !filteredRows.length && <div className="admin-empty"><strong>{normalizedQuery ? "No matching records" : "No records found"}</strong><p>{normalizedQuery ? "Try a different search term or clear the filter." : "Add your first record above."}</p></div>}</>}</div>}</div>
  </div>;
}
