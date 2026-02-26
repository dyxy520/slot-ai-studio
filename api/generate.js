export default async function handler(req, res) {

  // ✅ 允许跨域
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理浏览器预检请求
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { baseURL, apiKey, model, messages } = req.body;

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    });

    const data = await response.json();

    return res.status(200).json({
      success: true,
      providerResponse: data
    });

  } catch (error) {
    return res.status(500).json({
      error: "Provider request failed",
      details: error.message
    });
  }
}
