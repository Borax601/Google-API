const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

app.post('/summarize', async (req, res) => {
    const { url } = req.body;
    console.log('[DEBUG] 受信した url:', url);
    if (!url) {
        console.error('[ERROR] urlが空です');
        return res.status(400).json({ error: 'URLが指定されていません' });
    }
    try {
        // 1. URLからHTML取得
        const fetchRes = await axios.get(url, { responseType: 'text' });
        // 2. cheerioで<body>テキスト抽出
        const $ = cheerio.load(fetchRes.data);
        let bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        if (!bodyText) {
            console.error('[ERROR] <body>テキスト抽出失敗');
            return res.status(400).json({ error: '本文取得に失敗しました' });
        }
        // 最大4000文字に切る
        if (bodyText.length > 4000) bodyText = bodyText.slice(0, 4000);
        console.log('[DEBUG] 抽出した本文(4000字まで):', bodyText);
        // 3. Geminiへ送信
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.API_KEY}`,
            {
                contents: [{ parts: [{ text: '次の内容を1行で要約してください：' + bodyText }] }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
        console.log('[DEBUG] Gemini要約APIレスポンス:', response.data);
        // 4. 結果返却
        res.json(response.data);
    } catch (err) {
        console.error('[ERROR] 要約処理でエラー:', err);
        res.status(500).json({ error: '要約処理でエラーが発生しました', details: err.toString() });
    }
});

app.listen(3001, () => console.log('✅ サーバー起動: http://localhost:3001'));
