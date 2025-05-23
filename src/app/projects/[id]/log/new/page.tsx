'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X, Brain, ArrowLeft, Send, Paperclip, Image, FileText, File } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
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
import Link from 'next/link';

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
  const [allUsedTags, setAllUsedTags] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
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

  // チャットメッセージが更新されたときに一番下にスクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, []);
  
  // メッセージが更新されたときに自動スクロール
  useLayoutEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // 別のuseEffectでメッセージの変更を監視
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

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

  // ドラッグ&ドロップのイベントハンドラ設定
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragOver = (e: DragEvent) => {
      preventDefault(e);
      if (dropArea) dropArea.classList.add('border-primary');
    };

    const handleDragLeave = (e: DragEvent) => {
      preventDefault(e);
      if (dropArea) dropArea.classList.remove('border-primary');
    };

    const handleDrop = (e: DragEvent) => {
      preventDefault(e);
      if (dropArea) dropArea.classList.remove('border-primary');
      
      if (e.dataTransfer?.files) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    };

    // クリップボードからの貼り付け
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        handleFiles(Array.from(e.clipboardData.files));
      }
    };

    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    document.addEventListener('paste', handlePaste);

    return () => {
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('drop', handleDrop);
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  // ファイル選択ダイアログを開く
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ファイル選択時の処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // ファイル処理共通関数
  const handleFiles = (selectedFiles: File[]) => {
    // 既存のファイルと新しいファイルを結合
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  // ファイルの種類に応じたアイコンを返す
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" aria-label="画像ファイル" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-4 w-4" aria-label="PDFファイル" />;
    }
    return <File className="h-4 w-4" aria-label="その他のファイル" />;
  };

  // ファイルを削除
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // ファイルサイズを読みやすい形式に変換
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };
  
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
  const generateTitle = async () => {
    if (messages.length < 2) {
      alert('AIとの対話がまだ不十分です。もう少し会話を続けてください。');
      return;
    }
    
    try {
      // API呼び出しでタイトル生成
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });
      
      if (!response.ok) {
        throw new Error('タイトル生成に失敗しました');
      }
      
      const data = await response.json();
      setLogTitle(data.title);
    } catch (error) {
      console.error('タイトル生成エラー:', error);
      
      // エラー時はフォールバックとして簡易的なタイトル生成
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const firstUserMessage = userMessages[0].content || '';
      if (typeof firstUserMessage === 'string') {
        // 簡易的なタイトル生成（最初の10-15文字を使用）
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
      // ファイルの処理（実際のアプリではアップロード処理が必要）
      // この例ではファイル名とサイズのみを保存
      const fileInfos = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }));
      
      // ログデータを準備
      const logId = uuidv4();
      const logData = {
        id: logId,
        title: logTitle,
        projectId,
        timestamp: new Date().toISOString(),
        tags,
        files: fileInfos,
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
  
  // 簡易的なサマリー生成（実際はもっと高度な処理が必要）
  const generateSummary = (msgs: { role: string; content: string | unknown }[]) => {
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
    if (!input.trim() && files.length === 0) return;
    
    // ファイルがある場合はメッセージに追加
    if (files.length > 0) {
      const fileMessage = `[添付ファイル: ${files.map(f => f.name).join(', ')}]`;
      const combinedInput = input.trim() ? `${input}\n\n${fileMessage}` : fileMessage;
      
      // 入力フィールドを更新
      const inputElement = document.querySelector('input[name="input"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.value = combinedInput;
        // イベントを発火させて値を更新
        const event = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(event);
      }
    }
    
    // 標準のハンドラを呼び出し
    await handleSubmit(e);
    
    // ファイルリストをクリア
    setFiles([]);
  };
  
  // ローカルストレージのログキーを生成
  const getLogStorageKey = (pid: string): string => `${LS_LOGS_PREFIX}${pid}`;
  
  return (
    <div className="container mx-auto p-6">
      <header className="mb-6 flex justify-between items-center">
        <Link 
          href={`/projects/${projectId}`}
          className="text-primary hover:underline mb-2 inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          プロジェクトに戻る
        </Link>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* チャット履歴表示エリア */}
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-2">
              <h2 className="font-medium">対話履歴</h2>
            </CardHeader>
            <CardContent ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pb-0">
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
            <CardFooter className="pt-4 border-t mt-auto flex-col">
              {/* ファイル一覧 */}
              {files.length > 0 && (
                <div className="w-full mb-3 p-2 border rounded-md bg-muted/20">
                  <div className="text-xs font-medium mb-1">添付ファイル:</div>
                  <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                      <div key={`${file.name}-${file.lastModified}`} className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1 text-xs">
                        {getFileIcon(file)}
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* ドラッグ&ドロップエリア */}
              <div 
                ref={dropAreaRef}
                className="w-full border border-dashed rounded-md p-2 mb-3 text-center text-sm text-muted-foreground transition-colors"
              >
                ファイルをドラッグ&ドロップするか、<button type="button" onClick={openFileDialog} className="text-primary hover:underline">ファイルを選択</button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileSelect}
                />
              </div>
              
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
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={openFileDialog}
                  disabled={isLoading || isSubmitting}
                  title="ファイルを添付"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || isSubmitting || (!input.trim() && files.length === 0)}
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
              <div className="flex items-center gap-2">
              <Input
                id="log-title"
                type="text"
                value={logTitle}
                onChange={(e) => setLogTitle(e.target.value)}
                placeholder="例: デザインコンセプト決定"
                disabled={isSubmitting}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateTitle}
                  disabled={messages.length < 2 || isSubmitting}
                >
                  <Brain className="h-4 w-4" />
                </Button>
              </div>
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