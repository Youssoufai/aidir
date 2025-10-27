import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const res = await model.generateContent("Say hello");
    console.log(res.response.text());
}
test();
