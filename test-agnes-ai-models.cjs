const key = "sk-NAYqG3pC8AlpnLnATh0TZ7MHBcKOXz6Lm42gHaSEEJcHWSe6";

async function test() {
  try {
    const res = await fetch("https://api.agnes-ai.com/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${key}`
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.slice(0, 1000));
  } catch (err) {
    console.log("Error:", err.message);
  }
}

test();
