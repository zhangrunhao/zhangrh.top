import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

type Product = {
  id: string;
  name: string;
  price: string;
  blurb: string;
};

type Message = {
  id: string;
  title: string;
  status: string;
  preview: string;
};

const PRODUCTS: Product[] = [
  {
    id: "trail-001",
    name: "Trail Runner X1",
    price: "CNY 399",
    blurb: "Lightweight and responsive for daily miles.",
  },
  {
    id: "court-002",
    name: "Court Grip Pro",
    price: "CNY 329",
    blurb: "Stable base and extra ankle support.",
  },
  {
    id: "street-003",
    name: "Street Flex",
    price: "CNY 269",
    blurb: "Everyday comfort with breathable knit.",
  },
];

const MESSAGES: Message[] = [
  {
    id: "msg-1001",
    title: "Order #1001 Shipment",
    status: "Shipped",
    preview: "Your package left the warehouse and is on the way.",
  },
  {
    id: "msg-1002",
    title: "Order #1002 Processing",
    status: "Processing",
    preview: "We are preparing your items for dispatch.",
  },
  {
    id: "msg-1003",
    title: "Order #1003 Delivered",
    status: "Delivered",
    preview: "Package delivered. Enjoy your new gear.",
  },
];

const getBasePath = (pathname: string) => {
  const match = pathname.match(/^(.*)\/shop(?:\.html)?(?:\/.*)?$/);
  if (match) {
    const prefix = match[1] || "";
    const base = `${prefix}/shop`.replace(/\/{2,}/g, "/");
    return base === "" ? "/shop" : base;
  }
  return "/shop";
};

const normalizePath = (pathname: string, basePath: string) => {
  if (pathname.startsWith(basePath)) {
    return pathname.slice(basePath.length) || "/";
  }
  return pathname || "/";
};

const buildHref = (basePath: string, to: string) => {
  const next = to.startsWith("/") ? to : `/${to}`;
  return `${basePath}${next}`.replace(/\/{2,}/g, "/");
};

