// Serverless Function: /api/generate
// 功能：接收前端请求，调用 DeepSeek / 七牛 AI 接口，返回模型生成内容

export default async function handler(req, res) {
  // ✅ 设置跨域，允许前端网页调用
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理预检请求（OPTIONS）
  if (req.method === "OPTIONS") return res.status(200).end();

  // 只允许 POST 请求
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 从请求体获取参数
    const { model, messages } = req.body;

    // ⚠️ 这里填你在七牛 / DeepSeek 获取的 API Key
    const apiKey = "sk-367b04d6b9a8170fe6065263a3bf11bf17b6a3a8f5e39f446e168151d0f439a3";

    // ⚠️ AI API 基础地址
    const baseURL = "https://api.qnaigc.com/v1";

    // 调用 AI Provider 接口
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}` // Bearer Token 授权
      },
      body: JSON.stringify({
        model,      // 模型名称
        messages    // 聊天消息数组
      })
    });

    // 将返回结果解析为 JSON
    const data = await response.json();

    // -----------------------
    // 解析 content，兼容 DeepSeek 和七牛各种可能返回结构
    // -----------------------
    let content = "";

    // 最新 DeepSeek 返回路径
    if (data.choices && data.choices.length > 0) {
      content = data.choices[0].message?.content || data.choices[0].text || "";
    }

    // 老结构 / providerResponse 兼容
    if (!content && data.providerResponse?.choices?.length > 0) {
      content = data.providerResponse.choices[0].message?.content || data.providerResponse.choices[0].text || "";
    }

    // 如果仍然空，给提示文字
    if (!content) content = "模型没有返回任何内容";

    // 返回给前端
    return res.status(200).json({ success: true, content, usage: data.usage || {} });

  } catch (error) {
    // 捕获异常并返回给前端
    return res.status(500).json({
      error: "Provider request failed",
      details: error.message
    });
  }
}
