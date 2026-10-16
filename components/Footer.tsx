import Link from "next/link";
import { settings } from "../lib/data";
export default function Footer() {
  return <footer><div className="limit-width" style={{maxWidth:1200, margin:"0 auto", padding:"0 20px"}}><div className="footer-content">
    <div className="footer-col footer-about"><h3>{settings.siteTitle}</h3><p>Quality Agrochemical Solutions for Sustainable Farming. We are committed to providing the best products to our farmers.</p></div>
    <div className="footer-col footer-links"><h3>Quick Links</h3><ul><li><Link href="/">Home</Link></li><li><Link href="/about">About Us</Link></li><li><Link href="/products">Our Products</Link></li><li><Link href="/contact">Contact Us</Link></li></ul></div>
    <div className="footer-col footer-contact"><h3>Get In Touch</h3><ul><li>📍 {settings.address}</li><li>📞 {settings.phone}</li><li>✉️ {settings.email}</li></ul></div>
  </div></div><div className="footer-bottom"><div className="limit-width"><p>© {new Date().getFullYear()} {settings.siteTitle}. All rights reserved.</p></div></div>
  <a href={`https://wa.me/${settings.phone.replace(/\D/g,"")}`} className="whatsapp-float" target="_blank" rel="noreferrer" aria-label="WhatsApp">◔</a></footer>;
}
