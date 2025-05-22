// サーバーの最大実行時間を30秒に設定
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // リクエストボディからメッセージを取得
    const { messages } = await req.json();
    
    // システムプロンプトを設定
    const systemPrompt = `
      あなたはデザインプロジェクトのログタイトルを生成するAIアシスタントです。
      ユーザーとの対話内容から、簡潔で分かりやすいログタイトルを生成してください。
      タイトルは30文字以内に収め、具体的かつ要点を捉えたものにしてください。
      デザインプロセスや作業内容が分かるタイトルが望ましいです。
    `;
    
    // OpenAI APIを使用してタイトルを生成
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          { role: 'user', content: 'この会話の内容を表す、簡潔なタイトルを30文字以内で生成してください。タイトルのみを返してください。' }
        ],
        max_tokens: 50,
        temperature: 0.7,
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 生成されたタイトルを取得
    const title = data.choices[0]?.message?.content?.trim() || '新規ログ';
    
    // レスポンスを返す
    return Response.json({ title });
  } catch (error) {
    console.error('Error in title generation API:', error);
    return new Response(
      JSON.stringify({ error: 'タイトル生成中にエラーが発生しました', title: '新規ログ' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 