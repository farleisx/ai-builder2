const fetch = require('node-fetch');

// This is the Vercel serverless function entry point
export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { chatHistory } = req.body;
    if (!chatHistory) {
        return res.status(400).json({ error: 'Chat history is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key is not configured as an environment variable.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
        contents: chatHistory,
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

        const generatedCode = apiResult.candidates?.[0]?.content?.parts?.[0]?.text || 'No code was generated. Please try a different prompt.';

        res.status(200).json({ code: generatedCode });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
};
