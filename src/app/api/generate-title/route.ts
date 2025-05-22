import { OpenAI } from 'openai';

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
    
    // OpenAI APIを直接使用してタイトル生成
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        { role: 'user', content: 'この会話の内容を表す、簡潔なタイトルを30文字以内で生成してください。タイトルのみを返してください。' }
      ],
      temperature: 0.7,
      max_tokens: 50,
    });
    
    // レスポンスを返す
    const title = response.choices[0]?.message?.content || '新規ログ';
    return Response.json({ title: title.trim() });
  } catch (error) {
    console.error('Error in title generation API:', error);
    return new Response(
      JSON.stringify({ error: 'タイトル生成中にエラーが発生しました', title: '新規ログ' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 