import { appPromise } from '../server.js';

export default async (req: any, res: any) => {
  try {
    const app = await appPromise;
    app(req, res);
  } catch (error: any) {
    console.error('Vercel Function Error:', error);
    res.status(500).json({
      message: 'Internal Server Error in Vercel Function',
      error: error.message,
      stack: error.stack
    });
  }
};
