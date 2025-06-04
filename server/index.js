const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

console.log('[DEBUG] 本文の中身:', content);


app.post('/summarize', async (req, res) => {
    const { content } = req.body;
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.API_KEY}`,
            {
                contents: [{ parts: [{ text: '次の内容を1行で要約してください：' + content }] }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
});

app.listen(3001, () => console.log('✅ サーバー起動: http://localhost:3001'));
