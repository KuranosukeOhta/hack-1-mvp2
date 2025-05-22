'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Send, Tag, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ローカルストレージのキー
const LS_PROJECTS_KEY = 'design-log-projects';
const LS_LOGS_PREFIX = 'design-log-logs-';

export default function NewLogPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [logTitle, setLogTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  // タグを追加する関数
  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
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
      }
      
      // 保存完了後、プロジェクト詳細ページへリダイレクト
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 500);
      
    } catch (error) {
      console.error('ログの保存に失敗しました:', error);
      alert('ログの保存に失敗しました');
      setIsSubmitting(false);
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
        <Link 
          href={`/projects/${projectId}`}
          className="text-primary hover:underline mb-2 inline-flex items-center"
        >
          ← プロジェクトに戻る
        </Link>
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
              <label htmlFor="log-title" className="block text-sm font-medium mb-1">
                ログタイトル <span className="text-red-500">*</span>
              </label>
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