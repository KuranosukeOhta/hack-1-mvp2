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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NewLogForm from './NewLogForm';

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
  const [isNewLogDialogOpen, setIsNewLogDialogOpen] = useState(false);
  
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
        return <Badge variant="default" className="bg-green-500">完了</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-yellow-500">進行中</Badge>;
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
      <header className="mb-6">
        <Link 
          href="/projects"
          className="text-primary hover:underline mb-2 inline-flex items-center"
        >
          ← プロジェクト一覧に戻る
        </Link>
        
        {loading ? (
          <div className="h-8 bg-muted rounded animate-pulse mt-2" />
        ) : project ? (
          <>
            <h1 className="text-3xl font-bold mt-4">{project.title}</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">{project.description}</p>
          </>
        ) : (
          <h1 className="text-3xl font-bold mt-4">プロジェクトが見つかりません</h1>
        )}
      </header>
      
      {loading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : project ? (
        <>
          <div className="flex flex-wrap gap-4 mb-8">
            {/* プロジェクト情報カード */}
            <Card className="flex-1 min-w-[300px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">プロジェクト情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary">
                      {project.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">作成日:</span>
                    <span>{project.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">更新日:</span>
                    <span>{project.updatedAt}</span>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">期限:</span>
                      <span>{project.deadline}</span>
                    </div>
                  )}
                  {project.members && project.members.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">メンバー:</span>
                      <span>{project.members.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">ログ一覧</h2>
            <Dialog open={isNewLogDialogOpen} onOpenChange={setIsNewLogDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  新規ログを作成
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[90%] max-h-[90vh] overflow-y-auto backdrop-blur-sm bg-background/95">
                <DialogHeader>
                  <DialogTitle>新規ログを作成</DialogTitle>
                  <DialogDescription>
                    AIとの対話を通じてデザイン制作プロセスを記録します
                  </DialogDescription>
                </DialogHeader>
                <NewLogForm projectId={project.id} onComplete={() => setIsNewLogDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          
          {/* ログ一覧 */}
          <div className="space-y-4">
            {project.logs && project.logs.length > 0 ? (
              project.logs
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map(log => (
                  <Link key={log.id} href={`/projects/${project.id}/log/${log.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{log.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {log.summary || '概要なし'}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {log.tags?.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground/60" />
                <h3 className="mt-4 text-lg font-medium">ログがありません</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  「新規ログを作成」ボタンからデザイン制作プロセスを記録しましょう
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">プロジェクトが見つかりません</h2>
          <p className="mt-2 text-muted-foreground">
            指定されたIDのプロジェクトは存在しないか、削除された可能性があります。
          </p>
          <Link href="/projects" className="mt-4 inline-block">
            <Button variant="outline">プロジェクト一覧に戻る</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 