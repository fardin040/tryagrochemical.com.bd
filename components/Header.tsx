import Link from "next/link";
import Image from "next/image";
import { settings } from "../lib/data";

export default function Header() {
  return <>
    <header className="site-header"><div className="limit-width"><div className="logo-box">
      <Link href="/"><Image src="/images/logo.png" alt={`${settings.siteTitle} Logo`} width={60} height={60} /></Link>
      <div><h1>{settings.siteTitle}</h1><p>Quality Agrochemical Solutions for Sustainable Farming</p></div>
    </div></div></header>
    <nav><div className="limit-width"><div className="nav-links">
      <Link href="/">Home</Link><Link href="/about">About Us</Link><Link href="/products">Products</Link>
      <div className="dropdown"><Link href="/dealers">Distribution Network ▼</Link><div className="dropdown-content">
        <Link href="/dealers">Dealer List</Link><Link href="/sales-officers">Sales Officers</Link>
      </div></div>
      <Link href="/careers">Careers</Link><Link href="/contact">Contact</Link>
    </div></div></nav>
  </>;
}
