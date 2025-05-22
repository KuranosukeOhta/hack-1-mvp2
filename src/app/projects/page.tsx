'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Folder, Calendar } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  logsCount: number;
}

// ローカルストレージ用のキー
const LS_PROJECTS_KEY = 'design-log-projects';

// サンプルデータ（初期データ）
const sampleProjects: Project[] = [
  {
    id: '1',
    title: '私の日常を切り取る - フォトグラフィー作品集',
    description: '大学の課題で制作した写真集。日常の中の美しさや一瞬の表情を切り取ることをテーマに。',
    category: 'フォトグラフィー',
    thumbnail: '/thumbnails/photography.jpg',
    createdAt: '2024-03-15',
    updatedAt: '2024-03-28',
    logsCount: 12
  },
  {
    id: '2',
    title: '手書き文字の可能性を探る - タイポグラフィ実験',
    description: '手書き文字とデジタルフォントの融合をテーマにした実験的なタイポグラフィ作品。',
    category: 'タイポグラフィ',
    thumbnail: '/thumbnails/typography.jpg',
    createdAt: '2024-02-20',
    updatedAt: '2024-03-10',
    logsCount: 8
  },
  {
    id: '3',
    title: '私の部屋の色 - カラーパレット制作',
    description: '自分の部屋からインスピレーションを得た、オリジナルカラーパレットの制作過程。',
    category: 'カラーデザイン',
    thumbnail: '/thumbnails/color-palette.jpg',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-05',
    logsCount: 6
  }
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // LocalStorageからプロジェクトを読み込む
  useEffect(() => {
    const loadProjects = () => {
      try {
        const storedProjects = localStorage.getItem(LS_PROJECTS_KEY);
        if (storedProjects) {
          setProjects(JSON.parse(storedProjects));
        } else {
          // 初回アクセス時はサンプルデータをセット
          setProjects(sampleProjects);
          localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(sampleProjects));
        }
      } catch (error) {
        console.error('プロジェクトデータの読み込みに失敗しました:', error);
        setProjects(sampleProjects);
      } finally {
        setLoading(false);
      }
    };

    // ブラウザ環境でのみ実行
    if (typeof window !== 'undefined') {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <Link 
          href="/"
          className="text-primary hover:underline mb-4 inline-flex items-center"
        >
          ← ホームに戻る
        </Link>
        <h1 className="text-3xl font-bold mb-2 mt-4">デザインプロジェクト</h1>
        <p className="text-muted-foreground">AIを活用してクリエイティブな制作プロセスを記録・管理</p>
      </header>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">プロジェクト一覧</h2>
        <Link href="/projects/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            新規プロジェクト
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardHeader>
                <div className="h-7 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                <div className="aspect-video bg-muted relative">
                  <div className="w-full h-full bg-accent/10 flex items-center justify-center text-muted-foreground">
                    <Folder className="h-12 w-12 opacity-50" />
                  </div>
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    {project.category}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                </CardHeader>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {project.updatedAt}
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                    ログ {project.logsCount}件
                  </Badge>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 