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
    
    // Check if the last message is a short, simple greeting
    const lastUserMessage = chatHistory[chatHistory.length - 1].parts[0].text.toLowerCase().trim();
    const isGreeting = ['hi', 'hello', 'hey', 'what\'s up', 'yo'].includes(lastUserMessage);

    let systemInstruction;
    
    // Choose the system instruction based on the user's intent
    if (isGreeting) {
        systemInstruction = `You are a friendly and helpful AI assistant. Respond to the user's greeting in a friendly, conversational tone. Do not provide any code or website-building assistance.`;
    } else {
        systemInstruction = `You are a world-class AI website builder. Your purpose is to write complete, single-file HTML web applications based on user requests. Do not provide any conversational text, just the code and a brief explanation of what you generated.`;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
        contents: chatHistory,
        systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    let apiResponse;
    try {
        apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('API Error:', apiResponse.status, errorText);
            res.status(apiResponse.status).json({ error: 'Failed to get a response from the Gemini API.' });
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked'
        });

        for await (const chunk of apiResponse.body) {
            res.write(chunk);
        }

        res.end();

    } catch (error) {
        console.error('Server error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'An unexpected error occurred.' });
        }
    }
};
