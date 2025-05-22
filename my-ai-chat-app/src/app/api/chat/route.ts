import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

// OpenAI API設定
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || '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',
});
const openai = new OpenAIApi(configuration);

// Rate limiting object
const ratelimit = {
  tokens: 100,
  refillRate: 10, // 10 tokens per second
  lastRefillTimestamp: Date.now(),
  maxTokens: 100,
};

// Rate limiter function
function refillTokens() {
  const now = Date.now();
  const timePassed = now - ratelimit.lastRefillTimestamp;
  const tokensToAdd = Math.floor((timePassed / 1000) * ratelimit.refillRate);

  if (tokensToAdd > 0) {
    ratelimit.tokens = Math.min(ratelimit.maxTokens, ratelimit.tokens + tokensToAdd);
    ratelimit.lastRefillTimestamp = now;
  }
}

// POST handler
export async function POST(req: Request) {
  try {
    // Refill tokens for rate limiting
    refillTokens();
    
    // Check if we have tokens available
    if (ratelimit.tokens <= 0) {
      return new Response('Too many requests. Please try again later.', { status: 429 });
    }
    
    // Use a token
    ratelimit.tokens -= 1;

    // リクエストからメッセージを取得
    const { messages } = await req.json();

    // OpenAIにリクエストを送信
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Create a streaming response
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Error in chat API route:', error);
    return new Response('Error processing your request', { status: 500 });
  }
} 