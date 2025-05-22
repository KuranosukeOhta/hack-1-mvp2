'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Share2, ArrowLeft, MessageCircle, ChevronRight, Brain } from 'lucide-react';

interface LogMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Log {
  id: string;
  title: string;
  timestamp: string;
  tags: string[];
  messages: LogMessage[];
  summary?: string;
  insights?: string[];
  nextSteps?: string[];
}

// ローカルストレージのキー
const LS_LOGS_PREFIX = 'design-log-logs-';

// サンプルログデータ
const sampleLogsData: Record<string, Log> = {
  '101': {
    id: '101',
    title: 'コンセプト決め',
    timestamp: '2023-10-15T14:30:00Z',
    tags: ['アイデア出し', 'コンセプト', 'ブレスト'],
    messages: [
      {
        role: 'assistant',
        content: 'こんにちは！今日のデザイン制作について教えてください。何を作業しましたか？どんな課題や発見がありましたか？'
      },
      {
        role: 'user',
        content: 'ポートフォリオサイトのコンセプトを考えていました。個性的で印象に残るものにしたいけど、派手すぎず自分の作品をしっかり見せられるバランスが難しいです。'
      },
      {
        role: 'assistant',
        content: 'なるほど、ポートフォリオサイトのコンセプト決めですね。バランスの取り方が課題になっているんですね。何かインスピレーションになるものや、特に表現したい自分のテーマはありますか？'
      },
      {
        role: 'user',
        content: 'デジタルと自然の融合というテーマを考えています。作品がスクロールに合わせて成長する植物のように展開されるビジュアル表現ができたら面白いかなと。でもそれを実装する技術的な方法がまだ分からなくて。'
      },
      {
        role: 'assistant',
        content: '「デジタルと自然の融合」というテーマは素晴らしいですね！スクロールに合わせて植物が成長するようなビジュアル表現は、訪問者の印象に残る独自性のある演出になりそうです。\n\n技術的な実装については、JavaScriptのIntersection ObserverやScrollTriggerのようなライブラリを使うことで、スクロール位置に応じたアニメーションを制御できます。また、SVGアニメーションやCSS transformを組み合わせることも一つの方法です。\n\nコンセプトをより具体化するために、どのような種類の植物や自然要素を取り入れたいですか？また、あなたの作品のジャンルや特徴は何ですか？'
      },
      {
        role: 'user',
        content: '作品は主にUIデザインとイラストです。植物は、シンプルな線画のようなスタイルで、最初は小さな芽から始まり、枝が伸びて花が咲くような表現ができたらと思っています。色は深い緑をベースにして、アクセントカラーとして珊瑚色を使いたいです。'
      },
      {
        role: 'assistant',
        content: 'UIデザインとイラストを中心としたポートフォリオですね。線画スタイルの植物表現と、深緑と珊瑚色のカラーパレットは、洗練された印象を与えながらも温かみのある組み合わせで素敵だと思います。\n\n実装アイデアとしては：\n\n1. トップページで小さな芽から始まり、スクロールダウンするにつれて植物が成長\n2. 各プロジェクトセクションでは枝が伸び、そこから作品サムネイルが花のように展開\n3. 背景は薄いベージュなど自然な色味で、UIやイラスト作品が際立つようにする\n4. スクロールの深さに応じて背景色のグラデーションも微妙に変化させる\n\nこれにより、技術的にはJavaScriptのスクロールイベントと、CSSのtransformアニメーションを組み合わせて実現できそうです。コードの複雑さを抑えるなら、GreenSock(GSAP)のようなアニメーションライブラリの利用も検討してみてはいかがでしょうか？'
      }
    ],
    summary: '「デジタルと自然の融合」をテーマにしたポートフォリオサイトのコンセプト決定。スクロールに合わせて植物が成長するビジュアル表現を検討。深緑(#1a3c34)をベースに、アクセントカラーとして珊瑚色(#ff7f50)を採用予定。実装にはJavaScriptのスクロールイベントとCSSアニメーションの組み合わせが有効。',
    insights: [
      '独自性のあるインタラクションがユーザー体験を向上させる',
      'テーマ性のある表現方法がポートフォリオ全体の一貫性を生み出す',
      '技術的な実装と視覚的な表現のバランスが重要'
    ],
    nextSteps: [
      'スクロールアニメーションの技術調査（Intersection Observer, GSAP）',
      'ワイヤーフレームでページ構成を検討',
      'カラーパレットのサンプル作成と検証'
    ]
  },
  '102': {
    id: '102',
    title: 'レファレンス収集',
    timestamp: '2023-10-18T10:15:00Z',
    tags: ['リサーチ', 'インスピレーション'],
    messages: [
      // 省略
    ],
    summary: 'Awwwards、Behanceなどで参考になるサイトを20件ほど収集。特にパララックス効果とスクロールアニメーションの実装方法に注目。'
  }
};

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [log, setLog] = useState<Log | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 簡易的なinsights生成（実際はAIが分析する）
  const generateInsights = useCallback((log: Log): string[] => {
    return [
      'プロジェクトの方向性を明確にすることで作業効率が向上',
      '参考事例の分析が新しいアイデアを生み出すきっかけに',
      'ユーザー視点での考察が重要'
    ];
  }, []);
  
  // 簡易的なnextSteps生成（実際はAIが分析する）
  const generateNextSteps = useCallback((log: Log): string[] => {
    return [
      '次回のミーティングで進捗を共有',
      'フィードバックを基に改善点を洗い出す',
      '実装方法の技術調査を継続'
    ];
  }, []);
  
  // ログデータを正規化する関数
  const normalizeLog = useCallback((log: Log): Log => {
    return {
      ...log,
      tags: log.tags || [],
      messages: log.messages || [],
      insights: log.insights || generateInsights(log),
      nextSteps: log.nextSteps || generateNextSteps(log)
    };
  }, [generateInsights, generateNextSteps]);
  
  useEffect(() => {
    const loadLog = () => {
      try {
        // ブラウザ環境でのみ実行
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        const projectId = params.id as string;
        const logId = params.logId as string;
        
        // プロジェクトに紐づくログを読み込む
        const logsKey = `${LS_LOGS_PREFIX}${projectId}`;
        const storedLogs = localStorage.getItem(logsKey);
        
        if (storedLogs) {
          const logs = JSON.parse(storedLogs) as Log[];
          const foundLog = logs.find(l => l.id === logId);
          
          if (foundLog) {
            // ログデータを正規化
            setLog(normalizeLog(foundLog));
          } else {
            // LocalStorageにない場合はサンプルデータから探す
            const sampleLog = sampleLogsData[logId];
            setLog(sampleLog ? normalizeLog(sampleLog) : null);
          }
        } else {
          // ログデータがない場合はサンプルデータを使用
          const sampleLog = sampleLogsData[logId];
          setLog(sampleLog ? normalizeLog(sampleLog) : null);
        }
      } catch (error) {
        console.error('ログデータの読み込みに失敗しました:', error);
        const sampleLog = sampleLogsData[params.logId as string];
        setLog(sampleLog ? normalizeLog(sampleLog) : null);
      } finally {
        setLoading(false);
      }
    };
    
    loadLog();
  }, [params.id, params.logId, normalizeLog]);
  
  if (loading) return (
    <div className="container mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4" />
        <div className="h-4 bg-muted rounded w-2/3 mb-8" />
        <div className="h-64 bg-muted rounded mb-6" />
      </div>
    </div>
  );
  
  if (!log) return (
    <div className="container mx-auto p-6">
      <p>ログが見つかりません</p>
      <Link href={`/projects/${params.id}`} className="text-primary hover:underline mt-4 inline-flex items-center">
        <ArrowLeft className="mr-2 h-4 w-4" />
        プロジェクトに戻る
      </Link>
    </div>
  );
  
  return (
    <div className="container max-w-4xl mx-auto p-6">
      <header className="mb-6">
        <Link 
          href={`/projects/${params.id}`}
          className="text-primary hover:underline mb-2 inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          プロジェクトに戻る
        </Link>
        
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{log.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <time dateTime={log.timestamp}>
                {new Date(log.timestamp).toLocaleString('ja-JP')}
              </time>
            </div>
          </CardHeader>
          
          {log.tags && log.tags.length > 0 && (
            <CardContent className="pt-0 flex flex-wrap gap-1">
              {log.tags.map(tag => (
                <Badge key={`tag-${tag}`} variant="outline">
                  {tag}
                </Badge>
              ))}
            </CardContent>
          )}
        </Card>
      </header>
      
      <div className="mb-6">
        <Tabs defaultValue="dialog" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="dialog">
              <div className="flex items-center">
                <MessageCircle className="mr-2 h-4 w-4" />
                対話記録
              </div>
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <div className="flex items-center">
                <Brain className="mr-2 h-4 w-4" />
                AI分析
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dialog" className="mt-4 space-y-4">
            {log.messages && log.messages.length > 0 ? log.messages.map((message) => (
              <Card 
                key={`message-${message.role}-${Math.random()}`}
                className={`${
                  message.role === 'user' 
                    ? 'ml-12 border-primary/10 bg-primary/5' 
                    : 'mr-12'
                }`}
              >
                <CardHeader className="py-3">
                  <p className="font-medium text-sm">
                    {message.role === 'user' ? 'あなた' : 'AI'}
                  </p>
                </CardHeader>
                <CardContent className="py-0 text-sm">
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <p className="text-center text-muted-foreground">対話記録がありません</p>
            )}
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  サマリー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{log.summary}</p>
              </CardContent>
            </Card>
            
            {log.insights && log.insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    主な気づき・学び
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {log.insights.map((insight, index) => (
                      <li key={`insight-${insight.substring(0, 20)}`} className="flex items-start">
                        <Badge variant="outline" className="mr-2 mt-0.5 h-5 w-5 flex items-center justify-center p-0 text-primary">
                          {index + 1}
                        </Badge>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {log.nextSteps && log.nextSteps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <ChevronRight className="h-5 w-5 mr-2" />
                    次のステップ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {log.nextSteps.map((step, index) => (
                      <li key={`step-${step.substring(0, 20)}`} className="flex items-start">
                        <div className="mr-2 text-green-500">→</div>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-between border-t pt-6">
        <Link href={`/projects/${params.id}/log/new`}>
          <Button variant="outline" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            新しいログを記録
          </Button>
        </Link>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            PDFとして保存
          </Button>
          <Button className="gap-2">
            <Share2 className="h-4 w-4" />
            共有
          </Button>
        </div>
      </div>
    </div>
  );
} 