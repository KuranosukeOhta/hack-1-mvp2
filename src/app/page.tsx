import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, FolderOpen, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <main className="flex flex-col items-center max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">クリエイティブログ</h1>
          <p className="text-lg text-muted-foreground">
            AIを活用したデザイン制作プロセスの記録・管理ツール
          </p>
        </div>
        
        <div className="w-full grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                AIチャット
              </CardTitle>
              <CardDescription>
                AIとの対話を通じてアイデアを発展させる
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground pb-2">
              AIがデザインや制作プロセスについてのアドバイスを提供し、対話を通じてアイデアを整理します。
            </CardContent>
            <CardFooter>
              <Link href="/chat" className="w-full">
                <Button className="w-full">
                  チャットを始める
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <FolderOpen className="h-5 w-5 mr-2 text-primary" />
                プロジェクト管理
              </CardTitle>
              <CardDescription>
                デザインプロジェクトを整理し記録する
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground pb-2">
              プロジェクトごとに制作過程をログとして記録し、AIが分析してインサイトや次のステップを提案します。
            </CardContent>
            <CardFooter>
              <Link href="/projects" className="w-full">
                <Button variant="secondary" className="w-full">
                  プロジェクトを見る
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        <Card className="w-full bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              ツールの機能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>プロジェクトごとに制作プロセスを時系列で記録</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>AIとの対話を通じて気づきや発見を蓄積</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>自動的に制作フローチャートや報告書を生成</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>プロジェクト全体のインサイトをAIが分析</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <div className="pt-8 border-t border-border w-full flex justify-center">
          <p className="text-sm text-muted-foreground">
            Powered by AI SDK, Next.js and Shadcn UI
          </p>
        </div>
      </main>
    </div>
  );
}
