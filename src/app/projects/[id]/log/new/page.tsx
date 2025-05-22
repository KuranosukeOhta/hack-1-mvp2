'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Send, Tag, X, Brain, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// ローカルストレージのキー
const LS_PROJECTS_KEY = 'design-log-projects';
const LS_LOGS_PREFIX = 'design-log-logs-';
const LS_ALL_TAGS_KEY = 'design-log-all-tags';

export default function NewLogPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [logTitle, setLogTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [allUsedTags, setAllUsedTags] = useState<string[]>([]);
  
  // AIチャットの初期化（AI SDKを使用）
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    initialMessages: [
      {
        id: 'initial',
        role: 'assistant',
        content: 'こんにちは！今日のデザイン制作について教えてください。何を作業しましたか？どんな課題や発見がありましたか？',
      }
    ],
  });

  // 初回マウント時に過去のタグを読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedTags = localStorage.getItem(LS_ALL_TAGS_KEY);
        if (storedTags) {
          setAllUsedTags(JSON.parse(storedTags));
        }
      } catch (error) {
        console.error('タグの読み込みに失敗しました:', error);
      }
    }
  }, []);
  
  // タグを追加する関数
  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
      
      // 全体のタグリストに追加
      if (!allUsedTags.includes(currentTag.trim())) {
        const newAllTags = [...allUsedTags, currentTag.trim()];
        setAllUsedTags(newAllTags);
        
        // ローカルストレージに保存
        if (typeof window !== 'undefined') {
          localStorage.setItem(LS_ALL_TAGS_KEY, JSON.stringify(newAllTags));
        }
      }
    }
  };
  
  // 既存タグを選択する
  const selectExistingTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };
  
  // タグを削除する関数
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // タグ入力でEnterキーを押したときの処理
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  // タイトルを自動生成する関数
  const generateTitle = () => {
    if (messages.length < 2) {
      alert('AIとの対話がまだ不十分です。もう少し会話を続けてください。');
      return;
    }
    
    // ユーザーの最初のメッセージからタイトルを生成
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const firstUserMessage = userMessages[0].content || '';
      if (typeof firstUserMessage === 'string') {
        // 簡易的なタイトル生成（最初の10-15文字を使用）
        const words = firstUserMessage.split(' ');
        let title = '';
        
        if (firstUserMessage.length <= 20) {
          title = firstUserMessage;
        } else {
          const endPos = firstUserMessage.indexOf('。');
          if (endPos > 0 && endPos < 30) {
            title = firstUserMessage.substring(0, endPos);
          } else {
            // 最初の20文字を使用
            title = `${firstUserMessage.substring(0, Math.min(20, firstUserMessage.length))}...`;
          }
        }
        
        setLogTitle(title);
      }
    }
  };
  
  // ログを保存する関数
  const saveLog = async () => {
    if (!logTitle) {
      alert('ログのタイトルを入力してください');
      return;
    }
    
    if (messages.length < 2) {
      alert('AIとの対話を少なくとも1回行ってください');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ログデータを準備
      const logId = uuidv4();
      const logData = {
        id: logId,
        title: logTitle,
        projectId,
        timestamp: new Date().toISOString(),
        tags,
        messages: messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : 
                   m.parts?.[0]?.type === 'text' ? m.parts[0].text : '',
        })),
        summary: generateSummary(messages),
      };
      
      // プロジェクトにログ数を更新
      if (typeof window !== 'undefined') {
        // プロジェクトデータを取得
        const storedProjects = localStorage.getItem(LS_PROJECTS_KEY);
        if (storedProjects) {
          const projects = JSON.parse(storedProjects);
          const projectIndex = projects.findIndex((p: { id: string }) => p.id === projectId);
          
          if (projectIndex >= 0) {
            // プロジェクトのログ数を更新
            projects[projectIndex].logsCount = (projects[projectIndex].logsCount || 0) + 1;
            projects[projectIndex].updatedAt = new Date().toISOString().split('T')[0];
            localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(projects));
          }
        }
        
        // ログデータを保存
        const logsKey = getLogStorageKey(projectId);
        const storedLogs = localStorage.getItem(logsKey);
        const logs = storedLogs ? JSON.parse(storedLogs) : [];
        logs.push(logData);
        localStorage.setItem(logsKey, JSON.stringify(logs));
        
        // 使用したタグをグローバルタグリストに追加
        const allTags = [...allUsedTags];
        for (const tag of tags) {
          if (!allTags.includes(tag)) {
            allTags.push(tag);
          }
        }
        localStorage.setItem(LS_ALL_TAGS_KEY, JSON.stringify(allTags));
      }
      
      // プロジェクト詳細ページへリダイレクト
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 500);
      
    } catch (error) {
      console.error('ログの保存に失敗しました:', error);
      alert('ログの保存に失敗しました');
      setIsSubmitting(false);
    }
  };
  
  // プロジェクトページに戻る
  const navigateToProject = () => {
    if (messages.length > 1 || logTitle || tags.length > 0) {
      setShowExitConfirm(true);
    } else {
      router.push(`/projects/${projectId}`);
    }
  };
  
  // 簡易的なサマリー生成（実際はもっと高度な処理が必要）
  const generateSummary = (msgs: Array<{ 
    role: string; 
    content: string | { text?: string }; 
    parts?: Array<{ type: string; text: string }> 
  }>) => {
    // ユーザーの最初のメッセージから50文字程度を抽出
    const userMessages = msgs.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const firstUserMessage = userMessages[0].content || '';
      if (typeof firstUserMessage === 'string') {
        return firstUserMessage.length > 100
          ? `${firstUserMessage.substring(0, 100)}...`
          : firstUserMessage;
      }
    }
    return '';
  };
  
  // チャットフォームのサブミットハンドラをラップ
  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await handleSubmit(e);
  };
  
  // ローカルストレージのログキーを生成
  const getLogStorageKey = (pid: string): string => `${LS_LOGS_PREFIX}${pid}`;
  
  return (
    <div className="container max-w-5xl mx-auto p-6">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="hover:bg-transparent p-0 hover:text-primary flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                プロジェクトに戻る
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ページを離れますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  入力中のデータは保存されません。本当にプロジェクトページに戻りますか？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.push(`/projects/${projectId}`)}>
                  はい、戻ります
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <h1 className="text-2xl font-bold mt-4">新規ログを記録</h1>
        <p className="text-muted-foreground">AIと対話して今日の制作活動を記録しましょう</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* チャット履歴表示エリア */}
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-2">
              <h2 className="font-medium">対話履歴</h2>
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
                  disabled={isLoading || isSubmitting}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || isSubmitting || !input.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  送信
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
        
        {/* ログ情報入力エリア */}
        <Card>
          <CardHeader>
            <h2 className="font-medium">ログ情報</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="log-title" className="block text-sm font-medium mb-1">
                  ログタイトル <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={generateTitle}
                  title="タイトルを自動生成"
                  className="h-6 w-6"
                  disabled={messages.length < 2}
                >
                  <Brain className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id="log-title"
                type="text"
                value={logTitle}
                onChange={(e) => setLogTitle(e.target.value)}
                placeholder="例: デザインコンセプト決定"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="tag-input" className="block text-sm font-medium mb-1">
                タグ
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="tag-input"
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="タグを入力..."
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  disabled={!currentTag.trim() || isSubmitting}
                >
                  <Tag className="h-4 w-4" />
                </Button>
                
                {allUsedTags.length > 0 && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="px-2">
                        <Tag className="h-3.5 w-3.5 mr-1" />
                        過去のタグ
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                      <SheetHeader>
                        <SheetTitle>過去に使用したタグ</SheetTitle>
                        <SheetDescription>
                          クリックして追加します
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex flex-wrap gap-2 mt-6">
                        {allUsedTags.map(tag => (
                          <Badge 
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10"
                            onClick={() => {
                              selectExistingTag(tag);
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <SheetFooter className="mt-6">
                        <SheetClose asChild>
                          <Button variant="outline">閉じる</Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map(tag => (
                    <Badge 
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col border-t pt-4">
            <Button
              onClick={saveLog}
              className="w-full"
              disabled={isSubmitting || !logTitle || messages.length < 2}
            >
              {isSubmitting ? '保存中...' : 'ログを保存'}
            </Button>
            
            <p className="text-xs text-muted-foreground mt-4">
              * は必須項目です。AIとの対話を通して制作プロセスを記録することで、振り返りや報告書作成が効率化されます。
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 