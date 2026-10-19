'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChefHat,
  Clock3,
  Coffee,
  Flame,
  Leaf,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  X,
} from 'lucide-react';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  popular: boolean;
  categoryId: string;
  categoryName?: string;
};
type Category = { id: string; name: string; items: MenuItem[] };
type DiningTable = { id: string; name: string; kind: string; seats: number; qrToken: string; status: string };
type CartItem = MenuItem & { quantity: number };

const money = (amount: number) => `$${amount.toFixed(2)}`;
const heroPhoto = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=88';

function photoFor(item: Pick<MenuItem, 'name' | 'categoryName'>) {
  const name = item.name.toLowerCase();
  if (name.includes('spring roll')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85';
  if (name.includes('wing')) return 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=900&q=85';
  if (name.includes('amok') || name.includes('curry')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=85';
  if (name.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85';
  if (name.includes('salmon') || name.includes('fish')) return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=85';
  if (name.includes('latte') || name.includes('coffee') || name.includes('espresso')) return 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85';
  if (name.includes('mango') || name.includes('smoothie')) return 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=900&q=85';
  if (name.includes('water') || name.includes('sparkling')) return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85';
  if ((item.categoryName || '').toLowerCase().includes('drink')) return 'https://images.unsplash.com/photo-1513558161293-cbeb765a2640?auto=format&fit=crop&w=900&q=85';
  return 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85';
}

function FoodPhoto({ item, large = false }: { item: Pick<MenuItem, 'name' | 'categoryName'>; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = photoFor(item);
  return (
    <div className={`food-photo relative overflow-hidden ${large ? 'food-photo-large' : ''}`}>
      {!failed ? (
        // External photos have a gradient fallback so the layout still looks polished offline.
        <img src={src} alt={item.name} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-emerald-100 text-emerald-900">
          <UtensilsCrossed size={large ? 52 : 36} strokeWidth={1.3} />
        </div>
      )}
      <div className="food-photo-shade" />
    </div>
  );
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [tableToken, setTableToken] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'success' | 'error'>('success');
  const [busy, setBusy] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [menuResponse, tableResponse] = await Promise.all([fetch('/api/menu'), fetch('/api/tables')]);
      if (menuResponse.ok) setCategories(await menuResponse.json());
      if (tableResponse.ok) setTables(await tableResponse.json());
    } catch {
      setMessageKind('error');
      setMessage('Could not connect to the menu service. Please refresh in a moment.');
    }
  }, []);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('table');
    if (token) setTableToken(token);
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const allItems = useMemo(
    () => categories.flatMap((group) => group.items.map((item) => ({ ...item, categoryName: group.name }))),
    [categories],
  );
  const popularItems = useMemo(() => allItems.filter((item) => item.popular && item.available), [allItems]);
  const filteredItems = useMemo(
    () => allItems.filter((item) => (category === 'All' || item.categoryName === category)
      && `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase().trim())),
    [allItems, category, query],
  );
  const cartItems = useMemo(() => Object.keys(cart)
    .filter((id) => cart[id] > 0)
    .map((id) => {
      const item = allItems.find((entry) => entry.id === id);
      return item ? { ...item, quantity: cart[id] } : null;
    })
    .filter(Boolean) as CartItem[], [allItems, cart]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const chosenTable = tables.find((table) => table.qrToken === tableToken);

  function changeQuantity(id: string, amount: number) {
    setCart((previous) => ({ ...previous, [id]: Math.max(0, (previous[id] || 0) + amount) }));
  }

  function addToCart(item: MenuItem) {
    setCart((previous) => ({ ...previous, [item.id]: (previous[item.id] || 0) + 1 }));
    setMessageKind('success');
    setMessage(`${item.name} added to your order.`);
  }

  async function placeOrder() {
    if (!tableToken) {
      setMessageKind('error');
      setMessage('Please select your table, or scan the QR code on it, before placing an order.');
      return;
    }
    if (!cartItems.length || busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableToken, items: cartItems.map((item) => ({ menuItemId: item.id, quantity: item.quantity })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Your order could not be sent. Please try again.');
      setCart({});
      setMessageKind('success');
      setMessage('Order sent to the kitchen. Thank you — we’ll get started!');
      setMobileCartOpen(false);
      await refresh();
    } catch (error) {
      setMessageKind('error');
      setMessage(error instanceof Error ? error.message : 'Your order could not be sent. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="customer-page min-h-screen">
      <div className="customer-topline"><span><span className="topline-dot" /> Freshly prepared, made for sharing</span><span className="hidden sm:inline">A lovely meal is just a few taps away</span></div>
      <header className="customer-header sticky top-0 z-30">
        <div className="customer-shell flex items-center justify-between gap-4 py-4 md:py-5">
          <a href="#top" className="brand-lockup" aria-label="Scan and Dine home">
            <span className="brand-mark"><UtensilsCrossed size={22} strokeWidth={1.8} /></span>
            <span><strong>scan<span>&</span>dine</strong><small>THE TABLE IS YOURS</small></span>
          </a>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <a className="customer-nav-link" href="#popular">Popular picks</a>
            <a className="customer-nav-link" href="#menu">Our menu</a>
            <a className="customer-nav-link" href="#experience">The experience</a>
          </nav>
          <button className="customer-cart-button" onClick={() => setMobileCartOpen(true)}>
            <ShoppingBag size={18} /><span className="hidden sm:inline">Your order</span><span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <div className="customer-shell">
        {message && <div role="status" className={`customer-alert ${messageKind === 'error' ? 'customer-alert-error' : ''}`}><span>{message}</span><button aria-label="Dismiss message" onClick={() => setMessage('')}><X size={17} /></button></div>}

        <section id="top" className="customer-hero">
          <div className="hero-copy">
            <div className="hero-eyebrow"><Sparkles size={15} /> GOOD FOOD, GOOD MOOD</div>
            <h1>A little taste of <em>something wonderful.</em></h1>
            <p>Fresh flavors, feel-good favorites, and the kind of meal you’ll want to come back for. Make yourself comfortable — we’ll take it from here.</p>
            <div className="hero-actions">
              <a href="#menu" className="primary-cta">Explore the menu <ArrowRight size={17} /></a>
              <a href="#popular" className="secondary-cta">See what’s popular <ArrowDownRight size={17} /></a>
            </div>
            <div className="hero-trust-row"><span><Leaf size={16} /> Made with care</span><span><Clock3 size={16} /> Ordered in seconds</span><span><ChefHat size={17} /> Straight to our kitchen</span></div>
          </div>
          <div className="hero-visual">
            <img className="hero-image" src={heroPhoto} alt="A beautifully presented restaurant meal ready to share" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
            <div className="hero-image-vignette" />
            <div className="hero-note hero-note-top"><span className="hero-note-icon"><Flame size={17} fill="currentColor" /></span><span><b>Made fresh</b><small>Just for your table</small></span></div>
            <div className="hero-note hero-note-bottom"><div className="mini-avatars"><span>✦</span><span>♡</span><span>⌁</span></div><span><b>Good food, no fuss</b><small>Scan · Choose · Enjoy</small></span></div>
            <div className="hero-photo-caption">A seat at our table, just for you.</div>
          </div>
        </section>

        <section className="table-bar" aria-label="Dining table selection">
          <div className="table-bar-leading"><span className="table-icon"><MapPin size={19} /></span><div><strong>{chosenTable ? `You’re ordering for ${chosenTable.name}` : 'Where are you sitting?'}</strong><small>{chosenTable ? 'Your order will go straight to your table.' : 'Scan your table QR, or choose your table below.'}</small></div></div>
          <label className="table-select-wrap"><span className="sr-only">Choose dining table</span><select value={tableToken} onChange={(event) => setTableToken(event.target.value)}><option value="">Choose your table</option>{tables.map((table) => <option key={table.id} value={table.qrToken}>{table.name}{table.kind === 'VIP' ? ' · VIP room' : ''}</option>)}</select><span className="table-select-chevron">⌄</span></label>
        </section>

        <section id="popular" className="popular-section scroll-mt-32">
          <div className="section-heading-row"><div><div className="section-eyebrow"><Sparkles size={15} /> THE CROWD-PLEASERS</div><h2>Popular <em>for a reason.</em></h2><p>Some things are just too good not to share.</p></div><a href="#menu" className="text-link hidden sm:inline-flex">Browse everything <ArrowRight size={16} /></a></div>
          {popularItems.length > 0 ? <div className="popular-grid">{popularItems.slice(0, 4).map((item, index) => <article key={item.id} className={`popular-card popular-card-${index + 1}`}>
            <FoodPhoto item={item} />
            <div className="popular-card-content"><div className="menu-meta"><span>{item.categoryName}</span><span className="favorite-tag"><Flame size={12} fill="currentColor" /> Guest favorite</span></div><h3>{item.name}</h3><p>{item.description || 'A delicious favorite, prepared fresh when you order.'}</p><div className="menu-card-bottom"><strong>{money(item.price)}</strong><button aria-label={`Add ${item.name} to your order`} className="round-add" onClick={() => addToCart(item)}><Plus size={19} /></button></div></div>
          </article>)}</div> : <div className="popular-empty"><span className="popular-empty-icon"><Sparkles size={22} /></span><div><strong>Our favorites are being prepared.</strong><p>Check back soon — the team is putting together the crowd-pleasers.</p></div></div>}
        </section>

        <section id="menu" className="menu-section scroll-mt-32">
          <div className="section-heading-row menu-heading-row"><div><div className="section-eyebrow"><UtensilsCrossed size={15} /> SOMETHING FOR EVERY CRAVING</div><h2>Made to be <em>enjoyed.</em></h2><p>Take a look around. Your next favorite might be right here.</p></div><div className="menu-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find your favorite..." aria-label="Search menu" />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button>}</div></div>
          <div className="category-tabs" role="group" aria-label="Filter menu by category"><button onClick={() => setCategory('All')} className={category === 'All' ? 'category-tab active' : 'category-tab'}>Everything <span>{allItems.length}</span></button>{categories.map((group) => <button key={group.id} onClick={() => setCategory(group.name)} className={category === group.name ? 'category-tab active' : 'category-tab'}>{group.name}<span>{group.items.length}</span></button>)}</div>
          {filteredItems.length ? <div className="menu-grid">{filteredItems.map((item) => <article key={item.id} className="menu-card">
            <FoodPhoto item={item} />
            <div className="menu-card-content"><div className="menu-meta"><span>{item.categoryName}</span>{item.popular && <span className="favorite-tag"><Flame size={12} fill="currentColor" /> Popular</span>}</div><h3>{item.name}</h3><p>{item.description || 'Prepared fresh for your table.'}</p><div className="menu-card-bottom"><strong>{money(item.price)}</strong><button className="add-button" onClick={() => addToCart(item)}><Plus size={16} /><span>Add</span></button></div></div>
          </article>)}</div> : <div className="menu-no-results"><Search size={28} /><strong>No dishes found</strong><p>Try a different search or choose another category.</p><button onClick={() => { setQuery(''); setCategory('All'); }}>Clear filters</button></div>}
        </section>

        <section id="experience" className="experience-banner scroll-mt-32"><div className="experience-art"><div className="experience-art-circle"><UtensilsCrossed size={45} strokeWidth={1.2} /></div><span className="experience-art-spark spark-one">✳</span><span className="experience-art-spark spark-two">✦</span></div><div className="experience-copy"><div className="section-eyebrow"><Leaf size={15} /> EASY AS IT SHOULD BE</div><h2>Your table. Your pace.<br /><em>Your kind of good.</em></h2><p>No app to download. No account to create. Just scan the code on your table, choose what looks good, and let us bring it to you.</p></div><div className="experience-steps"><div><span>01</span><b>Scan</b><small>Use your table’s QR code</small></div><div><span>02</span><b>Choose</b><small>Find your favorites</small></div><div><span>03</span><b>Enjoy</b><small>We’ll take it from here</small></div></div></section>

        <footer className="customer-footer"><a href="#top" className="brand-lockup"><span className="brand-mark"><UtensilsCrossed size={20} /></span><span><strong>scan<span>&</span>dine</strong><small>THE TABLE IS YOURS</small></span></a><p>Good things are meant to be shared. Thanks for being here.</p><span className="footer-status"><span className="topline-dot" /> Made fresh, served with care</span></footer>
      </div>

      <aside id="your-order" className={`order-panel ${mobileCartOpen ? 'order-panel-mobile-open' : ''}`} aria-label="Your order">
        <div className="order-panel-header"><div><span className="order-panel-kicker"><ShoppingBag size={13} /> YOUR SELECTION</span><h2>Your order<span>.</span></h2></div><button className="order-close-mobile" aria-label="Close order panel" onClick={() => setMobileCartOpen(false)}><X size={20} /></button><span className="order-number">{cartCount.toString().padStart(2, '0')}</span></div>
        <div className="order-table-summary"><MapPin size={15} /><span>{chosenTable ? chosenTable.name : 'Choose a table to place your order'}</span></div>
        {cartItems.length === 0 ? <div className="empty-cart"><div className="empty-cart-illustration"><ShoppingBag size={28} strokeWidth={1.3} /></div><strong>Your next favorite starts here.</strong><p>Add something delicious from the menu and it’ll show up here.</p><a href="#menu" onClick={() => setMobileCartOpen(false)}>Explore the menu <ArrowRight size={14} /></a></div> : <div className="cart-lines">{cartItems.map((item) => <div key={item.id} className="cart-line"><FoodPhoto item={item} /><div className="cart-line-main"><strong>{item.name}</strong><small>{money(item.price)} each</small><div className="quantity-control"><button aria-label={`Remove one ${item.name}`} onClick={() => changeQuantity(item.id, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label={`Add one ${item.name}`} onClick={() => changeQuantity(item.id, 1)}><Plus size={13} /></button></div></div><strong className="cart-line-total">{money(item.price * item.quantity)}</strong></div>)}</div>}
        <div className="order-panel-footer"><div className="subtotal-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="order-footnote"><Check size={14} /> No payment needed right now</div><button disabled={!cartItems.length || busy} onClick={placeOrder} className="checkout-button"><span>{busy ? 'Sending your order…' : 'Send order to kitchen'}</span><ArrowRight size={18} /></button><p>Payment is handled by our service team at the restaurant.</p></div>
      </aside>
      {mobileCartOpen && <button className="mobile-cart-backdrop" aria-label="Close order panel" onClick={() => setMobileCartOpen(false)} />}
      {cartCount > 0 && !mobileCartOpen && <button className="mobile-cart-fab" onClick={() => setMobileCartOpen(true)}><ShoppingBag size={18} /> View order <span>{cartCount}</span><strong>{money(subtotal)}</strong></button>}
    </main>
  );
}
