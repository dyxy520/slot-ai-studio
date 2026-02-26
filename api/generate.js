export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { baseURL, apiKey, model, messages } = req.body;

    if (!baseURL || !apiKey || !model || !messages) {
      return res.status(400).json({ error: "Missing parameters" });
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
      providerResponse: data
    });

  } catch (error) {
    return res.status(500).json({
      error: "Provider request failed",
      details: error.message
    });
  }
}
