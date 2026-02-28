// /api/generate-image.js
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
    const { tool, prompt, params } = req.body;

    if (!tool || !prompt) {
      return res.status(400).json({
        success: false,
        error: "缺少必要参数：tool 和 prompt"
      });
    }

    console.log(`正在调用 ${tool} API...`);
    console.log('提示词:', prompt);
    console.log('参数:', params);

    let imageUrl = null;
    let apiResponse = null;

    // 根据不同的工具调用相应的API
    switch(tool) {
      case 'midjourney':
        // Midjourney 需要通过 Discord API 调用
        // 这里需要使用 Midjourney 的 API 或第三方服务
        const midjourneyApiKey = process.env.MIDJOURNEY_API_KEY;
        if (!midjourneyApiKey) {
          throw new Error('未配置 MIDJOURNEY_API_KEY');
        }
        
        // 示例：使用第三方 Midjourney API 服务
        const mjResponse = await fetch('https://api.midjourney.com/v1/imagine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${midjourneyApiKey}`
          },
          body: JSON.stringify({
            prompt: prompt,
            aspect_ratio: '16:9',
            stylize: params?.stylize || 100,
            weird: params?.weird || 0
          })
        });
        
        apiResponse = await mjResponse.json();
        imageUrl = apiResponse.image_url || apiResponse.url;
        break;

      case 'sd':
        // Stable Diffusion API 调用
        const sdApiKey = process.env.STABLE_DIFFUSION_API_KEY;
        if (!sdApiKey) {
          throw new Error('未配置 STABLE_DIFFUSION_API_KEY');
        }

        // 示例：使用 Stability AI API
        const sdResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sdApiKey}`
          },
          body: JSON.stringify({
            text_prompts: [{ text: prompt, weight: 1 }],
            cfg_scale: params?.cfg || 7,
            steps: params?.steps || 30,
            width: 1024,
            height: 1024
          })
        });

        const sdData = await sdResponse.json();
        if (sdData.artifacts && sdData.artifacts[0]) {
          // 返回的是base64图片
          imageUrl = `data:image/png;base64,${sdData.artifacts[0].base64}`;
        }
        break;

      case 'doubao':
        // 豆包 API 调用（字节跳动）
        const doubaoApiKey = process.env.DOUBAO_API_KEY;
        if (!doubaoApiKey) {
          throw new Error('未配置 DOUBAO_API_KEY');
        }

        const dbResponse = await fetch('https://api.doubao.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${doubaoApiKey}`
          },
          body: JSON.stringify({
            prompt: prompt,
            style: params?.style || '写实',
            quality: params?.quality || '标准',
            n: 1,
            size: '1024x1024'
          })
        });

        const dbData = await dbResponse.json();
        imageUrl = dbData.data?.[0]?.url;
        break;

      case 'jimeng':
        // 即梦 API 调用
        const jimengApiKey = process.env.JIMENG_API_KEY;
        if (!jimengApiKey) {
          throw new Error('未配置 JIMENG_API_KEY');
        }

        const jmResponse = await fetch('https://api.jimeng.ai/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jimengApiKey}`
          },
          body: JSON.stringify({
            prompt: prompt,
            style: params?.style || '写实',
            quality: params?.quality || '标准',
            n: 1
          })
        });

        const jmData = await jmResponse.json();
        imageUrl = jmData.images?.[0]?.url;
        break;

      case 'banbana':
        // Banbana Pro API 调用
        const banbanaApiKey = process.env.BANBANA_API_KEY;
        if (!banbanaApiKey) {
          throw new Error('未配置 BANBANA_API_KEY');
        }

        const bbResponse = await fetch('https://api.banbana.pro/v1/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${banbanaApiKey}`
          },
          body: JSON.stringify({
            prompt: prompt,
            style: params?.style || '写实',
            quality: params?.quality || '标准',
            width: 1024,
            height: 1024
          })
        });

        const bbData = await bbResponse.json();
        imageUrl = bbData.result?.url;
        break;

      default:
        throw new Error(`不支持的AI工具: ${tool}`);
    }

    if (!imageUrl) {
      throw new Error('API返回的图像URL为空');
    }

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      tool: tool
    });

  } catch (error) {
    console.error('图像生成失败:', error);
    return res.status(500).json({
      success: false,
      error: "图像生成失败",
      details: error.message
    });
  }
}
