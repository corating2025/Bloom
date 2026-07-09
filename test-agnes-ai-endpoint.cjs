const key = "sk-NAYqG3pC8AlpnLnATh0TZ7MHBcKOXz6Lm42gHaSEEJcHWSe6";

const configs = [
  { headers: { "Authorization": `Bearer ${key}` } },
  { headers: { "Authorization": key } },
  { headers: { "X-API-Key": key } },
  { headers: { "api-key": key } },
  { headers: { "Authorization": `Bearer ${key}`, "X-API-Key": key } }
];

async function test() {
  for (let i = 0; i < configs.length; i++) {
    try {
      console.log(`Testing config ${i + 1}...`);
      const res = await fetch("https://api.agnes-ai.com/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...configs[i].headers
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "hi" }]
        })
      });
      console.log(`Status:`, res.status);
      const text = await res.text();
      console.log(`Response:`, text.slice(0, 300));
    } catch (err) {
      console.log(`Error:`, err.message);
    }
  }
}

test();
