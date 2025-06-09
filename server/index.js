const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const customsearch = google.customsearch('v1');

app.post('/summarize', async (req, res) => {
    // クライアントから受け取るデータを keyword に変更
    const { keyword } = req.body;
    console.log('[DEBUG] 受信したキーワード:', keyword);

    if (!keyword) {
        console.error('[ERROR] keywordが空です');
        return res.status(400).json({ error: 'キーワードが指定されていません' });
    }

    try {
        // a. Google検索実行
        const results = await google({ query: keyword });
        if (!results || results.length === 0) {
            console.error('[ERROR] Google検索で結果が見つかりませんでした');
            return res.status(404).json({ error: '検索結果が見つかりませんでした' });
        }
        // b. 1位のURL取得
        const topUrl = results[0].link;
        console.log('[DEBUG] 検索1位のURL:', topUrl);

        // c. axiosとcheerioで本文抽出
        const pageRes = await axios.get(topUrl, { responseType: 'text' });
        const $ = cheerio.load(pageRes.data);
        let bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        if (!bodyText) {
            console.error('[ERROR] <body>からテキストが取得できませんでした');
            return res.status(400).json({ error: '要約対象ページから本文が取得できませんでした' });
        }
        // 最大4000文字に制限
        if (bodyText.length > 4000) bodyText = bodyText.slice(0, 4000);

        // d. Gemini AIで要約
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.API_KEY}`,
            {
                contents: [{ parts: [{ text: '次の内容を1行で要約してください：' + bodyText }] }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('[DEBUG] Gemini要約APIレスポンス:', response.data);
        res.json(response.data);
    } catch (err) {
        console.error('[ERROR] サーバー処理中にエラー:', err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'サーバー処理中にエラーが発生しました', details: err.message });
    }
});

app.listen(3001, () => console.log('✅ サーバー起動: http://localhost:3001'));