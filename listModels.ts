import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.error('OPENROUTER_API_KEY is missing');
    return;
  }
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    const freeModels = response.data.data
      .filter((m: any) => m.pricing.prompt === '0' && m.pricing.completion === '0')
      .map((m: any) => m.id);
    console.log('FREE_MODELS_FOUND:', JSON.stringify(freeModels));
  } catch (err: any) {
    console.error('Error fetching models:', err.message);
  }
}
run();
