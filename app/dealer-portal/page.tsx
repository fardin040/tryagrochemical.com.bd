"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type Order = { id:number; items:string; subtotal:number; delivery_address:string; district:string; upazila:string; payment_method:string; payment_status:string; status:string; created_at:string };
export default function DealerPortal() {
  const router = useRouter(); const [dealer,setDealer] = useState<{business_name:string;contact_person:string}|null>(null); const [orders,setOrders]=useState<Order[]>([]); const [message,setMessage]=useState("");
  useEffect(()=>{ void fetch("/api/dealer/auth").then(r=>r.json()).then(async d=>{if(!d.authenticated){router.push("/login");return;}setDealer(d.dealer);const result=await fetch("/api/dealer/orders");setOrders(await result.json());});},[router]);
  async function logout(){await fetch("/api/dealer/auth",{method:"DELETE"});router.push("/login");}
  return <main><section><div className="portal-heading"><div><p className="admin-eyebrow">Dealer portal</p><h2>{dealer?.business_name ?? "Dealer account"}</h2><p>{dealer?.contact_person} · Orders and account status</p></div><button className="btn btn-outline" onClick={logout}>Sign out</button></div><div className="portal-actions"><a className="btn btn-primary" href="/products">Browse products</a></div><h3>Order history</h3>{message&&<p className="form-message">{message}</p>}{orders.length?<div className="order-list">{orders.map(order=><article className="order-card" key={order.id}><strong>Order #{order.id}</strong><span>{order.status} · {order.payment_method}</span><p>{order.delivery_address}, {order.upazila}, {order.district}</p><small>{new Date(order.created_at).toLocaleString()} · ৳{order.subtotal}</small></article>)}</div>:<div className="admin-empty">No orders yet. Browse products to place your first order.</div>}</section></main>;
}
