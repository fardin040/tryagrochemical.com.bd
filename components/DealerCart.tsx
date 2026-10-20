"use client";

import { useEffect, useState } from "react";

type Product = { id: number; name: string };
type CartItem = Product & { quantity: number };
const CART_KEY = "try_dealer_cart";

function readCart(): CartItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]") as CartItem[];
    return Array.isArray(value) ? value.filter((item) => item?.id && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

export default function DealerCart({ product }: { product: Product }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sync = () => setCart(readCart());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("dealer-cart-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("dealer-cart-updated", sync);
    };
  }, []);

  function update(next: CartItem[]) {
    setCart(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("dealer-cart-updated"));
  }
  function add() {
    const existing = cart.find((item) => item.id === product.id);
    update(existing ? cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...cart, { ...product, quantity: 1 }]);
    setOpen(true);
  }
  function changeQuantity(id: number, quantity: number) {
    update(quantity > 0 ? cart.map((item) => item.id === id ? { ...item, quantity } : item) : cart.filter((item) => item.id !== id));
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/dealer/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      items: cart.map(({ id, name, quantity }) => ({ id, name, quantity })),
      subtotal: 0, deliveryAddress: data.deliveryAddress, district: data.district, upazila: data.upazila, notes: data.notes, paymentMethod: data.paymentMethod
    }) });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Order submitted successfully." : result.error ?? "Unable to place order.");
    if (response.ok) { update([]); event.currentTarget.reset(); }
  }
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  return <><button className="btn btn-primary" onClick={add}>Add to dealer cart</button>
    {open && <div className="modal-backdrop"><div className="checkout-card">
      <button type="button" className="modal-close" onClick={() => setOpen(false)}>×</button>
      <h3>Dealer cart ({count})</h3>
      {!cart.length ? <p>Your cart is empty.</p> : <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><span>{item.name}</span><input aria-label={`Quantity for ${item.name}`} type="number" min="1" value={item.quantity} onChange={(event) => changeQuantity(item.id, Number(event.target.value))} /><button type="button" onClick={() => changeQuantity(item.id, 0)}>Remove</button></div>)}</div>
        <form className="stack-form" onSubmit={submit}><label>Delivery address<textarea name="deliveryAddress" required /></label><label>District<input name="district" required /></label><label>Upazila<input name="upazila" required /></label><label>Notes<textarea name="notes" /></label><label>Payment<select name="paymentMethod" defaultValue="cod"><option value="cod">Cash on delivery</option><option value="sslcommerz">SSLCommerz online payment (currently unavailable)</option></select></label><button className="btn btn-primary">Place order</button></form></>}
      {message && <p className="form-message">{message}</p>}
    </div></div>}
  </>;
}
