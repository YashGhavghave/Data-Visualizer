
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DataVisionLogo from '@/components/datavision-logo';
import { ArrowRight, BarChart, UploadCloud, Eye } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="#" className="flex items-center gap-2" prefetch={false}>
          <DataVisionLogo className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">DataVision</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="#features">Features</Link>
          </Button>
          <Button asChild>
            <Link href="/visualizer">
              Launch App <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative py-20 md:py-32 lg:py-40">
           <div 
            aria-hidden="true" 
            className="absolute inset-0 top-0 h-full w-full bg-background [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,0,0,1),rgba(0,0,0,0))]">
           </div>
          <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Unlock Insights from Your Data
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                DataVision makes it simple to upload your data and create beautiful, insightful visualizations in seconds. No code required.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/visualizer">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/refine-data">
                    Refine data
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto py-16 md:py-24">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight">Powerful Features, Simple Interface</h2>
                <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                    Everything you need to turn raw data into compelling stories.
                </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
                   <div className="p-3 bg-primary/10 rounded-full mb-4">
                     <UploadCloud className="h-8 w-8 text-primary" />
                   </div>
                    <h3 className="text-xl font-semibold mb-2">Easy Data Upload</h3>
                    <p className="text-muted-foreground">
                        Quickly upload your CSV or JSON files with a simple drag-and-drop interface.
                    </p>
                </div>
                <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
                    <div className="p-3 bg-primary/10 rounded-full mb-4">
                        <BarChart className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Diverse Chart Library</h3>
                    <p className="text-muted-foreground">
                        Choose from over 10 chart types, including bar, line, pie, funnel, and more to best represent your data.
                    </p>
                </div>
                <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
                     <div className="p-3 bg-primary/10 rounded-full mb-4">
                        <Eye className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Instant Visualization</h3>
                    <p className="text-muted-foreground">
                        See your data come to life instantly. No waiting, no complex configurations.
                    </p>
                </div>
            </div>
        </section>
      </main>
      <footer className="container mx-auto py-6 px-4 md:px-6 border-t">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
                <DataVisionLogo className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} DataVision. All rights reserved.</p>
            </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-sm hover:underline underline-offset-4" prefetch={false}>
              Terms of Service
            </Link>
            <Link href="#" className="text-sm hover:underline underline-offset-4" prefetch={false}>
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
