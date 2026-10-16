import "./site.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { settings } from "../lib/data";

export const metadata = {
  title: `${settings.siteTitle} | Agrochemical Products`,
  description: "Quality agrochemical solutions for sustainable farming."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Header />{children}<Footer /></body></html>;
}
