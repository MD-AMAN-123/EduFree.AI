import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

async function listAllModels() {
    const apiKey = "AIzaSyB5GJEuKcW_urnTJUb1Q6VMRwvteFozGQU";
    if (!apiKey) {
        console.error("No API key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
        console.log("Fetching models...");
        // Use a generic test to see what works
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const res = await model.generateContent("test");
        console.log("Connection Success with 'gemini-pro'");
    } catch (e) {
        console.error("Connection Failed with 'gemini-pro':", e);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const res = await model.generateContent("test");
        console.log("Connection Success with 'gemini-1.5-flash'");
    } catch (e) {
        console.error("Connection Failed with 'gemini-1.5-flash':", e);
    }
}

listAllModels();
