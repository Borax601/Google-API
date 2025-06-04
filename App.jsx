import { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const response = await fetch('http://localhost:3001/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.slice(0, 4000) })
      });
      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '要約に失敗しました';
      setSummary(result);
    } catch (error) {
      setSummary('エラーが発生しました');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>URL 1行要約アプリ</h2>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="要約したいURLを入力"
        style={{ width: '80%', padding: '8px' }}
      />
      <button onClick={handleSubmit} style={{ marginLeft: '10px', padding: '8px 16px' }}>
        要約する
      </button>
      <p style={{ marginTop: 20 }}>結果：{summary}</p>
    </div>
  );
}

export default App;
