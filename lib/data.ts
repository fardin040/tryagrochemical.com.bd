export type Product = { id: number; name: string; category: string; image?: string; description?: string };
export type Page = { title: string; content: string; metaDescription: string };

export const settings = {
  siteTitle: "Try Agro Chemical Ltd",
  phone: "+8801715731845",
  email: "info@tryagrochemical.com.bd",
  address: "Dhaka, Bangladesh",
  facebook: "https://facebook.com/",
  linkedin: "https://linkedin.com/"
};

export const products: Product[] = [
  { id: 1, name: "Agricultural solution", category: "Crop protection", image: "/uploads/1767790081_695e56011ca9b.png", description: "Reliable crop protection for modern farming." },
  { id: 2, name: "Crop nutrition", category: "Plant nutrition", image: "/uploads/1767862250_695f6feaa7707.png", description: "Balanced nutrition to support healthy yields." },
  { id: 3, name: "Field protection", category: "Fungicide", image: "/uploads/1771326180_69944ae4be3d4.jpg", description: "Field-tested performance for every crop cycle." }
];

export const pages: Record<string, Page> = {
  home: { title: "Home", content: "<h2>Welcome to Try Agro Chemical Ltd.</h2><p>Your trusted partner in sustainable agriculture.</p>", metaDescription: "Try Agro Chemical agricultural solutions." },
  about: { title: "About Us", content: "<h2>About Try Agro Chemical Ltd.</h2><p>We are a leading agrochemical company committed to quality products, responsible use, and sustainable farming in Bangladesh.</p>", metaDescription: "Learn about Try Agro Chemical Ltd." },
  contact: { title: "Contact Us", content: "<h2>Contact Us</h2><p>Get in touch with our team for product and agronomy support.</p>", metaDescription: "Contact Try Agro Chemical Ltd." }
};

export const certifications = [
  { icon: "✓", title: "Quality assured", description: "Reliable and verified agricultural products." },
  { icon: "🌱", title: "Sustainable focus", description: "Responsible solutions for healthier farms." }
];
export type Job = { id: number; title: string; location: string; type: string; description: string; deadline: string };
export const jobs: Job[] = [];
