export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理OPTIONS请求
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "只支持POST请求"
    });
  }

  try {
    const { model, messages } = req.body;

    if (!model || !messages) {
      return res.status(400).json({
        success: false,
        error: "缺少必要参数：model 和 messages"
      });
    }

    // 从环境变量获取API密钥
    const apiKey = process.env.DEEPSEEK_KEY;
    
    if (!apiKey) {
      console.error("DEEPSEEK_KEY 环境变量未设置");
      return res.status(500).json({
        success: false,
        error: "服务器配置错误：未找到API密钥"
      });
    }

    console.log("API密钥前几位:", apiKey.substring(0, 10) + "...");
    console.log("使用的模型:", model);

    const baseURL = "https://api.qnaigc.com/v1";

    // 调用API
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();

    // 检查API响应
    if (!response.ok) {
      console.error("API错误状态:", response.status);
      console.error("API错误详情:", data);
      
      // 更详细的错误信息
      return res.status(response.status).json({
        success: false,
        error: "API调用失败",
        details: data.error?.message || JSON.stringify(data),
        status: response.status
      });
    }

    // 检查响应格式
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("API返回格式错误:", data);
      return res.status(500).json({
        success: false,
        error: "API返回格式错误",
        details: data
      });
    }

    // 返回成功响应
    return res.status(200).json({
      success: true,
      content: data.choices[0].message.content,
      usage: data.usage || {}
    });

  } catch (error) {
    console.error("服务器错误:", error);
    
    return res.status(500).json({
      success: false,
      error: "生成失败",
      details: error.message
    });
  }
}
