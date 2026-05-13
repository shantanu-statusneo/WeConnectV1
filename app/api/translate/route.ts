import { NextResponse } from "next/server";

const translationCache = new Map<string, Map<string, string>>();

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      text: string;
      targetLang: "en" | "hi" | "fr";
    };

    const { text, targetLang } = body;

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "text and targetLang are required" },
        { status: 400 }
      );
    }

    // Return text as-is for English
    if (targetLang === "en") {
      return NextResponse.json({ translatedText: text });
    }

    // Check cache
    if (!translationCache.has(targetLang)) {
      translationCache.set(targetLang, new Map());
    }
    const cache = translationCache.get(targetLang)!;
    if (cache.has(text)) {
      return NextResponse.json({ translatedText: cache.get(text) });
    }

    // Use Google Translate API
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      console.warn("[TRANSLATE] Google Translate API key not configured, returning original text");
      return NextResponse.json({ translatedText: text });
    }

    const targetLanguageCode = targetLang === "hi" ? "hi" : targetLang === "fr" ? "fr" : "en";

    const response = await fetch("https://translation.googleapis.com/language/translate/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguageCode,
        source: "en",
        key: apiKey,
      }),
    });

    if (!response.ok) {
      console.error("[TRANSLATE] API error:", response.status);
      return NextResponse.json({ translatedText: text });
    }

    const data = (await response.json()) as {
      data?: {
        translations?: Array<{
          translatedText: string;
        }>;
      };
    };

    const translatedText = data.data?.translations?.[0]?.translatedText ?? text;
    
    // Cache the translation
    cache.set(text, translatedText);
    
    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("[TRANSLATE] Error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
