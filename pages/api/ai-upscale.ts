import type { NextApiRequest, NextApiResponse } from 'next';
import Replicate from 'replicate';
import prisma from './globalprisma';
import { jwtDecode } from 'jwt-decode';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

function isAllowedDomain(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const allowed = ['digitaloceanspaces.com', 'openrouter.ai', 'replicate.delivery'];
    return allowed.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function getAuthenticatedUser(req: NextApiRequest): { id: number; username: string } | null {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach((c) => {
        const [k, v] = c.trim().split('=');
        if (k && v) cookies[k] = decodeURIComponent(v);
      });
    }
    const tokenStr = req.cookies?.authToken || cookies.authToken;
    if (!tokenStr) return null;
    const decoded = jwtDecode<{ id: number | string; username?: string }>(tokenStr);
    const parsedId = typeof decoded.id === 'string' ? parseInt(decoded.id, 10) : (decoded.id as number);
    if (!parsedId || isNaN(parsedId)) return null;
    return {
      id: parsedId,
      username: decoded.username || `user_${parsedId}`,
    };
  } catch {
    return null;
  }
}

// Comprehensive extractor for any OpenRouter Image API or Chat Completions format
function extractImageFromOpenRouterResponse(data: any): string | null {
  if (!data) return null;

  // 1. Direct data array (Standard Images API: { data: [{ url: "..." }] } or { data: [{ b64_json: "..." }] })
  if (Array.isArray(data.data) && data.data.length > 0) {
    const item = data.data[0];
    if (typeof item === 'string') return item;
    if (item.url) return item.url;
    if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
    if (item.image_url?.url) return item.image_url.url;
  }

  // 2. Direct images array ({ images: [...] })
  if (Array.isArray(data.images) && data.images.length > 0) {
    const img = data.images[0];
    if (typeof img === 'string') return img;
    if (img.url) return img.url;
    if (img.image_url?.url) return img.image_url.url;
  }

  const message = data.choices?.[0]?.message;
  if (message) {
    // 3. message.images array (OpenRouter multimodal output format)
    if (Array.isArray(message.images) && message.images.length > 0) {
      const img = message.images[0];
      if (typeof img === 'string') return img;
      if (img.url) return img.url;
      if (img.image_url?.url) return img.image_url.url;
    }

    // 4. message.content as Array of Parts
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === 'image_url' && part.image_url?.url) return part.image_url.url;
        if (part.type === 'image' && (part.url || part.image)) return part.url || part.image;
        if (typeof part.text === 'string' && part.text.startsWith('http')) return part.text.trim();
      }
    }

    // 5. message.content as String
    if (typeof message.content === 'string') {
      const content = message.content.trim();

      // Markdown image: ![...](https://...)
      const markdownMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/);
      if (markdownMatch && markdownMatch[1]) return markdownMatch[1];

      // Base64 Data URI directly
      if (content.startsWith('data:image/')) return content;

      // Direct Image File URL
      const imgUrlMatch = content.match(/(https?:\/\/[^\s\)\"\'>]+\.(?:png|jpg|jpeg|webp|gif)[^\s\)\"\'>]*)/i);
      if (imgUrlMatch && imgUrlMatch[1]) return imgUrlMatch[1];

      // Any HTTP/HTTPS link in content
      const anyUrlMatch = content.match(/(https?:\/\/[^\s\)\"\'>]+)/);
      if (anyUrlMatch && anyUrlMatch[1]) return anyUrlMatch[1];
    }
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 1. Strict Authentication Check
  const authUser = getAuthenticatedUser(req);
  if (!authUser) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'غير مصرح: يجب تسجيل الدخول لاستخدام محرك تحسين الصور بالذكاء الاصطناعي',
    });
  }

  const {
    image,
    maidId,
    provider = 'openrouter', // 'openrouter' | 'replicate'
    model = 'bytedance-seed/seedream-4.5',
    aspectRatio,
    photoType = 'personalPhoto',
    scale = 2,
    faceEnhance = true,
    fidelity = 0.7,
    apiKey,
    prompt: customPrompt,
    framing = 'medium_uniform',
  } = req.body;

  if (!image) {
    return res.status(400).json({ message: 'الرجاء تزويد صورة للبدء في المعالجة' });
  }

  // SSRF Check on image input if it's a URL
  if ((image.startsWith('http://') || image.startsWith('https://')) && !isAllowedDomain(image)) {
    return res.status(400).json({ message: 'مصدر رابط الصورة غير مصرح به (نطاق غير موثوق)' });
  }

  // 2. Strict AI Enhancement Quota Check (Max 2 Enhancements per Maid)
  if (maidId) {
    const numericMaidId = parseInt(String(maidId), 10);
    if (!isNaN(numericMaidId)) {
      try {
        const enhanceLogsCount = await prisma.systemUserLogs.count({
          where: {
            BeneficiaryId: numericMaidId,
            actionType: 'enhance',
          },
        });

        if (enhanceLogsCount >= 2) {
          return res.status(429).json({
            error: 'MAX_ENHANCE_LIMIT_REACHED',
            message: 'تم استنفاذ الحد الأقصى لتحسين صورة هذه العاملة بالذكاء الاصطناعي (مرتان كحد أقصى). يمكنك استخدام أدوات القص والتأطير والتدوير مجاناً دون أي قيود.',
            currentCount: enhanceLogsCount,
            maxAllowed: 2,
          });
        }
      } catch (quotaErr) {
        console.warn('Quota check warning:', quotaErr);
      }
    }
  }

  const startTime = Date.now();

  try {
    // ----------------------------------------------------
    // 1. OPENROUTER AI ENGINE
    // ----------------------------------------------------
    if (provider === 'openrouter') {
      const token = apiKey || process.env.OPENROUTER_API_KEY;
      if (!token) {
        return res.status(401).json({
          error: 'NO_API_KEY',
          message: 'الرجاء إدخال مفتاح OpenRouter API Key (sk-or-v1-...).',
        });
      }

      const openRouterModel = model || 'bytedance-seed/seedream-4.5';
      const targetRatio = aspectRatio || (photoType === 'fullPhoto' ? '9:16' : '3:4');
      
      const defaultUniversalPrompt = 
        'Faithful ultra-high-definition photograph restoration and enhancement of the reference image. ' +
        'CRITICAL FIDELITY & PRESERVATION RULES: ' +
        '1. STRICTLY PRESERVE HEADWEAR & HAIR: If the person is wearing a hijab, headscarf, veil, or head covering, DO NOT ADD ANY HAIR. Keep the exact headwear, scarf style, fabric, and coverage 100% identical to the reference photo. If natural hair is visible in the original, enhance only what is already there. NEVER invent or hallucinate hair on top of head coverings. ' +
        '2. STRICTLY PRESERVE CLOTHING & SHOULDERS: Maintain the exact clothing, garments, colors, patterns, and coverage from the original image. Keep shoulders, neck, and chest covered exactly as shown in the original photo. DO NOT reveal skin, DO NOT bare shoulders, DO NOT change or remove any piece of clothing. ' +
        '3. EXACT 1:1 FRAMING & COMPOSITION: Preserve the exact camera distance, framing, angle, and proportions. Do not zoom in on the face, do not alter body boundaries. ' +
        '4. PURE RESTORATION & CLARITY: Only clarify blurry facial features (eyes, nose, lips, natural skin texture) and enhance image resolution to ultra-sharp HD while keeping 100% fidelity to the original person, attire, and modest appearance.';

      const promptText = customPrompt || defaultUniversalPrompt;

      let outputImage: string | null = null;
      let lastErrorMessage = '';
      let rawResponse: any = null;

      console.log(`[OpenRouter] Sending request with model: ${openRouterModel}, aspectRatio: ${targetRatio}`);

      // Attempt 1: OpenRouter Chat Completions with modalities: ["image", "text"], aspect_ratio, image_config, and image_url
      try {
        const chatRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Tawtheeq Maid Portal',
          },
          body: JSON.stringify({
            model: openRouterModel,
            modalities: ['image', 'text'],
            aspect_ratio: targetRatio,
            image_config: {
              aspect_ratio: targetRatio,
            },
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: promptText },
                  { type: 'image_url', image_url: { url: image } }
                ]
              }
            ]
          })
        });

        rawResponse = await chatRes.json();

        if (chatRes.ok) {
          outputImage = extractImageFromOpenRouterResponse(rawResponse);
        } else {
          lastErrorMessage = rawResponse?.error?.message || `Status: ${chatRes.status}`;
        }
      } catch (e: any) {
        console.error('[OpenRouter Attempt 1 error]:', e);
        lastErrorMessage = e.message;
      }

      // Attempt 2: If attempt 1 didn't yield an image, try /api/v1/images with aspect_ratio & size
      if (!outputImage) {
        console.log('[OpenRouter] Trying /api/v1/images endpoint with aspect_ratio & size...');
        const sizeMapping: Record<string, string> = {
          '9:16': '768x1344',
          '3:4': '768x1024',
          '2:3': '832x1248',
          '1:1': '1024x1024',
        };
        try {
          const imageRes = await fetch('https://openrouter.ai/api/v1/images', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'Tawtheeq Maid Portal',
            },
            body: JSON.stringify({
              model: openRouterModel,
              prompt: promptText,
              aspect_ratio: targetRatio,
              size: sizeMapping[targetRatio] || '768x1344',
              image_config: {
                aspect_ratio: targetRatio,
              },
              input_references: [image],
            }),
          });

          const imgData = await imageRes.json();

          if (imageRes.ok) {
            outputImage = extractImageFromOpenRouterResponse(imgData);
          } else {
            lastErrorMessage = imgData?.error?.message || lastErrorMessage;
          }
        } catch (e: any) {
          console.error('[OpenRouter Attempt 2 error]:', e);
          lastErrorMessage = e.message;
        }
      }

      // Attempt 3: Fallback without modalities field
      if (!outputImage) {
        console.log('[OpenRouter] Trying fallback chat completions...');
        try {
          const fallbackRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'Tawtheeq Maid Portal',
            },
            body: JSON.stringify({
              model: openRouterModel,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: promptText },
                    { type: 'image_url', image_url: { url: image } }
                  ]
                }
              ]
            })
          });

          const fbData = await fallbackRes.json();

          if (fallbackRes.ok) {
            outputImage = extractImageFromOpenRouterResponse(fbData);
          } else {
            lastErrorMessage = fbData?.error?.message || lastErrorMessage;
          }
        } catch (e: any) {
          lastErrorMessage = e.message;
        }
      }

      if (!outputImage) {
        const detail = lastErrorMessage ? `: ${lastErrorMessage}` : '';
        throw new Error(`استجابة OpenRouter لم تحتوِ على صورة${detail}`);
      }

      const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

      return res.status(200).json({
        success: true,
        provider: 'openrouter',
        originalImage: image,
        enhancedImage: outputImage,
        model: openRouterModel,
        aspectRatio: targetRatio,
        elapsedSeconds: `${elapsedSeconds} ثوانٍ`,
      });
    }

    // ----------------------------------------------------
    // 2. REPLICATE CLOUD ENGINE (CodeFormer)
    // ----------------------------------------------------
    if (provider === 'replicate') {
      const token = apiKey || process.env.REPLICATE_API_TOKEN;
      if (!token) {
        return res.status(401).json({
          error: 'NO_API_KEY',
          message: 'الرجاء إدخال مفتاح Replicate API Token.',
        });
      }

      const replicate = new Replicate({ auth: token });
      const output: any = await replicate.run(
        'lucataco/codeformer:78f2bab438ab0ffc85a68cdfd316a2ecd3994b5dd26aa6b3d203357b45e5eb1b',
        {
          input: {
            image,
            upscale: Number(scale) || 2,
            face_upsample: Boolean(faceEnhance),
            background_enhance: true,
            codeformer_fidelity: Number(fidelity) || 0.7,
          },
        }
      );

      const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
      const resultUrl = Array.isArray(output)
        ? output[0]
        : typeof output === 'object' && output?.url
          ? output.url()
          : String(output);

      return res.status(200).json({
        success: true,
        provider: 'replicate',
        originalImage: image,
        enhancedImage: resultUrl,
        model: 'CodeFormer',
        scale,
        elapsedSeconds: `${elapsedSeconds} ثوانٍ`,
      });
    }

    throw new Error('نوع المزود غير مدعوم');
  } catch (error: any) {
    console.error('AI Upscale Error:', error);
    
    if (error?.status === 402 || error?.message?.includes('402') || error?.message?.includes('Insufficient credit') || error?.message?.includes('credits')) {
      return res.status(402).json({
        error: 'PAYMENT_REQUIRED',
        message: 'رصيد حساب OpenRouter غير كافٍ لتشغيل هذا النموذج. يرجى شحن الرصيد في openrouter.ai/credits',
      });
    }

    if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('User key not found')) {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'مفتاح الـ API غير صالح. يرجى التأكد من نسخه بشكل صحيح من openrouter.ai/keys',
      });
    }

    const errorMessage = error?.message || 'حدث خطأ أثناء معالجة الصورة عبر الذكاء الاصطناعي';
    return res.status(500).json({
      error: 'PROCESSING_FAILED',
      message: errorMessage,
    });
  }
}
