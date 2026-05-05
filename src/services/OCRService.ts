export async function extractTextFromImage(image: string | File | HTMLCanvasElement): Promise<string> {
  try {
    const Tesseract = (await import('tesseract.js')).default;
    const { data: { text } } = await Tesseract.recognize(
      image,
      'eng',
      { logger: m => console.log(m) }
    );
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image.');
  }
}
