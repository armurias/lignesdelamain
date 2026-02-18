import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn("OPENAI_API_KEY is not defined locally. This may cause issues in development if not using a shim.");
}

export const openai = new OpenAI({
    apiKey: apiKey,
});
