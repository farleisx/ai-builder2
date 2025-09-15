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
    
    // This single system instruction tells the AI to be a dual-purpose agent.
    // It is now up to the AI to decide whether to be conversational or to generate code.
    const systemInstruction = `You are a friendly and helpful AI web development assistant. Your primary goal is to help the user build websites and write code.
    
    If the user asks for a website, app, or code snippet, respond with a complete, single-file HTML web application. Do not provide any conversational text, just the code and a brief explanation of what you generated. Wrap the code in markdown with the correct language tag (e.g., \`\`\`html).

    If the user's query is a general question, a greeting, or a request for advice, respond conversationally and do not provide any code. Be friendly and maintain a positive tone.`;

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

        // Check if the response is ok before proceeding with the stream
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

        // Stream the response from the API to the client
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
