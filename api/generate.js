export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理OPTIONS请求（预检请求）
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "只支持POST请求"
    });
  }

  try {
    const { model, messages } = req.body;

    // 验证必要参数
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

    const baseURL = "https://api.qnaigc.com/v1";

    console.log("正在调用API，模型:", model);

    // 调用DeepSeek API
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,  // 添加一些参数来控制输出
        max_tokens: 2000    // 限制输出长度
      })
    });

    const data = await response.json();

    // 检查API响应
    if (!response.ok) {
      console.error("API错误:", data);
      throw new Error(data.error?.message || `API请求失败 (${response.status})`);
    }

    // 检查响应格式
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("API返回格式错误:", data);
      throw new Error("API返回格式错误");
    }

    // 返回成功响应
    return res.status(200).json({
      success: true,
      content: data.choices[0].message.content,
      usage: data.usage || {}
    });

  } catch (error) {
    console.error("服务器错误:", error);
    
    // 返回错误信息
    return res.status(500).json({
      success: false,
      error: "生成失败",
      details: error.message
    });
  }
}
