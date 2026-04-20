import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal manual .env.local loader
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, "../.env.local");
        const content = fs.readFileSync(envPath, "utf-8");
        const vars = {};
        content.split("\n").forEach(line => {
            const [key, ...value] = line.split("=");
            if (key && value) vars[key.trim()] = value.join("=").trim();
        });
        return vars;
    } catch (e) {
        return {};
    }
}

async function runModelTests() {
    const env = loadEnv();
    const apiKey = env.VITE_GEMINI_API_KEY;
    console.log("Checking API Key prefix:", apiKey ? apiKey.substring(0, 10) + "..." : "MISSING");

    if (!apiKey) {
        console.error("FATAL: VITE_GEMINI_API_KEY is not set in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTest = [
        "gemma-4-31b-it",
        "gemma-4-26b-a4b-it",
        "gemma-2-9b-it",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];

    console.log("\n--- Starting Model Connectivity Tests ---\n");

    for (const modelName of modelsToTest) {
        try {
            process.stdout.write(`Testing [${modelName}]... `);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'ready'");
            const response = await result.response;
            console.log(`✅ Success: ${response.text().trim()}`);
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
}

runModelTests();
