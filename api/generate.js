async function generate() {

  try {

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v3.2-251201",
        baseURL: "https://api.qnaigc.com/v1",
        apiKey: "sk-367b04d6b9a8170fe6065263a3bf11bf17b6a3a8f5e39f446e168151d0f439a3",
        messages: [
          { role: "user", content: "你好" }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error("HTTP错误: " + response.status + " " + text);
    }

    const data = await response.json();

    console.log("成功返回:", data);

  } catch (err) {
    console.error("请求出错:", err);
  }
}
