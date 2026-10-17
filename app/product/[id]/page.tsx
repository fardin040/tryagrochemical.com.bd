import Image from "next/image"; import { notFound } from "next/navigation"; import { products } from "../../../lib/data";
export function generateStaticParams() {
  return products.map((product) => ({ id: String(product.id) }));
}
export const dynamicParams = false;
export default async function Product({params}:{params:Promise<{id:string}>}){const {id}=await params; const p=products.find(x=>x.id===Number(id)); if(!p) notFound(); return <main><section className="product-detail"><h2>{p.name}</h2><div className="product-image-wrapper">{p.image&&<Image src={p.image} alt={p.name} width={400} height={200}/>}</div><p className="product-category">{p.category}</p><p>{p.description}</p></section></main>}
