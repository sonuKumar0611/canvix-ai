"use client"
import { api } from 'convex/_generated/api'
import { useQuery } from 'convex/react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Navbar } from './navbar'
import { Type, Image, Share2, FileText, Bot, LayoutGrid, Video, FolderKanban } from 'lucide-react'

interface LoaderData {
    isSignedIn: boolean;
    initialStats?: {
        videosProcessed: number;
        agentsDeployed: number;
        activeAgents: number;
        projectsCreated: number;
        totalUsers: number;
        videosToday: number;
        agentsToday: number;
    } | null;
}

const FEATURES = [
    {
        title: 'Titles & Descriptions',
        description: 'Generate SEO-optimized titles and descriptions that get more clicks and rank better in search.',
        icon: Type,
    },
    {
        title: 'AI Thumbnails',
        description: 'Create eye-catching thumbnails with AI. Refine styles and regenerate until you love the result.',
        icon: Image,
    },
    {
        title: 'Social Media Posts',
        description: 'Turn your video content into viral-ready posts for Twitter, Instagram, and more.',
        icon: Share2,
    },
    {
        title: 'Video Transcription',
        description: 'Automatic transcription from your video so AI can use your script for titles, descriptions, and posts.',
        icon: FileText,
    },
    {
        title: 'AI Agents',
        description: 'Specialized agents for each task—titles, descriptions, thumbnails, and social—all in one workflow.',
        icon: Bot,
    },
    {
        title: 'Project Workspace',
        description: 'Organize videos, agents, and outputs in one place. Drag, connect, and export with ease.',
        icon: LayoutGrid,
    },
] as const

export default function HeroSection({ loaderData }: { loaderData: LoaderData }) {
    const liveStats = useQuery(api.stats.getHeroStats);
    const stats = liveStats || loaderData.initialStats;

    return (
        <section >
            <Navbar loaderData={loaderData} />
            <div className="pt-[4rem] px-[2rem]">
                <div className="text-center">
                    <h1 className="mx-auto mt-16 max-w-xl text-5xl text-balance font-medium">Introducing Canvix AI</h1>
                    <p className="text-muted-foreground mx-auto mb-6 mt-4 text-balance text-xl">Generate compelling titles, descriptions, stunning thumbnails, and viral social media posts.</p>
                    <div className="flex flex-col items-center gap-2 *:w-full sm:flex-row sm:justify-center sm:*:w-auto">
                        <Button
                            asChild
                            size="sm"
                            variant="default">
                            <Link to={loaderData?.isSignedIn ? "/dashboard" : "/sign-up"}>
                                <span className="text-nowrap">Get Started</span>
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            variant="ghost">
                            <Link to="/dashboard">
                                <span className="text-nowrap">View Demo</span>
                            </Link>
                        </Button>
                    </div>
                </div>
                {stats && (
                    <div className="mt-10 mb-10 max-w-3xl mx-auto">
                        <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                            Trusted by creators worldwide
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-card/80 backdrop-blur-sm border rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/20">
                                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary mb-2">
                                    <Video className="h-4 w-4" />
                                </div>
                                <div className="text-2xl font-semibold">{stats.videosProcessed.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">Videos Processed</div>
                            </div>
                            <div className="bg-card/80 backdrop-blur-sm border rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/20">
                                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary mb-2">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="text-2xl font-semibold">{stats.agentsDeployed.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">AI Agents Deployed</div>
                            </div>
                            <div className="bg-card/80 backdrop-blur-sm border rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/20">
                                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary mb-2">
                                    <FolderKanban className="h-4 w-4" />
                                </div>
                                <div className="text-2xl font-semibold">{stats.projectsCreated.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">Projects Created</div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="mt-12 mb-16 max-w-5xl mx-auto">
                    <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
                        What you can do on the platform
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {FEATURES.map(({ title, description, icon: Icon }) => (
                            <div
                                key={title}
                                className="group relative bg-card/80 backdrop-blur-sm border rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/20"
                            >
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}