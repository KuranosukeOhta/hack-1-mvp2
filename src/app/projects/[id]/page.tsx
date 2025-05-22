'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, ClockIcon, FolderIcon, UsersIcon, 
  PlusCircle, BarChart2Icon, FileTextIcon, 
  BrainIcon, ActivityIcon 
} from 'lucide-react';

interface Log {
  id: string;
  title: string;
  timestamp: string;
  tags: string[];
  summary?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  members?: string[];
  deadline?: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed';
  logs: Log[];
}

// ローカルストレージのキー
const LS_PROJECTS_KEY = 'design-log-projects';
const LS_LOGS_PREFIX = 'design-log-logs-';

// サンプルプロジェクトデータ
const sampleProjectsData: Record<string, Project> = {
  '1': {
    id: '1',
    title: 'インタラクティブなポートフォリオサイト',
    description: 'デザイン学科の課題として制作する個性的なポートフォリオサイト。HTML/CSS/JavaScriptを使用し、自分の作品を効果的に紹介するためのインタラクティブな要素を取り入れる。',
    category: 'Webデザイン',
    thumbnail: '/thumbnails/portfolio.jpg',
    createdAt: '2023-10-15',
    updatedAt: '2023-10-28',
    members: ['佐藤太郎', '鈴木花子'],
    deadline: '2023-12-15',
    status: 'in-progress',
    logs: [
      {
        id: '101',
        title: 'コンセプト決め',
        timestamp: '2023-10-15T14:30:00Z',
        tags: ['アイデア出し', 'コンセプト', 'ブレスト'],
        summary: '「デジタルと自然の融合」をテーマにしたポートフォリオサイトに決定。自分の作品がページスクロールに合わせて成長する植物のように展開されるビジュアル表現を検討。'
      },
      {
        id: '102',
        title: 'レファレンス収集',
        timestamp: '2023-10-18T10:15:00Z',
        tags: ['リサーチ', 'インスピレーション'],
        summary: 'Awwwards、Behanceなどで参考になるサイトを20件ほど収集。特にパララックス効果とスクロールアニメーションの実装方法に注目。'
      },
      {
        id: '103',
        title: 'ワイヤーフレーム作成',
        timestamp: '2023-10-20T16:45:00Z',
        tags: ['UX', 'ワイヤーフレーム', 'Figma'],
        summary: 'ホーム、作品一覧、個別作品詳細、自己紹介の4ページ構成でワイヤーフレームを作成。ナビゲーションは左側固定で、スクロールに応じて変化する仕様に。'
      },
      {
        id: '104',
        title: 'カラーパレット選定',
        timestamp: '2023-10-22T11:30:00Z',
        tags: ['ビジュアルデザイン', 'カラー'],
        summary: '深緑(#1a3c34)をベースに、アクセントカラーとして珊瑚色(#ff7f50)を採用。自然と活力を表現。補色として薄いベージュ(#f5f2e9)も使用予定。'
      },
      {
        id: '105',
        title: 'トップページデザインモックアップ',
        timestamp: '2023-10-25T13:20:00Z',
        tags: ['ビジュアルデザイン', 'Figma'],
        summary: 'コンセプトに沿ったビジュアルデザインの第一稿を作成。スクロールに合わせて成長する植物のアニメーションをどう実装するか技術的検討が必要。'
      },
      {
        id: '106',
        title: 'フィードバック収集',
        timestamp: '2023-10-26T15:00:00Z',
        tags: ['レビュー', 'フィードバック'],
        summary: '友人5名と教授1名からデザインについてフィードバックを収集。ナビゲーションの視認性向上とモバイル対応の改善が主な指摘事項。'
      },
      {
        id: '107',
        title: 'デザイン修正',
        timestamp: '2023-10-27T09:45:00Z',
        tags: ['ビジュアルデザイン', 'リビジョン'],
        summary: 'フィードバックに基づきデザインを修正。ナビゲーションのコントラストを上げ、モバイルでのレイアウトを再検討。'
      },
      {
        id: '108',
        title: 'コーディング開始',
        timestamp: '2023-10-28T11:00:00Z',
        tags: ['開発', 'HTML', 'CSS', 'JavaScript'],
        summary: 'HTML/CSSのベース構造の実装を開始。まずはレスポンシブグリッドの設定とナビゲーションの実装から着手。'
      }
    ]
  },
  '2': {
    id: '2',
    title: '学園祭ポスターデザイン',
    description: '学園祭の広報用ポスター。テーマは「つながる未来」。',
    category: 'グラフィックデザイン',
    createdAt: '2023-09-01',
    updatedAt: '2023-09-20',
    status: 'completed',
    logs: []
  },
  '3': {
    id: '3',
    title: '環境問題啓発アプリUI',
    description: '環境サークル向けのモバイルアプリUIデザイン。持続可能性をテーマに。',
    category: 'UIデザイン',
    createdAt: '2023-08-10',
    updatedAt: '2023-11-05',
    status: 'in-progress',
    logs: []
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadProject = () => {
      try {
        // ブラウザ環境でのみ実行
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        // プロジェクト一覧を読み込む
        const storedProjects = localStorage.getItem(LS_PROJECTS_KEY);
        if (storedProjects) {
          const projects = JSON.parse(storedProjects) as Project[];
          const projectId = params.id as string;
          const foundProject = projects.find(p => p.id === projectId);
          
          if (foundProject) {
            // データの正規化（欠けているプロパティをデフォルト値で埋める）
            const normalizedProject: Project = {
              ...foundProject,
              logs: foundProject.logs || [],
              members: foundProject.members || [],
              status: foundProject.status || 'planning',
              deadline: foundProject.deadline || undefined
            };
            
            // プロジェクトに紐づくログを読み込む
            const logsKey = `${LS_LOGS_PREFIX}${projectId}`;
            const storedLogs = localStorage.getItem(logsKey);
            
            if (storedLogs) {
              normalizedProject.logs = JSON.parse(storedLogs);
            }
            
            setProject(normalizedProject);
          } else {
            // LocalStorageにない場合はサンプルデータから探す
            const sampleProject = sampleProjectsData[projectId as string];
            if (sampleProject) {
              setProject({
                ...sampleProject,
                logs: sampleProject.logs || []
              });
            } else {
              setProject(null);
            }
          }
        } else {
          // 初回アクセス時はサンプルデータをLocalStorageに保存
          localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(Object.values(sampleProjectsData)));
          const sampleProject = sampleProjectsData[params.id as string];
          if (sampleProject) {
            setProject({
              ...sampleProject,
              logs: sampleProject.logs || []
            });
          } else {
            setProject(null);
          }
        }
      } catch (error) {
        console.error('プロジェクトデータの読み込みに失敗しました:', error);
        const sampleProject = sampleProjectsData[params.id as string];
        if (sampleProject) {
          setProject({
            ...sampleProject,
            logs: sampleProject.logs || []
          });
        } else {
          setProject(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadProject();
  }, [params.id]);
  
  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">完了</Badge>;
      case 'in-progress':
        return <Badge variant="warning">進行中</Badge>;
      case 'review':
        return <Badge variant="secondary">レビュー中</Badge>;
      default:
        return <Badge variant="outline">計画中</Badge>;
    }
  };
  
  if (loading) return (
    <div className="container mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4" />
        <div className="h-4 bg-muted rounded w-2/3 mb-8" />
        <div className="h-64 bg-muted rounded mb-6" />
      </div>
    </div>
  );
  
  if (!project) return (
    <div className="container mx-auto p-6">
      <p>プロジェクトが見つかりません</p>
      <Link href="/projects" className="text-primary hover:underline mt-4 inline-block">
        プロジェクト一覧に戻る
      </Link>
    </div>
  );
  
  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <Link 
          href="/projects"
          className="text-primary hover:underline mb-4 inline-flex items-center"
        >
          ← プロジェクト一覧に戻る
        </Link>
        
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline">{project.category}</Badge>
              {getStatusBadge(project.status)}
            </div>
            <CardTitle className="text-2xl">{project.title}</CardTitle>
            <p className="text-muted-foreground">{project.description}</p>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {project.members && (
                <div className="flex items-start gap-2">
                  <UsersIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-muted-foreground">メンバー</p>
                    <p>{project.members.join(', ')}</p>
                  </div>
                </div>
              )}
              
              {project.deadline && (
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-muted-foreground">提出期限</p>
                    <p>{project.deadline}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <FolderIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-muted-foreground">作成日</p>
                  <p>{project.createdAt}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <ClockIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-muted-foreground">最終更新</p>
                  <p>{project.updatedAt}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">制作ログ</h2>
          <Link href={`/projects/${project.id}/log/new`}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              新規ログを記録
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          {project.logs && project.logs.length > 0 ? (
            project.logs.map(log => (
              <Link
                key={log.id}
                href={`/projects/${project.id}/log/${log.id}`}
              >
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{log.title}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {log.summary && (
                      <p className="text-muted-foreground line-clamp-2">{log.summary}</p>
                    )}
                  </CardContent>
                  
                  {log.tags && log.tags.length > 0 && (
                    <CardFooter className="pt-0 flex-wrap gap-1">
                      {log.tags.map(tag => (
                        <Badge key={`${log.id}-${tag}`} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </CardFooter>
                  )}
                </Card>
              </Link>
            ))
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">
                  ログがまだ記録されていません
                </p>
                <Link href={`/projects/${project.id}/log/new`}>
                  <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    新規ログを記録
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">成果物を生成</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button variant="outline" className="h-auto py-6 flex flex-col items-start justify-start" type="button">
            <div className="flex items-center mb-2 text-primary">
              <BarChart2Icon className="h-5 w-5 mr-2" />
              <span className="font-medium">制作フローチャート</span>
            </div>
            <p className="text-sm text-muted-foreground text-left">全ログから制作プロセスをフローチャートとして可視化</p>
          </Button>
          
          <Button variant="outline" className="h-auto py-6 flex flex-col items-start justify-start" type="button">
            <div className="flex items-center mb-2 text-primary">
              <FileTextIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">制作報告書</span>
            </div>
            <p className="text-sm text-muted-foreground text-left">プロジェクトの進捗と成果をまとめた報告書を生成</p>
          </Button>
          
          <Button variant="outline" className="h-auto py-6 flex flex-col items-start justify-start" type="button">
            <div className="flex items-center mb-2 text-primary">
              <BrainIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">主要な学び・発見</span>
            </div>
            <p className="text-sm text-muted-foreground text-left">プロジェクトから得られた重要な気づきや学びを抽出</p>
          </Button>
          
          <Button variant="outline" className="h-auto py-6 flex flex-col items-start justify-start" type="button">
            <div className="flex items-center mb-2 text-primary">
              <ActivityIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">タイムライン</span>
            </div>
            <p className="text-sm text-muted-foreground text-left">制作プロセスを時系列で視覚化</p>
          </Button>
        </div>
      </div>
    </div>
  );
} 