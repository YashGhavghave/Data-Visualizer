
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DataVisionLogo from '@/components/datavision-logo';
import { Wrench } from 'lucide-react';

export default function RefineDataPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
        <header className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2" prefetch={false}>
            <DataVisionLogo className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">DataVision</span>
            </Link>
            <Button asChild>
                <Link href="/visualizer">
                    Go to Visualizer
                </Link>
            </Button>
      </header>
       <main className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
                <Wrench className="h-16 w-16 text-primary mx-auto" />
                <h1 className="text-4xl font-bold">Data Refinement</h1>
                <p className="text-muted-foreground max-w-md">
                    This feature is under construction. Soon you'll be able to clean, transform, and prepare your data for visualization right here.
                </p>
                <Button asChild>
                    <Link href="/">
                        Go back to Home
                    </Link>
                </Button>
            </div>
       </main>
    </div>
  );
}
