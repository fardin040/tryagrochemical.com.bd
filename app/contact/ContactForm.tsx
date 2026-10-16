"use client";
import { useState } from "react";
export default function ContactForm() { const [status,setStatus]=useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setStatus("Sending…"); const data=Object.fromEntries(new FormData(e.currentTarget)); const r=await fetch("/api/messages",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)}); setStatus(r.ok?"Message sent successfully.":"Unable to send right now."); }
  return <form className="contact-form" onSubmit={submit}><label>Your Name</label><input name="name" required/><label>Contact Number</label><input name="phone" required/><label>Your Message</label><textarea name="message" rows={4} required/><button className="btn btn-primary" type="submit">Send Message</button>{status&&<p>{status}</p>}</form>;
}
