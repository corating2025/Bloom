import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure GEMINI_API_KEY is available
const apiKey = process.env.GEMINI_API_KEY;

// Create GenAI client
const ai = apiKey ? new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route: Check Empathy
  app.post("/api/empathy/check", async (req, res) => {
    try {
      const { id, complaint, advice, userInput } = req.body;

      if (!userInput || userInput.trim().length < 4) {
        return res.json({ 
          isEmpathetic: false, 
          feedback: "Please write a more thoughtful response of at least 4 letters! 💖" 
        });
      }

      // Local fallback generator for empathy evaluation
      const getOfflineFeedback = (scenarioId: string, text: string) => {
        const lowerInput = text.toLowerCase();
        const generalHarshWords = ["lazy", "picky", "weak", "terrible", "disgusting", "untidy", "stupid", "dumb", "clumsy", "careless", "bad"];
        const scenarioHarshWords: Record<string, string[]> = {
          homework: ["lazy", "slacker", "slow", "stupid", "dumb"],
          sports: ["weak", "slow", "loser", "useless", "terrible"],
          dinner: ["picky", "spoiled", "stubborn", "disgusting"],
          bedroom: ["terrible", "messy", "pig", "untidy", "dirty"],
          test: ["stupid", "dumb", "idiot", "bad", "disappointed"],
          vase: ["clumsy", "careless", "stupid", "troublemaker"]
        };

        const currentHarshWords = scenarioHarshWords[scenarioId] || generalHarshWords;
        const foundHarsh = currentHarshWords.find(w => lowerInput.includes(w)) || 
                           generalHarshWords.find(w => lowerInput.includes(w));

        // Simple writing/grammar check
        const grammarPoints: string[] = [];
        if (text[0] !== text[0].toUpperCase()) {
          grammarPoints.push("Capitalize the first letter of your sentence");
        }
        if (!/[.!?]$/.test(text.trim())) {
          grammarPoints.push("End your sentence with punctuation like a period or exclamation mark");
        }
        if (/\s{2,}/.test(text)) {
          grammarPoints.push("Avoid double spaces between words");
        }

        if (foundHarsh) {
          let grammarFeedback = "Your grammar looks fine, but let's fix the wording first! 🌸";
          if (grammarPoints.length > 0) {
            grammarFeedback = `Also, a quick writing tip: try to ${grammarPoints[0].toLowerCase()}.`;
          }
          return {
            isEmpathetic: false,
            feedback: `[Content & Word Choices]: Try to avoid negative labels like "${foundHarsh}". Express understanding instead! 🌸\n\n[Grammar Check]: ${grammarFeedback}`
          };
        }

        if (text.trim().length < 8) {
          return {
            isEmpathetic: false,
            feedback: "[Content Check]: This is a good start, but let's write a slightly longer, warmer sentence to show Yuen we truly understand his feelings! ❤️\n\n[Grammar Check]: Keep it up!"
          };
        }

        const successFeedbacks: Record<string, string> = {
          homework: "What a wonderful response! By offering to help with math or suggesting a break, Yuen feels supported instead of lazy! 💖",
          sports: "Excellent! Reminding Yuen that effort is what matters and offering to practice together makes him feel strong and loved! 🏃‍♂️",
          dinner: "Beautifully rewritten! Asking if he doesn't feel well or offering to try a small bite shows deep understanding of his feelings! 🍲",
          bedroom: "Fantastic! Offering to clean up together or asking if he's tired turns a chore into a collaborative, kind moment! 🧹",
          test: "Amazing job! Acknowledging his effort and promising to study together next time builds his confidence and shows unconditional love! 📝",
          vase: "Spectacular! Checking if he is hurt first shows that his safety is much more important than any broken object. Yuen will feel so safe with you! 🏺"
        };

        const defaultFeedback = "Your response looks wonderful! Excellent choice of warm, supportive, and empathetic words. Yuen feels so much better! 💖";
        
        let grammarText = "Your spelling and grammar are perfect! Excellent writing! 📝";
        if (grammarPoints.length > 0) {
          grammarText = `Your message is beautiful and caring! Just a tiny writing tip: try to ${grammarPoints.join(" and ").toLowerCase()} to make it even more pristine. 📝`;
        }

        return {
          isEmpathetic: true,
          feedback: `[Content & Word Choices]: ${successFeedbacks[scenarioId] || defaultFeedback}\n\n[Grammar Check]: ${grammarText}`
        };
      };

      // Try calling Agnes API
let result;
let agnesSuccess = false;
try {
  console.log("Calling Agnes API for empathy check...");
  const response = await fetch("https://apihub.agnes-ai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer sk-NAYqG3pC8AlpnLnATh0TZ7MHBcKOXz6Lm42gHaSEEJcHWSe6"
    },
    body: JSON.stringify({
      model: "agnes-2.0-flash",
      messages: [
        {
          role: "system",
          content: `You are a supportive, warm, and highly constructive primary school English and Empathy class teacher.
Evaluate the student's rewritten parent sentence for empathy, word choice, and grammatical correctness.

Your feedback must evaluate three aspects:
1. Content and Structure (内容与结构): Praise if they offered warm support, constructive advice, or a collaborative solution. Gentle guidance if not.
2. Word Choices (用词): Praise positive, warm, and gentle words. Gently warn against negative labels (e.g. lazy, weak, picky, terrible, untidy, disgusting).
3. Grammatical Correctness (语法正确性): Praise if there are no errors, or gently and sweetly point out spelling/grammar/punctuation mistakes.

Respond STRICTLY in JSON format matching this schema:
{
  "isEmpathetic": boolean (true if the response is caring and supportive, and has no severe grammar errors that ruin understanding; false if it contains negative labels, harsh criticisms, or severe errors),
  "feedback": "string (a super warm, direct feedback in simple English suitable for children, maximum 3 sentences. Separate your feedback into clear sections for [Content & Word Choices] and [Grammar Check]. Speak directly to the student!)"
}`
        },
        {
          role: "user",
          content: `Original parent complaint: "${complaint}"
Teacher's advice on the scenario: "${advice}"
Student's proposed rewritten response: "${userInput}"`
        }
      ]
    })
  });

  // 新增：判断接口是否正常返回
  console.log("Agnes API Status Code:", response.status);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API请求失败，状态码${response.status}，详情：${errText}`);
  }

  // 解析大模型返回完整数据
  const rawRes = await response.json();
  const aiRawJson = rawRes.choices[0].message.content.trim();
  // 把AI输出的json字符串转成对象
  result = JSON.parse(aiRawJson);
  agnesSuccess = true;
  console.log("Agnes parsed feedback result:", result);

} catch (err) {
  console.error("Agnes API call failed full error:", err);
  agnesSuccess = false;
  // 接口异常兜底返回值
  result = {
    isEmpathetic: false,
    feedback: "Empathy analysis offline, but we believe in your kindness! ❤️"
  };
}

// 最后返回给前端接口响应
return res.json({
  isEmpathetic: result.isEmpathetic,
  feedback: result.feedback
});
      
        if (response.ok) {
          const data = await response.json();
          if (data.choices && data.choices[0]?.message?.content) {
            const content = data.choices[0].message.content.trim();
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const cleanJson = content.slice(jsonStart, jsonEnd + 1);
              result = JSON.parse(cleanJson);
              agnesSuccess = true;
              console.log("Successfully received and parsed Agnes API response.");
            }
          }
        } else {
          console.warn(`Agnes API returned status: ${response.status}. Falling back...`);
        }
      } catch (agnesError) {
        console.error("Agnes API call failed, falling back to local/Gemini:", agnesError);
      }

      // Fallback to Gemini if Agnes API failed
      if (!agnesSuccess) {
        if (!ai) {
          console.warn("GEMINI_API_KEY is missing. Using local fallback evaluation.");
          return res.json(getOfflineFeedback(id, userInput));
        }

        const prompt = `
          You are a supportive, warm, and highly constructive primary school English and Empathy class teacher.
          Evaluate the student's rewritten parent sentence for empathy, warm encouragement, and writing correctness.
          
          Original parent complaint: "${complaint}"
          Teacher's advice on the scenario: "${advice}"
          Student's proposed rewritten response: "${userInput}"
          
          Instructions:
          1. Evaluate three aspects:
             - Content and Structure: Does it express warmth and offer to help together instead of criticizing?
             - Word Choices: Does it use positive words and avoid negative labels (like lazy, picky, weak, terrible, untidy)?
             - Grammatical Correctness: Are there any minor typos or errors? Gently point them out.
          2. Respond STRICTLY in JSON format matching this schema:
             - "isEmpathetic": boolean (true if the response is caring and supportive, false if it is harsh or contains negative labels)
             - "feedback": string (a short, super warm, and encouraging explanation or gentle hint in simple English, maximum 3 sentences. Separate into a commented feedback for [Content & Word Choices] and [Grammar Check]. Speak directly to the student!)
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isEmpathetic: { type: Type.BOOLEAN },
                feedback: { type: Type.STRING },
              },
              required: ["isEmpathetic", "feedback"],
            },
          },
        });

        const responseText = response.text || "{}";
        result = JSON.parse(responseText.trim());
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error checking empathy, running local fallback evaluation:", error);
      const { id, userInput } = req.body;
      const getOfflineFeedback = (scenarioId: string, text: string) => {
        const lowerInput = text.toLowerCase();
        const generalHarshWords = ["lazy", "picky", "weak", "terrible", "disgusting", "untidy", "stupid", "dumb", "clumsy", "careless", "bad"];
        const scenarioHarshWords: Record<string, string[]> = {
          homework: ["lazy", "slacker", "slow", "stupid", "dumb"],
          sports: ["weak", "slow", "loser", "useless", "terrible"],
          dinner: ["picky", "spoiled", "stubborn", "disgusting"],
          bedroom: ["terrible", "messy", "pig", "untidy", "dirty"],
          test: ["stupid", "dumb", "idiot", "bad", "disappointed"],
          vase: ["clumsy", "careless", "stupid", "troublemaker"]
        };

        const currentHarshWords = scenarioHarshWords[scenarioId] || generalHarshWords;
        const foundHarsh = currentHarshWords.find(w => lowerInput.includes(w)) || 
                           generalHarshWords.find(w => lowerInput.includes(w));

        const grammarPoints: string[] = [];
        if (text[0] !== text[0].toUpperCase()) {
          grammarPoints.push("Capitalize the first letter of your sentence");
        }
        if (!/[.!?]$/.test(text.trim())) {
          grammarPoints.push("End your sentence with punctuation like a period or exclamation mark");
        }
        if (/\s{2,}/.test(text)) {
          grammarPoints.push("Avoid double spaces between words");
        }

        if (foundHarsh) {
          let grammarFeedback = "Your grammar looks fine, but let's fix the wording first! 🌸";
          if (grammarPoints.length > 0) {
            grammarFeedback = `Also, a quick writing tip: try to ${grammarPoints[0].toLowerCase()}.`;
          }
          return {
            isEmpathetic: false,
            feedback: `[Content & Word Choices]: Try to avoid negative labels like "${foundHarsh}". Express understanding instead! 🌸\n\n[Grammar Check]: ${grammarFeedback}`
          };
        }

        if (text.trim().length < 8) {
          return {
            isEmpathetic: false,
            feedback: "[Content Check]: This is a good start, but let's write a slightly longer, warmer sentence to show Yuen we truly understand his feelings! ❤️\n\n[Grammar Check]: Keep it up!"
          };
        }

        const successFeedbacks: Record<string, string> = {
          homework: "What a wonderful response! By offering to help with math or suggesting a break, Yuen feels supported instead of lazy! 💖",
          sports: "Excellent! Reminding Yuen that effort is what matters and offering to practice together makes him feel strong and loved! 🏃‍♂️",
          dinner: "Beautifully rewritten! Asking if he doesn't feel well or offering to try a small bite shows deep understanding of his feelings! 🍲",
          bedroom: "Fantastic! Offering to clean up together or asking if he's tired turns a chore into a collaborative, kind moment! 🧹",
          test: "Amazing job! Acknowledging his effort and promising to study together next time builds his confidence and shows unconditional love! 📝",
          vase: "Spectacular! Checking if he is hurt first shows that his safety is much more important than any broken object. Yuen will feel so safe with you! 🏺"
        };

        const defaultFeedback = "Your response looks wonderful! Excellent choice of warm, supportive, and empathetic words. Yuen feels so much better! 💖";
        
        let grammarText = "Your spelling and grammar are perfect! Excellent writing! 📝";
        if (grammarPoints.length > 0) {
          grammarText = `Your message is beautiful and caring! Just a tiny writing tip: try to ${grammarPoints.join(" and ").toLowerCase()} to make it even more pristine. 📝`;
        }

        return {
          isEmpathetic: true,
          feedback: `[Content & Word Choices]: ${successFeedbacks[scenarioId] || defaultFeedback}\n\n[Grammar Check]: ${grammarText}`
        };
      };
      res.json(getOfflineFeedback(id, userInput));
    }
  });

  // Helper: Generates a beautiful customized watercolor-style SVG thank-you card background
  const generateCustomSvg = (style: string = '', sticker: string = '', recipient: string = '') => {
    const styleLower = (style || '').toLowerCase();
    const stickerLower = (sticker || '').toLowerCase();
    
    // 1. Determine Colors based on Style
    let bgGradient = {
      start: '#fff5f5', // Soft rose blush
      end: '#fef2f2',
      accent: '#fecdd3',
      border: '#fda4af',
      leafColor: '#fb7185'
    };
    
    if (styleLower.includes('pink') || styleLower.includes('purple') || styleLower.includes('violet') || styleLower.includes('lavender')) {
      bgGradient = {
        start: '#fff1f2', // pink blush
        end: '#f5f3ff', // lavender purple
        accent: '#fbcfe8',
        border: '#f472b6',
        leafColor: '#c084fc'
      };
    } else if (styleLower.includes('sunset') || styleLower.includes('orange') || styleLower.includes('peach') || styleLower.includes('warm') || styleLower.includes('red') || styleLower.includes('coral')) {
      bgGradient = {
        start: '#fff5f5', // soft warm red
        end: '#fef3c7', // warm amber yellow
        accent: '#fed7aa',
        border: '#fb923c',
        leafColor: '#f59e0b'
      };
    } else if (styleLower.includes('floral') || styleLower.includes('green') || styleLower.includes('yellow') || styleLower.includes('garden') || styleLower.includes('leaf') || styleLower.includes('nature')) {
      bgGradient = {
        start: '#f0fdf4', // mint green
        end: '#fefce8', // pale yellow
        accent: '#bbf7d0',
        border: '#86efac',
        leafColor: '#22c55e'
      };
    } else if (styleLower.includes('blue') || styleLower.includes('sky') || styleLower.includes('ocean') || styleLower.includes('cold') || styleLower.includes('cool')) {
      bgGradient = {
        start: '#ecfeff', // cyan glow
        end: '#eff6ff', // soft sky blue
        accent: '#bae6fd',
        border: '#60a5fa',
        leafColor: '#38bdf8'
      };
    }

    // 2. Build Watercolor Splatters (for the unified warm watercolor illustration vibe)
    const splatters = `
      <g opacity="0.35">
        <path d="M 60,110 C 160,60 260,160 210,260 C 130,330 90,210 60,110 Z" fill="${bgGradient.start}" filter="blur(30px)" />
        <path d="M 490,90 C 540,190 390,230 370,330 C 340,410 470,490 490,90 Z" fill="${bgGradient.end}" filter="blur(35px)" />
        <path d="M 130,470 C 230,510 190,410 310,490 C 210,570 90,540 130,470 Z" fill="${bgGradient.accent}" filter="blur(40px)" />
      </g>
    `;

    // 3. Build Floral Corners & Vines
    let floralDecorations = '';
    if (styleLower.includes('sunset') || styleLower.includes('sky')) {
      floralDecorations = `
        <g transform="translate(60, 60)">
          <path d="M 0,-15 L 4,-4 L 15,0 L 4,4 L 0,15 L -4,4 L -15,0 L -4,-4 Z" fill="#fef08a" opacity="0.9" />
          <path d="M 20,-20 L 22,-5 L 37,-3 L 22,-1 L 20,14 L 18,-1 L 3,-3 L 18,-5 Z" fill="#fef08a" opacity="0.6" transform="scale(0.6)" />
        </g>
        <g transform="translate(520, 60)" opacity="0.85">
          <path d="M0,10 C-15,10 -25,0 -20,-15 C-15,-30 5,-30 15,-20 C25,-30 45,-25 45,-10 C55,-10 60,5 45,15 C35,25 15,20 0,10 Z" fill="#ffffff" />
          <path d="M10,15 C-5,15 -15,5 -10,-10 C-5,-25 15,-25 25,-15 C35,-25 55,-20 55,-5 C65,-5 70,10 55,20 C45,30 25,25 10,15 Z" fill="#fef2f2" opacity="0.5" transform="translate(-10, -5) scale(0.9)" />
        </g>
        <g transform="translate(70, 520)" opacity="0.8">
          <path d="M0,0 A 20,20 0 1,0 30,-10 A 15,15 0 1,1 0,0" fill="#fef08a" />
        </g>
      `;
    } else {
      floralDecorations = `
        <g transform="translate(60, 60)">
          <path d="M-40,0 C-20,-30 10,-30 20,0 C30,30 0,40 -40,0 Z" fill="${bgGradient.leafColor}" opacity="0.25" transform="rotate(-15)"/>
          <path d="M0,-40 C30,-20 30,10 0,20 C-30,30 -40,0 0,-40 Z" fill="${bgGradient.leafColor}" opacity="0.2" transform="rotate(45)"/>
          <circle cx="0" cy="0" r="16" fill="${bgGradient.border}" opacity="0.8" />
          <circle cx="6" cy="-6" r="12" fill="${bgGradient.accent}" opacity="0.7" />
          <circle cx="-6" cy="6" r="12" fill="${bgGradient.accent}" opacity="0.7" />
          <circle cx="0" cy="0" r="6" fill="#ffffff" opacity="0.9" />
        </g>
        <g transform="translate(540, 60)">
          <path d="M0,0 Q-40,-20 -80,10" fill="none" stroke="${bgGradient.leafColor}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
          <path d="M0,0 Q20,-40 -10,-60" fill="none" stroke="${bgGradient.leafColor}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
          <circle cx="-40" cy="-10" r="8" fill="${bgGradient.border}" opacity="0.7"/>
          <circle cx="-70" cy="5" r="5" fill="${bgGradient.accent}" opacity="0.8"/>
        </g>
        <g transform="translate(60, 540)">
          <circle cx="0" cy="0" r="15" fill="${bgGradient.border}" opacity="0.7"/>
          <circle cx="-10" cy="-10" r="12" fill="${bgGradient.accent}" opacity="0.6"/>
          <circle cx="10" cy="10" r="10" fill="${bgGradient.leafColor}" opacity="0.4"/>
        </g>
      `;
    }

    // 4. Build Custom Sticker based on cardSticker
    let stickerElement = '';
    if (stickerLower.includes('cat') || stickerLower.includes('kitty')) {
      stickerElement = `
        <g transform="translate(460, 460)">
          <path d="M -50,5 C -55,-25 -45,-45 -25,-45 C -15,-45 -10,-35 0,-35 C 10,-35 15,-45 25,-45 C 45,-45 55,-25 50,5 C 45,35 25,45 0,45 C -25,45 -45,35 -50,5 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
          <ellipse cx="0" cy="8" rx="35" ry="25" fill="#fdbaf8" />
          <ellipse cx="0" cy="8" rx="32" ry="22" fill="#fbcfe8" />
          <circle cx="0" cy="-12" r="22" fill="#fbcfe8" />
          <polygon points="-18,-24 -8,-10 -22,-6" fill="#f9a8d4" />
          <polygon points="-16,-20 -10,-11 -19,-8" fill="#f472b6" />
          <polygon points="18,-24 8,-10 22,-6" fill="#f9a8d4" />
          <polygon points="16,-20 10,-11 19,-8" fill="#f472b6" />
          <path d="M -12,-12 Q -8,-15 -4,-12" fill="none" stroke="#6b21a8" stroke-width="2.5" stroke-linecap="round" />
          <path d="M 4,-12 Q 8,-15 12,-12" fill="none" stroke="#6b21a8" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="-13" cy="-6" r="4" fill="#f43f5e" opacity="0.6" />
          <circle cx="13" cy="-6" r="4" fill="#f43f5e" opacity="0.6" />
          <polygon points="-1,-8 1,-8 0,-7" fill="#be185d" />
          <path d="M -3,-5 Q 0,-3 3,-5" fill="none" stroke="#6b21a8" stroke-width="2" stroke-linecap="round" />
          <ellipse cx="-12" cy="18" rx="7" ry="5" fill="#ffffff" />
          <ellipse cx="12" cy="18" rx="7" ry="5" fill="#ffffff" />
          <path d="M 28,15 Q 40,25 45,10" fill="none" stroke="#fbcfe8" stroke-width="6" stroke-linecap="round" />
        </g>
      `;
    } else if (stickerLower.includes('sun') || stickerLower.includes('sunshine')) {
      stickerElement = `
        <g transform="translate(460, 460)">
          <circle cx="0" cy="0" r="48" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
          <g stroke="#f59e0b" stroke-width="6" stroke-linecap="round" opacity="0.8">
            <line x1="0" y1="-38" x2="0" y2="-30" />
            <line x1="0" y1="30" x2="0" y2="38" />
            <line x1="-30" y1="0" x2="-38" y2="0" />
            <line x1="30" y1="0" x2="38" y2="0" />
            <line x1="-24" y1="-24" x2="-19" y2="-19" />
            <line x1="19" y1="19" x2="24" y2="24" />
            <line x1="24" y1="-24" x2="19" y2="-19" />
            <line x1="-19" y1="19" x2="-24" y2="24" />
          </g>
          <circle cx="0" cy="0" r="28" fill="#fbbf24" />
          <circle cx="0" cy="0" r="25" fill="#fef08a" />
          <circle cx="-8" cy="-4" r="3" fill="#78350f" />
          <circle cx="8" cy="-4" r="3" fill="#78350f" />
          <circle cx="-12" cy="3" r="4" fill="#f43f5e" opacity="0.6" />
          <circle cx="12" cy="3" r="4" fill="#f43f5e" opacity="0.6" />
          <path d="M -5,4 Q 0,9 5,4" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />
        </g>
      `;
    } else if (stickerLower.includes('bear')) {
      stickerElement = `
        <g transform="translate(460, 460)">
          <path d="M -42,10 C -48,-15 -42,-35 -25,-40 C -15,-42 -5,-35 0,-35 C 5,-35 15,-42 25,-40 C 42,-35 48,-15 42,10 C 38,32 20,44 0,44 C -20,44 -38,32 -42,10 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
          <circle cx="0" cy="2" r="28" fill="#b45309" />
          <circle cx="0" cy="2" r="25" fill="#d97706" />
          <circle cx="-20" cy="-18" r="10" fill="#b45309" />
          <circle cx="-20" cy="-18" r="6" fill="#fef3c7" />
          <circle cx="20" cy="-18" r="10" fill="#b45309" />
          <circle cx="20" cy="-18" r="6" fill="#fef3c7" />
          <ellipse cx="0" cy="8" rx="10" ry="7" fill="#fef3c7" />
          <polygon points="-3,5 3,5 0,8" fill="#78350f" />
          <path d="M -12,0 Q -8,-3 -4,0" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />
          <path d="M 4,0 Q 8,-3 12,0" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="-14" cy="7" r="3" fill="#f43f5e" opacity="0.6" />
          <circle cx="14" cy="7" r="3" fill="#f43f5e" opacity="0.6" />
        </g>
      `;
    } else if (stickerLower.includes('flower') || stickerLower.includes('floral') || stickerLower.includes('rose') || stickerLower.includes('blossom')) {
      stickerElement = `
        <g transform="translate(460, 460)">
          <path d="M -35,5 C -45,-25 -15,-45 10,-35 C 35,-45 45,-15 35,15 C 25,35 -15,45 -35,5 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
          <circle cx="-6" cy="-6" r="16" fill="#fda4af" opacity="0.9" />
          <circle cx="8" cy="8" r="14" fill="#fecdd3" opacity="0.9" />
          <circle cx="10" cy="-10" r="15" fill="#f472b6" opacity="0.8" />
          <circle cx="-10" cy="10" r="12" fill="#fb7185" opacity="0.8" />
          <circle cx="0" cy="0" r="8" fill="#be123c" />
          <circle cx="0" cy="0" r="4" fill="#ffffff" />
          <path d="M 24,20 C 35,28 35,12 28,8 Z" fill="#4ade80" />
          <path d="M -24,-20 C -35,-28 -35,-12 -28,-8 Z" fill="#4ade80" />
        </g>
      `;
    } else if (stickerLower.includes('heart') || stickerLower.includes('love')) {
      stickerElement = `
        <g transform="translate(460, 460)">
          <path d="M -30,-15 C -45,-35 -5,-45 10,-20 C 25,-45 50,-30 35,0 C 20,25 0,40 -10,42 C -25,30 -45,10 -30,-15 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
          <path d="M 5,-10 C 15,-25 35,-15 25,5 C 15,20 0,32 -5,32 C -15,25 -30,5 -20,-10 C -10,-25 0,-15 5,-10 Z" fill="#f43f5e" />
          <ellipse cx="-10" cy="-6" rx="4" ry="7" fill="#ffffff" opacity="0.4" transform="rotate(-30 -10 -6)" />
          <path d="M -15,10 C -10,2 -2,6 -5,15 C -8,20 -15,25 -17,25 C -20,22 -25,18 -22,12 C -20,8 -17,10 -15,10 Z" fill="#ec4899" opacity="0.9" />
        </g>
      `;
    } else {
      stickerElement = `
        <g transform="translate(460, 460)">
          <path d="M 0,-40 L 12,-12 L 40,-8 L 18,12 L 25,40 L 0,22 L -25,40 L -18,12 L -40,-8 L -12,-12 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" stroke="#ffffff" stroke-width="8" stroke-linejoin="round" />
          <path d="M 0,-34 L 10,-10 L 34,-7 L 15,10 L 21,34 L 0,19 L -21,34 L -15,10 L -34,-7 L -10,-10 Z" fill="#f59e0b" />
          <path d="M 0,-34 L 10,-10 L 34,-7 L 15,10 L 21,34 L 0,19 Z" fill="#fbbf24" />
          <circle cx="0" cy="0" r="4" fill="#ffffff" opacity="0.9" />
          <circle cx="-15" cy="-20" r="3" fill="#ffffff" />
          <circle cx="15" cy="20" r="2.5" fill="#ffffff" />
        </g>
      `;
    }

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${bgGradient.start}" />
            <stop offset="100%" stop-color="${bgGradient.end}" />
          </linearGradient>
          <filter id="paperTexture" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.04 0" />
            <feBlend mode="multiply" in="SourceGraphic" in2="noise" />
          </filter>
        </defs>

        <rect width="600" height="600" fill="url(#cardGrad)" rx="24" />
        <rect width="600" height="600" fill="none" rx="24" filter="url(#paperTexture)" />

        ${splatters}
        ${floralDecorations}

        <rect x="25" y="25" width="550" height="550" fill="none" stroke="${bgGradient.border}" stroke-width="2.5" stroke-dasharray="8 6" rx="18" opacity="0.6" />

        <g transform="translate(300, 52)">
          <text text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="12" fill="${bgGradient.leafColor}" font-weight="bold" letter-spacing="1.5" opacity="0.8">
            ESPECIALLY MADE FOR ${(recipient || '').toUpperCase()}
          </text>
        </g>

        ${stickerElement}
      </svg>
    `;

    return `data:image/svg+xml;base64,${Buffer.from(svgContent.trim()).toString('base64')}`;
  };

  // API Route: Generate Thank You Card Background (using gemini-3.1-flash-lite-image)
  app.post("/api/card/generate", async (req, res) => {
    const { message, customPrompt, recipient, style, sticker } = req.body;
    
    const styleLower = (style || '').toLowerCase();
    const stickerLower = (sticker || '').toLowerCase();

    // Compiled cozy watercolor prompt featuring the student's specific words
    const prompt = `A sweet and heartwarming watercolor-style digital art illustration of a cozy thank you card background for ${recipient || 'someone special'}. Specific elements to include: ${stickerLower || 'beautiful floral decor'}. Color scheme: ${styleLower || 'warm gentle pastel colors'}. It must feature a soft cream-colored empty parchment or clean blank paper space in the absolute center, perfectly prepared to display a thank you letter. The overall style must be unified, gentle, cozy, adorable, and comforting. STRICTLY NO TEXT, NO ALPHABETS, NO WORDS, and NO writing in the illustration.`;

    let imageBase64 = "";
    let agnesSuccess = false;

    // 1. Try calling Agnes API first
    try {
      console.log("Calling Agnes API for image generation...");
      const response = await fetch("https://apihub.agnes-ai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-NAYqG3pC8AlpnLnATh0TZ7MHBcKOXz6Lm42gHaSEEJcHWSe6"
        },
        body: JSON.stringify({
          model: "agnes-image-2.1-flash",
          prompt: prompt,
          n: 1,
          size: "1024x1024"
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data[0]) {
          if (data.data[0].b64_json && data.data[0].b64_json.length > 10) {
            imageBase64 = `data:image/png;base64,${data.data[0].b64_json}`;
            agnesSuccess = true;
            console.log("Successfully generated card image via Agnes API (b64_json).");
          } else if (data.data[0].url) {
            try {
              console.log("Fetching generated image from Agnes URL to convert to Base64:", data.data[0].url);
              const imgResponse = await fetch(data.data[0].url);
              if (imgResponse.ok) {
                const arrayBuffer = await imgResponse.arrayBuffer();
                const base64String = Buffer.from(arrayBuffer).toString('base64');
                imageBase64 = `data:image/png;base64,${base64String}`;
                agnesSuccess = true;
                console.log("Successfully converted Agnes image URL to Base64 in backend.");
              } else {
                console.warn(`Failed to fetch Agnes image URL, status: ${imgResponse.status}. Falling back to raw URL.`);
                imageBase64 = data.data[0].url;
                agnesSuccess = true;
              }
            } catch (fetchErr: any) {
              console.error("Error downloading image from Agnes URL:", fetchErr.message);
              imageBase64 = data.data[0].url;
              agnesSuccess = true;
            }
          }
        }
      } else {
        const errorText = await response.text();
        console.warn(`Agnes API image generation returned status: ${response.status}. Response: ${errorText}. Falling back...`);
      }
    } catch (agnesError) {
      console.error("Agnes API image generation failed, falling back to local/Gemini:", agnesError);
    }

    // 2. Fallback to local Gemini image generation
    if (!agnesSuccess) {
      try {
        if (!ai) {
          console.warn("GEMINI_API_KEY is missing, generating beautiful custom fallback illustration.");
          return res.json({ imageUrl: generateCustomSvg(style, sticker, recipient) });
        }

        console.log("Calling local Gemini model for image generation...");
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            }
          }
        });

        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData) {
              imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
              agnesSuccess = true;
              break;
            }
          }
        }

        if (!imageBase64) {
          throw new Error("No image data returned from local Gemini model.");
        }
      } catch (geminiError) {
        console.error("Gemini image API failed, running local custom SVG generator fallback:", geminiError);
        return res.json({ imageUrl: generateCustomSvg(style, sticker, recipient) });
      }
    }

    res.json({ imageUrl: imageBase64 });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
