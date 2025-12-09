import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getStrategicInsight = async (contextData: any, type: 'DASHBOARD' | 'SALES'): Promise<string> => {
  if (!apiKey) return "Wawasan AI tidak tersedia (Kunci API Hilang)";

  try {
    const modelId = 'gemini-2.5-flash';
    
    let prompt = "";
    
    if (type === 'DASHBOARD') {
      prompt = `
        Anda adalah Chief Financial Officer (CFO) yang sedang menganalisis data ERP.
        Analisis metrik JSON berikut dan berikan ringkasan eksekutif strategis dalam 2 kalimat bahasa Indonesia yang menyoroti risiko (seperti stok rendah atau DSO tinggi) dan peluang.
        Data: ${JSON.stringify(contextData)}
      `;
    } else {
      prompt = `
        Anda adalah Direktur Penjualan. Berdasarkan pelanggan saat ini dan barang di keranjang mereka, sarankan 1 item cross-sell spesifik atau tip negosiasi untuk menutup kesepakatan.
        Jawab dalam Bahasa Indonesia, singkat (di bawah 30 kata).
        Data: ${JSON.stringify(contextData)}
      `;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Tidak ada wawasan yang tersedia saat ini.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Tidak dapat menghasilkan wawasan saat ini.";
  }
};