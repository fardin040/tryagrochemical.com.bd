"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";

const fields = [["businessName","Business name"],["contactPerson","Contact person"],["email","Email"],["phone","Phone"],["address","Address"],["district","District"],["upazila","Upazila"],["license","Trade license"],["password","Password"]] as const;
export default function LoginPage() {
  const [mode, setMode] = useState<"login"|"apply">("login"); const [role, setRole] = useState<"dealer"|"admin">("dealer"); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = Object.fromEntries(new FormData(event.currentTarget));
    const endpoint = mode === "login" ? role === "admin" ? "/api/admin/auth" : "/api/dealer/auth" : "/api/dealer/apply";
    const response = await fetch(endpoint, { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify(form) });
    const data = await response.json() as { error?: string };
    if (response.ok) { setMessage(mode === "login" ? "Signed in. Redirecting…" : "Application submitted. An administrator will review it."); if (mode === "login") window.location.href = role === "admin" ? "/admin" : "/dealer-portal"; event.currentTarget.reset(); }
    else setMessage(data.error ?? "Unable to continue.");
  }
  return <main><section className="auth-card"><p className="admin-eyebrow">Partner access</p><h2>{mode === "login" ? "Admin / Dealer login" : "Apply to become a dealer"}</h2><p>Dealer accounts are created only after administrator approval.</p>
    <div className="auth-tabs"><button className={mode==="login"?"active":""} onClick={()=>{setMode("login");setMessage("")}}>Sign in</button><button className={mode==="apply"?"active":""} onClick={()=>{setMode("apply");setMessage("")}}>Dealer application</button></div>
    <form onSubmit={submit} className="stack-form">{mode==="login" ? <><label>Account type<select name="role" value={role} onChange={(event)=>setRole(event.target.value as "dealer"|"admin")}><option value="dealer">Dealer</option><option value="admin">Administrator</option></select></label><label>{role === "admin" ? "Username" : "Email"}<input name={role === "admin" ? "username" : "email"} type={role === "admin" ? "text" : "email"} required /></label><label>Password<input name="password" type="password" required /></label><button className="btn btn-primary">Sign in</button></> : <>{fields.map(([name,label])=><label key={name}>{label}<input name={name} type={name==="email"?"email":name==="password"?"password":"text"} required /></label>)}<button className="btn btn-primary">Submit application</button></>}</form>{message&&<p className="form-message">{message}</p>}</section></main>;
}
