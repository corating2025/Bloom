const key = "sk-NAYqG3pC8AlpnLnATh0TZ7MHBcKOXz6Lm42gHaSEEJcHWSe6";

async function test() {
  try {
    const res = await fetch("http://api.agnes.pro/chat/completions", {
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
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const body = await res.text();
    console.log("Body:", body);
  } catch (err) {
    console.log("Error:", err.message);
  }
}

test();
