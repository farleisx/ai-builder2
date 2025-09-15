const fetch = require('node-fetch');

// This is the Vercel serverless function entry point
export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { chatHistory } = req.body;
    if (!chatHistory || chatHistory.length === 0) {
        return res.status(400).json({ error: 'Chat history is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key is not configured as an environment variable.' });
    }

    const lastUserMessage = chatHistory[chatHistory.length - 1].parts[0].text.toLowerCase();
    const isCodeRequest = lastUserMessage.includes('build') || lastUserMessage.includes('create') || lastUserMessage.includes('generate') || lastUserMessage.includes('fix') || lastUserMessage.includes('debug') || lastUserMessage.includes('code');

    let agentPrompt = '';

    if (isCodeRequest) {
        agentPrompt = `You are an expert full-stack developer and a world-class AI website builder. Your sole purpose is to write complete, single-file, mobile-responsive HTML web applications based on user requests. Always include all HTML, CSS, and JavaScript in one file. Do not provide any conversational text, just the code.`;
    } else {
        agentPrompt = `You are a friendly, conversational AI assistant. You can chat with the user and answer questions, but you are also an expert on web development and can help them build websites if they ask. Always maintain a helpful and positive tone.`;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
        contents: chatHistory,
        systemInstruction: { parts: [{ text: agentPrompt }] }
    };

    let apiResponse;
    try {
        apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const apiResult = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error('API Error:', apiResult);
            return res.status(apiResponse.status).json({ error: 'Failed to get response from Gemini API.' });
        }

        const generatedText = apiResult.candidates?.[0]?.content?.parts?.[0]?.text || 'I am sorry, I could not generate a response. Please try again.';

        res.status(200).json({ text: generatedText });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
};
