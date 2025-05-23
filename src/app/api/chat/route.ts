import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// サーバーの最大実行時間を30秒に設定
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // リクエストボディからメッセージとプロジェクトコンテキストを取得
    const { messages, projectContext } = await req.json();
    
    // システムプロンプトを設定
    const systemPrompt = `
      あなたは役立つアシスタントです。簡潔で正確な返答を心がけてください。
      添付ファイルについての情報が含まれている場合は、それに適切に対応してください。
      
      ${projectContext ? `
      --- プロジェクト情報 ---
      タイトル: ${projectContext.title || 'なし'}
      説明: ${projectContext.description || 'なし'}
      カテゴリ: ${projectContext.category || 'なし'}
      --- ここまで ---
      ` : ''}
    `;
    
    // OpenAIモデルを使用してテキストを生成
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
      tools: {
        // ファイル処理ツール
        processFile: {
          description: 'ファイルの内容を処理する',
          parameters: {
            fileContent: {
              type: 'string',
              description: 'ファイルの内容',
            },
            fileName: {
              type: 'string',
              description: 'ファイルの名前',
            },
            fileType: {
              type: 'string',
              description: 'ファイルのMIMEタイプ',
            },
          },
          execute: async ({ fileName, fileType }) => {
            // ここでファイル処理のロジックを実装
            return {
              processedContent: `ファイル名: ${fileName}、種類: ${fileType}を処理しました。`,
            };
          },
        },
      },
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