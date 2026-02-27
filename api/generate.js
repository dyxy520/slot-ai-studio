export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed"
    });
  }

  try {

    const { model, messages } = req.body;

    const apiKey = process.env.DEEPSEEK_KEY;
    const baseURL = "https://api.qnaigc.com/v1";

    if (!apiKey) {
      throw new Error("未配置 DEEPSEEK_KEY");
    }

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
      content: data.choices?.[0]?.message?.content || "",
      usage: data.usage || {}
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      error: "服务器内部错误",
      details: error.message
    });

  }
}
