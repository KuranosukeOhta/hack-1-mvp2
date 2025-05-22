import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// サーバーの最大実行時間を30秒に設定
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // リクエストボディからメッセージを取得
    const { messages } = await req.json();
    
    // OpenAIモデルを使用してテキストを生成
    const result = streamText({
      model: openai('gpt-4o'),
      messages,
      system: 'あなたは役立つアシスタントです。簡潔で正確な返答を心がけてください。添付ファイルについての情報が含まれている場合は、それに適切に対応してください。',
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    // ストリーミングレスポンスを返す
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'チャットAPIでエラーが発生しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 