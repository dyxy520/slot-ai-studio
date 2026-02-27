// serverless function handler
export default async function handler(req, res) {

  // -------------------------------
  // CORS 跨域设置
  // -------------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // -------------------------------
  // 预检请求直接返回
  // -------------------------------
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // -------------------------------
  // 非 POST 请求拒绝
  // -------------------------------
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // -------------------------------
    // 从请求体获取参数
    // -------------------------------
    const { model, messages } = req.body;

    // -------------------------------
    // 服务器端安全存放 API Key 和 baseURL
    // -------------------------------
    const apiKey = "sk-367b04d6b9a8170fe6065263a3bf11bf17b6a3a8f5e39f446e168151d0f439a3"; // 替换成你自己的七牛/DeepSeek API Key
    const baseURL = "https://api.qnaigc.com/v1";

    // -------------------------------
    // 调用 AI Provider 接口
    // -------------------------------
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages })
    });

    // -------------------------------
    // 解析返回 JSON
    // -------------------------------
    const data = await response.json();

    // -------------------------------
    // 安全获取内容
    // -------------------------------
    const content = data.providerResponse?.choices?.[0]?.message?.content || "";
    const usage = data.providerResponse?.usage || {};

    // -------------------------------
    // 返回给前端
    // -------------------------------
    return res.status(200).json({
      success: true,
      content,
      usage
    });

  } catch (error) {
    // -------------------------------
    // 捕获异常返回 500
    // -------------------------------
    return res.status(500).json({
      error: "Provider request failed",
      details: error.message
    });
  }
}
