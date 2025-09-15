const fetch = require('node-fetch');

// This is the Vercel serverless function entry point
export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const userPrompt = req.body.prompt;
    if (!userPrompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // IMPORTANT: Get the API key securely from Vercel environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key is not configured as an environment variable.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const systemInstruction = `
        You are a world-class web developer. Given the following user request, generate a complete, single-file HTML website. The code should be fully self-contained in a single HTML file, including all necessary CSS and JavaScript within <style> and <script> tags. Use modern, clean design principles and ensure the website is fully mobile-responsive. The website should look and function professionally. Respond with ONLY the complete HTML code, nothing else.
    `;

    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
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
