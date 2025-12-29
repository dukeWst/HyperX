// File: netlify/functions/chat.mjs
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function handler(event, context) {
  // 1. Chỉ chấp nhận method POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 2. Lấy dữ liệu từ Frontend gửi lên
    const { message, image, history } = JSON.parse(event.body);

    // 3. Lấy API Key từ biến môi trường Netlify
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing API Key" }) };
    }

    // 4. Khởi tạo Google AI (Dùng model 1.5 Flash từ dự án mới)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let result;
    if (image) {
      // Xử lý Gửi ảnh
      result = await model.generateContent([
        message,
        { inlineData: { data: image, mimeType: "image/jpeg" } }
      ]);
    } else {
      // Xử lý Chat Text
      let chat;
      if (history && history.length > 0) {
        // Map history cho đúng định dạng
        const validHistory = history.map(h => ({
          role: h.role === 'client' ? 'user' : (h.role === 'model' ? 'model' : 'user'),
          parts: h.parts
        }));
        chat = model.startChat({ history: validHistory });
      } else {
        chat = model.startChat();
      }
      result = await chat.sendMessage(message);
    }

    const response = await result.response;
    const text = response.text();

    // 5. Trả kết quả về (Thành công)
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    };

  } catch (error) {
    console.error("API Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
}