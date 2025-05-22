'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ローカルストレージのキー
const LS_PROJECTS_KEY = 'design-log-projects';

interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  deadline: string;
  members: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    category: '',
    deadline: '',
    members: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // フォームの入力を処理する関数
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // プロジェクトを保存する関数
  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('プロジェクト名を入力してください');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 新しいプロジェクトデータを生成
      const newProject = {
        id: uuidv4(),
        title: formData.title,
        description: formData.description,
        category: formData.category || 'その他',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        deadline: formData.deadline || undefined,
        members: formData.members ? formData.members.split(',').map(m => m.trim()) : [],
        status: 'planning' as const,
        logsCount: 0,
        logs: []
      };
      
      // ローカルストレージからプロジェクト一覧を取得
      const storedProjects = localStorage.getItem(LS_PROJECTS_KEY);
      const projects = storedProjects ? JSON.parse(storedProjects) : [];
      
      // 新しいプロジェクトを追加
      projects.push(newProject);
      
      // ローカルストレージに保存
      localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(projects));
      
      // プロジェクト一覧ページへリダイレクト
      setTimeout(() => {
        router.push('/projects');
      }, 500);
      
    } catch (error) {
      console.error('プロジェクトの保存に失敗しました:', error);
      alert('プロジェクトの保存に失敗しました');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container max-w-2xl mx-auto p-6">
      <header className="mb-6">
        <Link 
          href="/projects"
          className="text-primary hover:underline mb-2 inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          プロジェクト一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold mt-4">新規プロジェクト作成</h1>
        <p className="text-muted-foreground">デザインプロジェクトの情報を入力してください</p>
      </header>
      
      <form onSubmit={saveProject}>
        <Card>
          <CardHeader>
            <CardTitle>プロジェクト情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                プロジェクト名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="例: インタラクティブなポートフォリオサイト"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="プロジェクトの目的や概要を入力してください"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="例: Webデザイン"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadline">締め切り</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="members">メンバー</Label>
              <Input
                id="members"
                name="members"
                value={formData.members}
                onChange={handleChange}
                placeholder="カンマ区切りで入力（例: 佐藤太郎, 鈴木花子）"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => router.push('/projects')}
            >
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.title}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? '保存中...' : 'プロジェクトを作成'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 