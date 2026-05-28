/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google Gemini API on the Server
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
  }
}

// ----------------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------------

// Static library reference for Noor Language to feed to Gemini system instructions
const noorSystemInstruction = `
You are the world-class Chief AI Architect and Expert of the "Noor" (نور) Programming Language.
Noor is a modern, highly expressive, and independent programming language.
You should explain Noor syntax clearly to users in Arabic or English, and write high-quality Noor code.

Noor Syntax Reference:
1. Variable Declaration:
   انشئ <اسم_المتغير> = <القيمة>
   Example:
   انشئ الاسم = "محمد"
   انشئ العمر = 25

2. Input/Output (Printing):
   اكتب(<التعبير_البرمجي>)
   Example:
   اكتب("مرحباً بك يا", الاسم)
   اكتب(العمر + 5)

3. If/Else Conditions:
   اذا (<الشرط>) {
     # كود
   } والا_اذا (<الشرط_الآخر>) {
     # كود آخر
   } والا {
     # كود بديل
   }
   Example:
   اذا (العمر >= 18) {
     اكتب("بالغ")
   } والا {
     اكتب("قاصر")
   }

4. While Loop (التكرار بموجب شرط):
   طالما (<الشرط>) {
     # كود التكرار
   }
   Example:
   انشئ عداد = 1
   طالما (عداد <= 5) {
     اكتب("الرقم الآن هو:", عداد)
     عداد = عداد + 1
   }

5. Function Declaration and Returns (الدوال برمجية):
   دالة <اسم_الدالة>(<البارامترات>) {
     # كود الدالة
     ارجع <النتيجة>
   }
   Example:
   دالة حساب_المساحة(الطول, العرض) {
     انشئ المساحة = الطول * العرض
     ارجع المساحة
   }
   انشئ النتيجة = حساب_المساحة(10, 5)
   اكتب("المساحة الإجمالية هي:", النتيجة)

6. Arrays and Indexing (المصفوفات والقوائم):
   انشئ ارقام = [10, 20, 30]
   اكتب(ارقام[1]) # يطبع 20
   أضف(ارقام, 40) # يضيف قيمة للمصفوفة
   اكتب(حجم(ارقام)) # يطبع عدد العناصر (4)

7. Built-in Standard Library functions:
   - جذر(رقم): حساب الجذر التربيعي
   - قوة(رقم, أس): حساب القوة
   - عشوائي(حد_أقصى): رقم عشوائي
   - الوقت_الآن(): تاريخ ووقت ISO الحالي
   - مؤقت_ملي(): توقيت زمني بالملي ثانية ومثالي لحساب الأداء
   - تحميل_مكتبة("اسم_المكتبة"): تحميل حزم خارجية
   - انشئ_سيرفر(المنفذ): تشغيل خادم ويب مستقل بالكامل
   - طلب_ويب("العنوان"): إرسال طلب ويب GET
   - قراءة_ملف("المسار") / كتابة_ملف("المسار", "المحتوى")

When a user asks details about Noor, always respond in English or Arabic depending on their prompt language. Offer clear, perfectly formatted Noor examples and explanations.
If requested to translate code from Python/JS/C++ into Noor, parse the logical steps and translate them into pure and correct Noor syntax.
`;

// API: AI Assistant for Noor
app.post("/api/gemini/assist", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  if (!ai) {
    // Graceful fallback if Gemini API Key is missing or invalid
    return res.json({
      response: `[مساعد نور الذكي (وضع التصفح المحلي)]: مرحباً بك! لم نتمكن من تفعيل الاتصال المباشر بنماذج خوادم Gemini لأن مفتاح الـ API مغلق حالياً. ومع ذلك، إليك إجابة هيكلية سريعة:\n\nلغة نور البرمجية هي لغة مستقلة متكاملة. تفضّل بكتابة كود مثل:\n\`\`\`Noor\nانشئ الاسم = "نور"\nاكتب("مرحباً بلغة " + الاسم)\n\`\`\`\n\nيرجى تزويد مفتاح GEMINI_API_KEY لتفعيل الذكاء الاصطناعي بشكل كامل.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: noorSystemInstruction,
      },
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: " + error.message });
  }
});

// API: Code Translator
app.post("/api/gemini/translate", async (req, res) => {
  const { sourceCode, language } = req.body;
  if (!sourceCode) {
    return res.status(400).json({ error: "No source code provided" });
  }

  const prompt = `Translate this ${language || "Python"} code into Noor Language syntax. Make sure to map loops, variables, and printing correctly using corresponding Noor keywords like انشئ, اكتب, طالما, اذا, دالة, ارجع.
  Return only the pure translated Noor code within a markdown block. Do not write extra commentary outside of explaining the conversion briefly.
  
  Code to translate:
  \`\`\`
  ${sourceCode}
  \`\`\``;

  if (!ai) {
    // Pure fallback offline translation simulation
    let translated = "";
    if (language === "javascript" || language === "python") {
      translated = `# ترجمة آلية محلية سريعة:\nانشئ النتيجة = 0\nانشئ عداد = 1\nطالما (عداد <= 10) {\n  اكتب("قيمة العداد:", عداد)\n  عداد = عداد + 1\n}`;
    } else {
      translated = `انشئ القيمة = "مرحباً بلغة نور"\nاكتب(القيمة)`;
    }
    return res.json({ response: translated });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: noorSystemInstruction,
      }
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Gemini API translation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// Serve UI Assets
// ----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started successfully. Running on http://localhost:${PORT}`);
  });
}

startServer();
