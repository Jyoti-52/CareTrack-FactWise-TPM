
import { initializeApp } from "../src/server.js";

export default async function handler(req, res) {
  const app = await initializeApp();
  return app(req, res);
}
