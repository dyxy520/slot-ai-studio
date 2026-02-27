// ========================================
// 稳定版 AI 生成接口
// 纯文本版本（不支持文件上传）
// 兼容 Vercel Serverless
// ========================================

export default async function handler(req, res) {
  // 允许跨域
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理预检请求
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 只允许 POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed"
    });
  }

  try {
    const { model, messages, baseURL, apiKey } = req.body;

    // -------------------------
    // 参数校验
    // -------------------------
    if (!model || !messages || !baseURL || !apiKey) {
      return res.status(400).json({
        success: false,
        error: "缺少必要参数"
      });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: "messages 必须是数组"
      });
    }

    // -------------------------
    // 调用 AI Provider
    // -------------------------
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7
      })
    });

    const text = await response.text();

    // 防止 AI 返回非 JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("AI 返回非 JSON:", text);
      return res.status(500).json({
        success: false,
        error: "AI 返回格式异常",
        raw: text
      });
    }

    const content =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      "模型未返回内容";

    return res.status(200).json({
      success: true,
      content,
      usage: data.usage || {}
    });

  } catch (error) {
    console.error("服务器错误:", error);

    return res.status(500).json({
      success: false,
      error: "服务器内部错误",
      details: error.message
    });
  }
}
