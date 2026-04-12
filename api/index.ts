import { appPromise } from '../server';

export default async (req: any, res: any) => {
  const app = await appPromise;
  app(req, res);
};
