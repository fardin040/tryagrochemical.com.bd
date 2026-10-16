import { pages, settings } from "../../lib/data";
import ContactForm from "./ContactForm";
export default function Contact(){return <main><section dangerouslySetInnerHTML={{__html:pages.contact.content}}/><section className="contact-grid"><div className="contact-card"><h3>📩 Send us a Message</h3><ContactForm/></div><div className="contact-card contact-info"><h3>📍 Contact Information</h3><p>📞 {settings.phone}</p><p>✉️ {settings.email}</p><p>🏢 {settings.address}</p></div></section></main>}
