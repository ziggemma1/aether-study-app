import { appPromise } from '../server';

console.log("[API_INDEX] Vercel function invoked.");

export default async (req: any, res: any) => {
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    console.error("[API_INDEX_FATAL]", err);
    res.status(500).json({ error: "Failed to initialize app", details: err.message });
  }
};
