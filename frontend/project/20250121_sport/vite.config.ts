import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vite";
import { createProjectConfig } from "../../vite.config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const devSpaFallback = () => ({
  name: "dev-spa-fallback",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (!req.url) {
        next();
        return;
      }
      const pathname = req.url.split("?")[0] ?? "";
      if (pathname === "/shop" || pathname.startsWith("/shop/")) {
        req.url = "/shop.html";
      } else if (pathname === "/" || pathname === "/index") {
        req.url = "/index.html";
      }
      next();
    });
  },
});

const baseConfig = createProjectConfig({
  projectRoot,
  entry: {
    index: path.resolve(projectRoot, "./index.html"),
    shop: path.resolve(projectRoot, "./shop.html"),
  },
});

export default defineConfig((env) =>
  mergeConfig(
    typeof baseConfig === "function" ? baseConfig(env) : baseConfig,
    {
      plugins: [devSpaFallback()],
    },
  ),
);
