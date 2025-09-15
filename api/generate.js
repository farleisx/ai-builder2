const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Main endpoint to serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to generate website code using Gemini API
app.post('/generate-website', async (req, res) => {
    const userPrompt = req.body.prompt;
    if (!userPrompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // IMPORTANT: Get the API key securely from Replit secrets
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key is not configured in Replit secrets.' });
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

        res.json({ code: generatedCode });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log('Ensure you have a GEMINI_API_KEY environment variable set in Replit secrets.');
});
