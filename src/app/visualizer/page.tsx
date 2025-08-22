
"use client";

import { useState, useMemo, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, UploadCloud, BarChart, LineChart, PieChart, Table as TableIcon, Download, AreaChart as AreaChartIcon, ScatterChart as ScatterChartIcon, Radar, Target, Map, Filter, Combine, Disc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { parseCsv, parseJson } from '@/lib/parsers';
import DataVisionLogo from '@/components/datavision-logo';
import FileUploader from '@/components/file-uploader';
import SampleDataLoader from '@/components/sample-data-loader';
import dynamic from 'next/dynamic';
import type { ParsedData } from '@/lib/parsers';
import { toPng } from 'html-to-image';

const ChartRenderer = dynamic(() => import('@/components/chart-renderer'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

type AppState = 'initial' | 'loading' | 'error' | 'ready';
export type ChartType = 'table' | 'bar chart' | 'line chart' | 'pie chart' | 'area chart' | 'scatter chart' | 'radar chart' | 'radial bar chart' | 'treemap' | 'funnel chart' | 'bubble chart' | 'composed chart';

export default function VisualizerPage() {
  const [appState, setAppState] = useState<AppState>('initial');
  const [fileInfo, setFileInfo] = useState<{ name: string; type: string } | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData>([]);
  const [error, setError] = useState<string>('');
  
  const [chartType, setChartType] = useState<ChartType>('table');
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');
  const [zAxisKey, setZAxisKey] = useState<string>(''); // For bubble chart size

  const { toast } = useToast();
  const visRef = useRef<HTMLDivElement>(null);

  const dataKeys = useMemo(() => (parsedData.length > 0 ? Object.keys(parsedData[0]) : []), [parsedData]);
  const numericKeys = useMemo(() => {
    if (parsedData.length === 0) return [];
    return dataKeys.filter(key => parsedData.every(item => typeof item[key] === 'number' || !isNaN(Number(item[key]))));
  }, [parsedData, dataKeys]);
  const categoricalKeys = useMemo(() => {
    if (parsedData.length === 0) return [];
    return dataKeys.filter(key => !numericKeys.includes(key));
  }, [numericKeys, dataKeys]);

  const handleDataProcessing = (content: string, file: { name: string, type: string }) => {
    setAppState('loading');
    setError('');
    setParsedData([]);
    setChartType('table');
    setXAxisKey('');
    setYAxisKey('');
    setZAxisKey('');

    try {
      let data: ParsedData;
      const fileType = file.type.includes('csv') ? 'CSV' : file.type.includes('json') ? 'JSON' : file.name.split('.').pop()?.toUpperCase() || '';

      if (fileType.includes('CSV')) {
        data = parseCsv(content);
      } else if (fileType.includes('JSON')) {
        data = parseJson(content);
      } else {
        throw new Error('Unsupported file type. Please upload CSV or JSON.');
      }
      setParsedData(data);
      setFileInfo(file);

      // Auto-select initial axes
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        const numKeys = keys.filter(key => data.every(item => typeof item[key] === 'number' || !isNaN(Number(item[key]))));
        const catKeys = keys.filter(key => !numKeys.includes(key));

        setXAxisKey(catKeys[0] || keys[0] || '');
        setYAxisKey(numKeys[0] || keys.find(k => k !== catKeys[0]) || '');
        if (numKeys.length > 1) {
          setZAxisKey(numKeys[1] || '');
        } else {
          setZAxisKey('');
        }
      }
      
      setAppState('ready');
      toast({
        title: "Success!",
        description: `Successfully parsed ${file.name}.`,
      });

    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred.';
      setError(errorMessage);
      setAppState('error');
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: errorMessage,
      });
    }
  };
  
  const handleDownload = useCallback(() => {
    if (visRef.current === null) {
      return
    }

    toPng(visRef.current, { cacheBust: true, backgroundColor: '#18181b' }) // Match dark theme background
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = `${fileInfo?.name.split('.')[0]}-${chartType}.png` || `datavision-chart.png`
        link.href = dataUrl
        link.click()
      })
      .catch((err) => {
        console.log(err)
        toast({
            variant: "destructive",
            title: "Download Error",
            description: "Could not create image for download.",
        });
      })
  }, [visRef, chartType, fileInfo, toast]);


  const resetState = () => {
    setAppState('initial');
    setFileInfo(null);
    setParsedData([]);
    setError('');
    setChartType('table');
    setXAxisKey('');
    setYAxisKey('');
    setZAxisKey('');
  };
  
  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Processing your data...</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">An Error Occurred</h2>
            <p className="text-muted-foreground max-w-md">{error}</p>
            <Button onClick={resetState}>Try Again</Button>
          </div>
        );
      case 'ready':
        return (
            <Card className="h-full w-full overflow-hidden flex flex-col shadow-lg">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold text-foreground">
                        Data Visualization
                        </CardTitle>
                        <CardDescription>{fileInfo?.name}</CardDescription>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleDownload}>
                       <Download className="h-4 w-4" />
                       <span className="sr-only">Download</span>
                    </Button>
                </CardHeader>
                <CardContent className="flex-grow p-4 flex flex-col min-h-0">
                    <div className="w-full h-full bg-card rounded-lg border p-4 relative" ref={visRef}>
                        <ChartRenderer 
                            data={parsedData} 
                            chartType={chartType}
                            xAxisKey={xAxisKey}
                            yAxisKey={yAxisKey}
                            zAxisKey={zAxisKey}
                        />
                    </div>
                </CardContent>
            </Card>
        );
      case 'initial':
      default:
        return (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center border-2 border-dashed rounded-lg border-border bg-card/50 p-8">
                <div className="p-4 bg-primary/10 rounded-full">
                  <UploadCloud className="w-16 h-16 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Visualize Your Data</h2>
                  <p className="text-lg text-muted-foreground max-w-md mt-2">
                      Upload a CSV or JSON file, or use a sample dataset to get started.
                  </p>
                </div>
                <div className="w-full max-w-sm flex flex-col gap-4">
                  <FileUploader onFileUpload={handleDataProcessing} disabled={appState === 'loading'} />
                  <SampleDataLoader onSampleSelect={handleDataProcessing} disabled={appState === 'loading'}/>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-muted/40">
      <aside className="w-80 bg-background border-r flex flex-col">
          <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                  <DataVisionLogo className="w-8 h-8 text-primary" />
                  <h1 className="text-xl font-bold text-foreground">DataVision</h1>
              </div>
          </div>
          <div className="flex-grow p-4 space-y-6 overflow-y-auto">
              {appState === 'initial' || appState === 'loading' || appState === 'error' ? (
                <div className="space-y-4">
                    <FileUploader onFileUpload={handleDataProcessing} disabled={appState === 'loading'} />
                    <SampleDataLoader onSampleSelect={handleDataProcessing} disabled={appState === 'loading'}/>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium">Chart Type</Label>
                    <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select chart type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="table"><TableIcon className="inline-block w-4 h-4 mr-2"/>Table</SelectItem>
                            <SelectItem value="bar chart"><BarChart className="inline-block w-4 h-4 mr-2"/>Bar Chart</SelectItem>
                            <SelectItem value="line chart"><LineChart className="inline-block w-4 h-4 mr-2"/>Line Chart</SelectItem>
                             <SelectItem value="area chart"><AreaChartIcon className="inline-block w-4 h-4 mr-2"/>Area Chart</SelectItem>
                            <SelectItem value="pie chart"><PieChart className="inline-block w-4 h-4 mr-2"/>Pie Chart</SelectItem>
                            <SelectItem value="scatter chart"><ScatterChartIcon className="inline-block w-4 h-4 mr-2"/>Scatter Chart</SelectItem>
                            <SelectItem value="bubble chart"><Disc className="inline-block w-4 h-4 mr-2"/>Bubble Chart</SelectItem>
                            <SelectItem value="composed chart"><Combine className="inline-block w-4 h-4 mr-2"/>Composed (Line+Bar)</SelectItem>
                            <SelectItem value="radar chart"><Radar className="inline-block w-4 h-4 mr-2"/>Radar Chart</SelectItem>
                            <SelectItem value="radial bar chart"><Target className="inline-block w-4 h-4 mr-2"/>Radial Bar Chart</SelectItem>
                            <SelectItem value="treemap"><Map className="inline-block w-4 h-4 mr-2"/>Treemap</SelectItem>
                            <SelectItem value="funnel chart"><Filter className="inline-block w-4 h-4 mr-2"/>Funnel Chart</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>

                  {chartType !== 'table' && (
                    <>
                      <div>
                          <Label className="text-sm font-medium">X-Axis / Category / Label</Label>
                           <Select value={xAxisKey} onValueChange={setXAxisKey}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a category" /></SelectTrigger>
                              <SelectContent>
                                  {dataKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                       <div>
                          <Label className="text-sm font-medium">Y-Axis / Value / Size</Label>
                          <Select value={yAxisKey} onValueChange={setYAxisKey}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a value" /></SelectTrigger>
                              <SelectContent>
                                  {numericKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                  {categoricalKeys.map(key => <SelectItem key={key} value={key} disabled>{key} (numeric required)</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                      {chartType === 'bubble chart' && (
                         <div>
                            <Label className="text-sm font-medium">Z-Axis / Bubble Size (Numeric)</Label>
                            <Select value={zAxisKey} onValueChange={setZAxisKey}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a size value" /></SelectTrigger>
                                <SelectContent>
                                    {numericKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                    {categoricalKeys.map(key => <SelectItem key={key} value={key} disabled>{key} (numeric required)</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
          </div>
          <div className="p-4 border-t">
              <Button variant="ghost" className="w-full" onClick={resetState} disabled={appState === 'initial'}>
                Start Over
              </Button>
          </div>
      </aside>
      <main className="flex-1 p-6 flex flex-col">
        <div className="w-full h-full flex-grow">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
