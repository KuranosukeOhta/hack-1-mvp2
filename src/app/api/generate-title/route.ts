import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

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
    
    // 非ストリーミング方式でテキスト生成
    const { text: title } = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: [
        ...messages,
        { role: 'user', content: 'この会話の内容を表す、簡潔なタイトルを30文字以内で生成してください。タイトルのみを返してください。' }
      ],
      temperature: 0.7,
      maxTokens: 50,
    });
    
    // レスポンスを返す
    return Response.json({ title: title.trim() || '新規ログ' });
  } catch (error) {
    console.error('Error in title generation API:', error);
    return new Response(
      JSON.stringify({ error: 'タイトル生成中にエラーが発生しました', title: '新規ログ' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}