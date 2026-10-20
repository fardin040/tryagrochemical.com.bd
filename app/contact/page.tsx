import { getPage, getSettings } from "../../lib/db";
import ContactForm from "./ContactForm";
export const dynamic = "force-dynamic";
export default async function Contact(){const [page, settings] = await Promise.all([getPage("contact"), getSettings()]); return <main><section dangerouslySetInnerHTML={{__html:page?.content ?? ""}}/><section className="contact-grid"><div className="contact-card"><h3>📩 Send us a Message</h3><ContactForm/></div><div className="contact-card contact-info"><h3>📍 Contact Information</h3><p>📞 {settings.phone}</p><p>✉️ {settings.email}</p><p>🏢 {settings.address}</p></div></section></main>}
