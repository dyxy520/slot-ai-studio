// Serverless Function: /api/generate
// 功能：根据文本和参考文件生成策划案 / UI 提示词
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false } // 关闭默认 bodyParser，方便处理文件上传
};

export default async function handler(req, res) {
  // -------------------------------
  // 跨域设置
  // -------------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    // -------------------------------
    // 解析表单，包括文件和文本字段
    // -------------------------------
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: "解析表单失败", details: err.message });

      const { model, messages, baseURL, apiKey } = fields;

      // -------------------------------
      // 如果上传了参考文件，把文件内容加入 prompt
      // -------------------------------
      let referenceText = "";
      if (files.referenceFile) {
        const uploadedFile = files.referenceFile;
        referenceText = fs.readFileSync(uploadedFile.filepath, "utf-8");
        messages.push({
          role: "user",
          content: `请参考以下策划文本的格式和风格生成新的策划案：\n${referenceText}`
        });
      }

      // -------------------------------
      // 调用 AI Provider API
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

      // -------------------------------
      // 解析返回内容
      // -------------------------------
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
