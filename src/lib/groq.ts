import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    console.warn("GROQ_API_KEY is not defined locally. This will hinder development.");
}

export const groq = new Groq({
    apiKey: apiKey,
});
