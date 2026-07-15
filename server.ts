import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import app from "./api/index";

const PORT = 3000;

// Mount Vite middleware in development, and serve static built files in production.
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve client SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SRE Sentinel backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
