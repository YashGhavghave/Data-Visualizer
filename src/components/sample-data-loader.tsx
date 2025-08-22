"use client"

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SampleDataLoaderProps {
    onSampleSelect: (content: string, file: { name: string; type: string }) => void;
    disabled?: boolean;
}

const sampleFiles = [
    { name: "Sales Data", path: "/sample-data/sales.csv", type: "text/csv"},
    { name: "User Demographics", path: "/sample-data/users.json", type: "application/json"}
];

export default function SampleDataLoader({ onSampleSelect, disabled }: SampleDataLoaderProps) {
    const { toast } = useToast();
    
    const loadSample = async (filePath: string, fileType: string, fileName: string) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to fetch sample data: ${response.statusText}`);
            }
            const content = await response.text();
            onSampleSelect(content, { name: fileName, type: fileType });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error loading sample",
                description: "Could not load the sample dataset. Please try again later.",
            });
        }
    };

    return (
        <div className="mt-4">
            <p className="text-sm text-center text-muted-foreground mb-2">Or try with sample data:</p>
            <div className="grid grid-cols-2 gap-2">
                {sampleFiles.map(file => (
                    <Button 
                        key={file.name}
                        variant="outline"
                        size="sm"
                        onClick={() => loadSample(file.path, file.type, file.path.split('/').pop() || 'sample')}
                        disabled={disabled}
                    >
                        {file.name}
                    </Button>
                ))}
            </div>
        </div>
    );
}
