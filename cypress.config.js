import { defineConfig } from "cypress";
import fs from "fs";
import path from "path";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_baseUrl || "http://localhost:5173",
    env: {
      apiBaseUrl: process.env.CYPRESS_API_BASE_URL || "http://localhost:3087"
    },
    setupNodeEvents(on, config) {
      on("task", {
        writeScore({ filePath, data }) {
          const abs = path.resolve(filePath);
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, JSON.stringify(data, null, 2), "utf-8");
          return null;
        }
      });
      return config;
    }
  }
});
