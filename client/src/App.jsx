import { useState } from 'react';
import orochiImg from './assets/orochi.png';
import './App.css';

function App() {
  // stateを「text」から「keyword」に変更
  const [keyword, setKeyword] = useState('');
  const [summary, setSummary] = useState('');

  const handleSubmit = async () => {
    setSummary('検索＆要約中...');
    try {
      const response = await fetch('http://localhost:3001/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 送信するデータを「text」から「keyword」に変更
        body: JSON.stringify({ keyword })
      });
      const data = await response.json();
      console.log('APIからの返答:', data);
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || data.error || '要約に失敗しました';
      setSummary(result);
    } catch (error) {
      setSummary('エラーが発生しました: ' + error.message);
    }
  };

  return (
    <div className="app-container">
      <img src={orochiImg} alt="おのっち キャラクター" />
      {/* タイトルを検索アプリ風に */}
      <h2>検索＆1行要約アプリ</h2>
      <div className="input-container">
        {/* textareaをinputに戻し、キーワード入力用に */}
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="要約したいキーワードを入力"
        />
        <button onClick={handleSubmit}>検索＆要約</button>
      </div>
      <p style={{ marginTop: 20 }}>結果：{summary}</p>
    </div>
  );
}

export default App;