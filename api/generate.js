export async function POST(request) {
  try {
    const body = await request.json();
    const { baseURL, apiKey, model, messages } = body;

    if (!baseURL || !apiKey || !model || !messages) {
      return new Response(
        JSON.stringify({ error: "Missing parameters" }),
        { status: 400 }
      );
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

    return new Response(
      JSON.stringify({
        success: true,
        providerResponse: data
      }),
      { status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Provider request failed",
        details: error.message
      }),
      { status: 500 }
    );
  }
}
