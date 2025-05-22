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
    title: 'インタラクティブなポートフォリオサイト',
    description: 'デザイン学科の課題。個性を表現するポートフォリオサイトの制作。',
    category: 'Webデザイン',
    thumbnail: '/thumbnails/portfolio.jpg',
    createdAt: '2023-10-15',
    updatedAt: '2023-10-28',
    logsCount: 8
  },
  {
    id: '2',
    title: '学園祭ポスターデザイン',
    description: '学園祭の広報用ポスター。テーマは「つながる未来」。',
    category: 'グラフィックデザイン',
    thumbnail: '/thumbnails/festival-poster.jpg',
    createdAt: '2023-09-01',
    updatedAt: '2023-09-20',
    logsCount: 6
  },
  {
    id: '3',
    title: '環境問題啓発アプリUI',
    description: '環境サークル向けのモバイルアプリUIデザイン。持続可能性をテーマに。',
    category: 'UIデザイン',
    thumbnail: '/thumbnails/eco-app.jpg',
    createdAt: '2023-08-10',
    updatedAt: '2023-11-05',
    logsCount: 12
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
        <h1 className="text-3xl font-bold mb-2">デザインプロジェクト</h1>
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