const App = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const basePath = useMemo(() => getBasePath(window.location.pathname), []);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const route = useMemo(() => {
    const relative = normalizePath(pathname, basePath).replace(/\/+$/, "");
    if (relative === "" || relative === "/") {
      return { name: "home" as const };
    }
    if (relative === "/product") {
      return { name: "product-list" as const };
    }
    if (relative.startsWith("/product/")) {
      const id = relative.split("/")[2];
      return { name: "product-detail" as const, id };
    }
    if (relative === "/message") {
      return { name: "message-list" as const };
    }
    if (relative.startsWith("/message/")) {
      const id = relative.split("/")[2];
      return { name: "message-detail" as const, id };
    }
    return { name: "not-found" as const };
  }, [pathname, basePath]);

  const navigate = (to: string) => {
    const href = buildHref(basePath, to);
    if (href === window.location.pathname) {
      return;
    }
    window.history.pushState(null, "", href);
    setPathname(window.location.pathname);
  };

  const Link = ({ to, children }: { to: string; children: ReactNode }) => {
    const href = buildHref(basePath, to);
    return (
      <a
        href={href}
        onClick={(event) => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }
          event.preventDefault();
          navigate(to);
        }}
        style={{ color: "#1a5fb4", textDecoration: "none" }}
      >
        {children}
      </a>
    );
  };

  const projectRoot = basePath.replace(/\/shop$/, "") || "/";
  const mainHref = buildHref(projectRoot, "/index");

  const selectedProduct =
    route.name === "product-detail"
      ? PRODUCTS.find((product) => product.id === route.id)
      : null;
  const selectedMessage =
    route.name === "message-detail"
      ? MESSAGES.find((message) => message.id === route.id)
      : null;

  return (
    <div
      style={{
        fontFamily:
          "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, sans-serif",
        margin: "0 auto",
        maxWidth: "920px",
        padding: "32px 24px 64px",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, fontSize: "14px", textTransform: "uppercase" }}>
          Sport Shop
        </p>
        <h1 style={{ margin: "8px 0 12px", fontSize: "36px" }}>
          Shop SPA Demo
        </h1>
        <p style={{ margin: 0, color: "#444" }}>
          Routes: <code>/</code>, <code>/message</code>,{" "}
          <code>/message/:id</code>, <code>/product</code>,{" "}
          <code>/product/:id</code>
        </p>
      </header>

      <nav
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "28px",
        }}
      >
        <Link to="/">Shop home</Link>
        <Link to="/message">Messages</Link>
        <Link to="/product">Products</Link>
        <Link to="/product/trail-001">Sample product</Link>
        <Link to="/message/msg-1001">Sample message</Link>
        <a href={mainHref} style={{ color: "#1a5fb4" }}>
          Index page
        </a>
      </nav>

      {route.name === "home" && (
        <section>
          <div
            style={{
              border: "1px solid #d0d7de",
              borderRadius: "16px",
              padding: "20px",
              background: "#f8f9fb",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ margin: "0 0 12px" }}>Shop overview</h2>
            <p style={{ margin: "0 0 8px" }}>
              Orders today: <strong>128</strong>
            </p>
            <p style={{ margin: "0 0 8px" }}>
              Pending shipments: <strong>12</strong>
            </p>
            <p style={{ margin: 0 }}>
              New messages: <strong>{MESSAGES.length}</strong>
            </p>
          </div>
          <div style={{ display: "grid", gap: "16px" }}>
            <article
              style={{
                border: "1px solid #d0d7de",
                borderRadius: "12px",
                padding: "16px",
                background: "#ffffff",
              }}
            >
              <h3 style={{ margin: "0 0 8px" }}>Shipment status</h3>
              <p style={{ margin: "0 0 12px", color: "#333" }}>
                Recent orders are shipping on schedule. No delays detected.
              </p>
              <Link to="/message">View messages</Link>
            </article>
            <article
              style={{
                border: "1px solid #d0d7de",
                borderRadius: "12px",
                padding: "16px",
                background: "#ffffff",
              }}
            >
              <h3 style={{ margin: "0 0 8px" }}>Top products</h3>
              <p style={{ margin: "0 0 12px", color: "#333" }}>
                Trail Runner X1 and Court Grip Pro are trending today.
              </p>
              <Link to="/product">Browse products</Link>
            </article>
          </div>
        </section>
      )}

      {route.name === "product-list" && (
        <section>
          <div style={{ display: "grid", gap: "16px" }}>
            {PRODUCTS.map((product) => (
              <article
                key={product.id}
                style={{
                  border: "1px solid #d0d7de",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#f8f9fb",
                }}
              >
                <h2 style={{ margin: "0 0 8px" }}>{product.name}</h2>
                <p style={{ margin: "0 0 6px", color: "#333" }}>
                  {product.blurb}
                </p>
                <p style={{ margin: "0 0 12px", fontWeight: 600 }}>
                  {product.price}
                </p>
                <Link to={`/product/${product.id}`}>View details</Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {route.name === "product-detail" && (
        <section>
          {selectedProduct ? (
            <article
              style={{
                border: "1px solid #d0d7de",
                borderRadius: "16px",
                padding: "24px",
                background: "#ffffff",
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: "28px" }}>
                {selectedProduct.name}
              </h2>
              <p style={{ margin: "0 0 12px", color: "#444" }}>
                {selectedProduct.blurb}
              </p>
              <p style={{ margin: "0 0 16px", fontWeight: 600 }}>
                {selectedProduct.price}
              </p>
              <button
                type="button"
                onClick={() => navigate("/product")}
                style={{
                  border: "none",
                  borderRadius: "999px",
                  padding: "10px 18px",
                  background: "#111827",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Back to list
              </button>
            </article>
          ) : (
            <div>
              <p style={{ marginBottom: "12px" }}>
                Product not found: <strong>{route.id}</strong>
              </p>
              <Link to="/product">Return to products</Link>
            </div>
          )}
        </section>
      )}

      {route.name === "message-list" && (
        <section>
          <div style={{ display: "grid", gap: "16px" }}>
            {MESSAGES.map((message) => (
              <article
                key={message.id}
                style={{
                  border: "1px solid #d0d7de",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#f8f9fb",
                }}
              >
                <h2 style={{ margin: "0 0 6px" }}>{message.title}</h2>
                <p style={{ margin: "0 0 6px", color: "#333" }}>
                  Status: <strong>{message.status}</strong>
                </p>
                <p style={{ margin: "0 0 12px", color: "#444" }}>
                  {message.preview}
                </p>
                <Link to={`/message/${message.id}`}>View message</Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {route.name === "message-detail" && (
        <section>
          {selectedMessage ? (
            <article
              style={{
                border: "1px solid #d0d7de",
                borderRadius: "16px",
                padding: "24px",
                background: "#ffffff",
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: "26px" }}>
                {selectedMessage.title}
              </h2>
              <p style={{ margin: "0 0 12px", color: "#333" }}>
                Status: <strong>{selectedMessage.status}</strong>
              </p>
              <p style={{ margin: "0 0 16px", color: "#444" }}>
                {selectedMessage.preview}
              </p>
              <button
                type="button"
                onClick={() => navigate("/message")}
                style={{
                  border: "none",
                  borderRadius: "999px",
                  padding: "10px 18px",
                  background: "#111827",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Back to messages
              </button>
            </article>
          ) : (
            <div>
              <p style={{ marginBottom: "12px" }}>
                Message not found: <strong>{route.id}</strong>
              </p>
              <Link to="/message">Return to messages</Link>
            </div>
          )}
        </section>
      )}

      {route.name === "not-found" && (
        <section>
          <p style={{ marginBottom: "12px" }}>
            Route not found. Try the shop home.
          </p>
          <Link to="/">Go to shop home</Link>
        </section>
      )}

      <footer style={{ marginTop: "40px", fontSize: "12px", color: "#666" }}>
        Current path: <code>{pathname}</code>
      </footer>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
