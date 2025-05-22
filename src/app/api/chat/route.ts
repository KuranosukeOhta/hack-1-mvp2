import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// サーバーの最大実行時間を30秒に設定
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // リクエストボディからメッセージとファイルを取得
    const { messages, files } = await req.json();
    
    // ファイルがある場合は処理
    let processedMessages = messages;
    if (files && files.length > 0) {
      // ファイル情報をメッセージに追加
      const fileInfo = files.map((file: { name: string; size: number; type: string }) => 
        `ファイル名: ${file.name}, サイズ: ${file.size}バイト, タイプ: ${file.type}`
      ).join('\n');
      
      // 最後のユーザーメッセージにファイル情報を追加
      const lastUserMessageIndex = [...processedMessages].reverse().findIndex(m => m.role === 'user');
      if (lastUserMessageIndex >= 0) {
        const actualIndex = processedMessages.length - 1 - lastUserMessageIndex;
        processedMessages = [
          ...processedMessages.slice(0, actualIndex),
          {
            ...processedMessages[actualIndex],
            content: `${processedMessages[actualIndex].content}\n\n添付ファイル情報:\n${fileInfo}`
          },
          ...processedMessages.slice(actualIndex + 1)
        ];
      }
    }
    
    // OpenAIモデルを使用してテキストを生成
    const result = streamText({
      model: openai('gpt-4o'),
      messages: processedMessages,
      system: 'あなたは役立つアシスタントです。簡潔で正確な返答を心がけてください。ユーザーが添付したファイルについても適切に言及してください。',
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