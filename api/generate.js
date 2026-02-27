// Serverless Function: /api/generate
// 功能：处理前端请求，包括文本生成和文件分析
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false // 关闭默认 bodyParser，方便处理文件上传
  }
};

export default async function handler(req, res) {
  // -------------------------------
  // 允许跨域
  // -------------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    // -------------------------------
    // 判断是否上传了文件
    // -------------------------------
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: "解析表单失败", details: err.message });
      }

      // 获取前端传来的参数
      const { model, messages, baseURL, apiKey } = fields;

      // -------------------------------
      // 如果上传了文件，读取文件内容并添加到 prompt
      // -------------------------------
      let fileContent = "";
      if (files.uploadFile) {
        const uploadedFile = files.uploadFile;
        fileContent = fs.readFileSync(uploadedFile.filepath, "utf-8");
        messages.push({
          role: "user",
          content: `请分析以下文件内容：\n${fileContent}`
        });
      }

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

      const data = await response.json();

      // 解析返回内容
      let content = "";
      if (data.choices && data.choices.length > 0) {
        content = data.choices[0].message?.content || data.choices[0].text || "";
      } else if (!content && data.providerResponse?.choices?.length > 0) {
        content = data.providerResponse.choices[0].message?.content || data.providerResponse.choices[0].text || "";
      }

      if (!content) content = "模型没有返回内容";

      return res.status(200).json({ success: true, content, usage: data.usage || {} });
    });

  } catch (error) {
    return res.status(500).json({
      error: "Provider request failed",
      details: error.message
    });
  }
}
