// backend/utils/generateExplanation.js

const { Configuration, OpenAIApi } = require("openai");

// You can store your key in .env and load with dotenv
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function generateExplanation(issue) {
  const prompt = `Explain in simple terms (for a non-technical user) why the following SEO issue matters and how to fix it:\n\nSEO Issue: ${issue}\n\nExplanation:`;

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert SEO assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const explanation = response.data.choices[0].message.content.trim();
    return explanation;
  } catch (error) {
    return `Error generating explanation: ${error.message}`;
  }
}

module.exports = { generateExplanation };
