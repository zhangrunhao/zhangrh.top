import { createRoot } from "react-dom/client";

const getProjectRoot = (pathname: string) => {
  const match = pathname.match(/^(.*)\/index(?:\.html)?$/);
  if (match) {
    return match[1] || "";
  }
  return "";
};

const App = () => {
  const projectRoot = getProjectRoot(window.location.pathname);
  const shopBase = `${projectRoot}/shop`.replace(/\/{2,}/g, "/");
  const shopList = `${shopBase}/product`.replace(/\/{2,}/g, "/");
  const shopDetail = `${shopBase}/product/trail-001`.replace(/\/{2,}/g, "/");

  return (
    <div
      style={{
        fontFamily:
          "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, sans-serif",
        margin: "0 auto",
        maxWidth: "820px",
        padding: "32px 24px 64px",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, fontSize: "14px", textTransform: "uppercase" }}>
          Sport Project
        </p>
        <h1 style={{ margin: "8px 0 12px", fontSize: "34px" }}>
          Index Page
        </h1>
        <p style={{ margin: 0, color: "#444" }}>
          This page links into the Shop SPA routes.
        </p>
      </header>

      <section
        style={{
          border: "1px solid #d0d7de",
          borderRadius: "16px",
          padding: "20px",
          background: "#f8f9fb",
        }}
      >
        <h2 style={{ margin: "0 0 12px" }}>Quick links</h2>
        <p style={{ margin: "0 0 8px" }}>
          <a href={shopList} style={{ color: "#1a5fb4" }}>
            Shop product list
          </a>
        </p>
        <p style={{ margin: 0 }}>
          <a href={shopDetail} style={{ color: "#1a5fb4" }}>
            Shop product detail
          </a>
        </p>
      </section>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
