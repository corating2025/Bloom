const key = "sk-NAYqG3pC8AlpnLnATh0TZ7MHBcKOXz6Lm42gHaSEEJcHWSe6";
const endpoints = [
  "http://api.aigcapi.com/v1"
];

async function test() {
  for (const ep of endpoints) {
    try {
      console.log(`Testing endpoint [${ep}]...`);
      const res = await fetch(`${ep}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "hi" }]
        })
      });
      console.log(`Endpoint [${ep}] status:`, res.status);
      const text = await res.text();
      console.log(`Endpoint [${ep}] response (first 200 chars):`, text.slice(0, 200));
    } catch (err) {
      console.log(`Endpoint [${ep}] error:`, err.message);
    }
  }
}

test();
