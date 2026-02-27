// =============================
// 生产级 AI 生成接口
// 支持 txt / json / xlsx
// 自动解析 + 限流 + 错误保护
// =============================

import formidable from "formidable";
import fs from "fs";
import XLSX from "xlsx";

export const config = {
  api: {
    bodyParser: false
  }
};

// -------- 工具函数 --------

// 安全 JSON 解析
function safeJSONParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// 限制文本长度（防止 token 爆炸）
function limitText(text, maxLength = 12000) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "\n\n[内容过长已截断]";
}

// 解析上传文件
function parseUploadedFile(file) {
  const filename = file.originalFilename || "";
  const ext = filename.split(".").pop().toLowerCase();

  // ---------------- TXT ----------------
  if (ext === "txt") {
    const content = fs.readFileSync(file.filepath, "utf-8");
    return limitText(content);
  }

  // ---------------- JSON ----------------
  if (ext === "json") {
    const content = fs.readFileSync(file.filepath, "utf-8");
    const parsed = safeJSONParse(content);
    if (!parsed) throw new Error("JSON 文件格式错误");
    return limitText(JSON.stringify(parsed, null, 2));
  }

  // ---------------- XLSX ----------------
  if (ext === "xlsx") {
    const workbook = XLSX.readFile(file.filepath);

    let result = "";

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        defval: ""
      });

      if (jsonData.length === 0) return;

      // 只取前 30 行
      const sampleData = jsonData.slice(0, 30);

      result += `\n=== Sheet: ${sheetName} ===\n`;
      result += JSON.stringify(sampleData, null, 2);
      result += "\n";
    });

    return limitText(result);
  }

  throw new Error("不支持的文件格式，仅支持 txt / json / xlsx");
}

// -------- 主函数 --------

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = new formidable.IncomingForm({
    maxFileSize: 10 * 1024 * 1024 // 10MB
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("表单解析失败:", err);
      return res.status(400).json({
        success: false,
        error: "表单解析失败",
        details: err.message
      });
    }

    try {
      const { model, messages, baseURL, apiKey } = fields;

      if (!model || !baseURL || !apiKey) {
        return res.status(400).json({
          success: false,
          error: "缺少必要参数"
        });
      }

      // -------- 解析 messages --------
      const parsedMessages = safeJSONParse(messages);
      if (!parsedMessages || !Array.isArray(parsedMessages)) {
        return res.status(400).json({
          success: false,
          error: "messages 格式错误"
        });
      }

      // -------- 解析参考文件 --------
      if (files.referenceFile) {
        try {
          const fileContent = parseUploadedFile(files.referenceFile);

          parsedMessages.push({
            role: "user",
            content: `
请学习以下参考策划案格式和字段结构，然后按照该格式生成新的策划案：

${fileContent}

要求：
1. 保持字段结构一致
2. 输出结构清晰
3. 不要解释，只输出策划内容
`
          });

        } catch (fileError) {
          return res.status(400).json({
            success: false,
            error: "文件解析失败",
            details: fileError.message
          });
        }
      }

      // -------- 调用 AI --------
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: parsedMessages,
          temperature: 0.7
        })
      });

      const text = await response.text();

      const data = safeJSONParse(text);

      if (!data) {
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
      console.error("服务器内部错误:", error);

      return res.status(500).json({
        success: false,
        error: "服务器内部错误",
        details: error.message
      });
    }
  });
}
