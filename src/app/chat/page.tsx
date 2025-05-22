'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [projectInfo, setProjectInfo] = useState({
    title: '',
    description: '',
    category: '',
  });

  // AIチャットの初期化
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    initialMessages: [
      {
        id: 'initial',
        role: 'assistant',
        content: 'こんにちは！クリエイティブログへようこそ。新しいプロジェクトを始めましょう。まず、どのようなプロジェクトを作成したいですか？例えば「Webデザイン」「グラフィックデザイン」「UIデザイン」などの分野を教えてください。',
      }
    ],
  });

  // ユーザーの返答から情報を抽出
  const analyzeMessages = () => {
    if (messages.length < 3) return;

    const userMessages = messages.filter(m => m.role === 'user');
    
    // ステップに応じて情報を抽出
    if (step === 1 && userMessages.length >= 1) {
      // カテゴリを抽出
      const firstUserMessage = userMessages[0].content as string;
      let category = '';
      
      if (firstUserMessage.includes('Web') || firstUserMessage.includes('ウェブ')) {
        category = 'Webデザイン';
      } else if (firstUserMessage.includes('グラフィック') || firstUserMessage.includes('ポスター')) {
        category = 'グラフィックデザイン';
      } else if (firstUserMessage.includes('UI') || firstUserMessage.includes('アプリ')) {
        category = 'UIデザイン';
      } else {
        category = 'その他';
      }
      
      setProjectInfo(prev => ({ ...prev, category }));
      
      // 次のメッセージを準備してステップを進める
      setTimeout(() => {
        setStep(2);
      }, 1000);
    }
    
    if (step === 2 && userMessages.length >= 2) {
      // プロジェクトのタイトルを抽出
      const secondUserMessage = userMessages[1].content as string;
      const title = secondUserMessage.length > 50 
        ? `${secondUserMessage.substring(0, 50)}...` 
        : secondUserMessage;
      
      setProjectInfo(prev => ({ ...prev, title }));
      
      // 次のメッセージを準備してステップを進める
      setTimeout(() => {
        setStep(3);
      }, 1000);
    }
    
    if (step === 3 && userMessages.length >= 3) {
      // プロジェクトの説明を抽出
      const thirdUserMessage = userMessages[2].content as string;
      const description = thirdUserMessage;
      
      setProjectInfo(prev => ({ ...prev, description }));
      
      // 次のステップへ
      setTimeout(() => {
        setStep(4);
      }, 1000);
    }
  };

  // メッセージが変更されたときに情報を抽出
  if (messages.length >= 2) {
    analyzeMessages();
  }

  // 次のAIメッセージを生成
  const getNextAIMessage = () => {
    if (step === 2) {
      return `${projectInfo.category}のプロジェクトですね！素晴らしいです。次に、このプロジェクトのタイトルを教えてください。簡潔で覚えやすいものが良いでしょう。`;
    }
    
    if (step === 3) {
      return `「${projectInfo.title}」というタイトルですね。このプロジェクトについて、もう少し詳しく教えてください。どのような目的や目標がありますか？`;
    }
    
    if (step === 4) {
      return `ありがとうございます！プロジェクトの情報が揃いました。\n\n【プロジェクト情報】\n・カテゴリ: ${projectInfo.category}\n・タイトル: ${projectInfo.title}\n・説明: ${projectInfo.description}\n\nこの内容でプロジェクトを作成しますか？「作成する」ボタンを押すと、プロジェクトが作成されます。`;
    }
    
    return '';
  };

  // チャットフォームのサブミットハンドラ
  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await handleSubmit(e);
    
    // AIの次の質問を追加
    const nextMessage = getNextAIMessage();
    if (nextMessage && step < 4) {
      setTimeout(() => {
        const newMessage = {
          id: `ai-${uuidv4()}`,
          role: 'assistant' as const,
          content: nextMessage,
        };
        
        // @ts-expect-error - ここでは簡易的に型エラーを無視
        messages.push(newMessage);
      }, 1000);
    }
  };

  // プロジェクトを作成して保存
  const createProject = () => {
    try {
      // ローカルストレージのキー
      const LS_PROJECTS_KEY = 'design-log-projects';
      
      // 新しいプロジェクトを作成
      const newProject = {
        id: uuidv4(),
        title: projectInfo.title || '無題のプロジェクト',
        description: projectInfo.description || '',
        category: projectInfo.category || 'その他',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        status: 'planning',
        logs: [],
        logsCount: 0
      };
      
      // 既存のプロジェクトを取得
      const storedProjects = localStorage.getItem(LS_PROJECTS_KEY);
      const projects = storedProjects ? JSON.parse(storedProjects) : [];
      
      // 新しいプロジェクトを追加
      projects.push(newProject);
      
      // ローカルストレージに保存
      localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(projects));
      
      // プロジェクト詳細ページへリダイレクト
      router.push(`/projects/${newProject.id}`);
    } catch (error) {
      console.error('プロジェクトの作成に失敗しました:', error);
      alert('プロジェクトの作成に失敗しました');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <Link 
          href="/"
          className="text-primary hover:underline mb-2 inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          ホームに戻る
        </Link>
        
        <h1 className="text-2xl font-bold mt-4">新しいプロジェクトを作成</h1>
        <p className="text-muted-foreground">AIとの対話を通じてプロジェクトを設定します</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* チャット履歴表示エリア */}
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">対話履歴</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 pb-0">
              {messages.map(message => (
                <div 
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary/10 ml-12' 
                      : 'bg-muted/50 mr-12 border'
                  }`}
                >
                  <div className="font-medium mb-1 text-sm">
                    {message.role === 'user' ? 'あなた' : 'AI'}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">
                    {typeof message.content === 'string' 
                      ? message.content
                      : message.parts?.map((part, i) => 
                          part.type === 'text' ? <span key={`${message.id}-part-${i}`}>{part.text}</span> : null
                        )
                    }
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="p-3 rounded-lg bg-muted/50 mr-12 border">
                  <div className="font-medium mb-1 text-sm">AI</div>
                  <div className="animate-pulse text-sm">入力中...</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-4 border-t mt-auto">
              <form 
                onSubmit={handleChatSubmit}
                className="flex items-center gap-2 w-full"
              >
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="メッセージを入力..."
                  className="flex-1"
                  disabled={isLoading || step >= 4}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !input.trim() || step >= 4}
                >
                  <Send className="h-4 w-4 mr-2" />
                  送信
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          {/* プロジェクト情報サマリー */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">プロジェクト情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">カテゴリ</p>
                <p className="font-medium">{projectInfo.category || '未設定'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">タイトル</p>
                <p className="font-medium">{projectInfo.title || '未設定'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">説明</p>
                <p className="text-sm line-clamp-4">{projectInfo.description || '未設定'}</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col border-t pt-4">
              <Button
                onClick={createProject}
                className="w-full"
                disabled={step < 4}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                プロジェクトを作成する
              </Button>
              
              <p className="text-xs text-muted-foreground mt-4">
                AIとの対話を通じてプロジェクト情報を設定します。すべての情報を入力すると作成ボタンが有効になります。
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 