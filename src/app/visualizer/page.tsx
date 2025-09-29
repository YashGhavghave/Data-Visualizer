
"use client";

import { useState, useMemo, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, UploadCloud, BarChart, LineChart, PieChart, Table as TableIcon, Download, AreaChart as AreaChartIcon, ScatterChart as ScatterChartIcon, Radar, Target, Map, Filter, Combine, Disc, Thermometer, Layers, CheckSquare, Donut } from 'lucide-react';
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
import Link from 'next/link';

const ChartRenderer = dynamic(() => import('@/components/chart-renderer'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

type AppState = 'initial' | 'loading' | 'error' | 'ready';
export type ChartType = 'table' | 'bar chart' | 'line chart' | 'pie chart' | 'donut chart' | 'area chart' | 'scatter chart' | 'radar chart' | 'radial bar chart' | 'treemap' | 'funnel chart' | 'bubble chart' | 'composed chart' | 'heatmap' | 'stacked bar chart' | 'grouped bar chart' | 'stacked area chart';

export default function VisualizerPage() {
  const [appState, setAppState] = useState<AppState>('initial');
  const [fileInfo, setFileInfo] = useState<{ name: string; type: string } | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData>([]);
  const [error, setError] = useState<string>('');
  
  const [chartType, setChartType] = useState<ChartType>('bar chart');
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');
  const [groupKey, setGroupKey] = useState<string>('');
  const [yAxisCategoryKey, setYAxisCategoryKey] = useState<string>(''); // For heatmap Y category
  const [zAxisKey, setZAxisKey] = useState<string>(''); // For bubble/heatmap value

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
  }, [numericKeys, dataKeys, parsedData]);
  
  const possibleCharts = useMemo(() => {
    const catCount = categoricalKeys.length;
    const numCount = numericKeys.length;
    
    return {
        table: true,
        'bar chart': catCount >= 1 && numCount >= 1,
        'line chart': catCount >= 1 && numCount >= 1,
        'area chart': catCount >= 1 && numCount >= 1,
        'pie chart': catCount >= 1 && numCount >= 1,
        'donut chart': catCount >= 1 && numCount >= 1,
        'scatter chart': numCount >= 2,
        'bubble chart': catCount >= 1 && numCount >= 2, // 1 cat, 2 num
        'composed chart': catCount >= 1 && numCount >= 1,
        'radar chart': catCount >= 1 && numCount >= 1,
        'radial bar chart': catCount >= 1 && numCount >= 1,
        'treemap': catCount >= 1 && numCount >= 1,
        'funnel chart': catCount >= 1 && numCount >= 1,
        'heatmap': catCount >= 2 && numCount >= 1,
        'stacked bar chart': catCount >= 2 && numCount >= 1,
        'grouped bar chart': catCount >= 2 && numCount >= 1,
        'stacked area chart': catCount >= 2 && numCount >= 1,
    };
  }, [categoricalKeys, numericKeys]);


  const handleDataProcessing = (content: string, file: { name: string, type: string }) => {
    setAppState('loading');
    setError('');
    setFileInfo(file);
    setParsedData([]);
    setChartType('bar chart');
    setXAxisKey('');
    setYAxisKey('');
    setGroupKey('');
    setYAxisCategoryKey('');
    setZAxisKey('');

    setTimeout(() => {
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
    
          // Auto-select initial axes
          if (data.length > 0) {
            const keys = Object.keys(data[0]);
            const numK = keys.filter(key => data.every(item => typeof item[key] === 'number' || !isNaN(Number(item[key]))));
            const catK = keys.filter(key => !numK.includes(key));
    
            setXAxisKey(catK[0] || keys[0] || '');
            setYAxisKey(numK[0] || keys.find(k => k !== (catK[0] || keys[0])) || '');
            if (catK.length > 1) {
              setYAxisCategoryKey(catK[1] || '');
              setGroupKey(catK[1] || '');
            } else {
              setYAxisCategoryKey(catK[0] || '');
              setGroupKey('');
            }
            
            if (numK.length > 1) {
                setZAxisKey(numK[1] || '');
            } else {
                setZAxisKey(numK[0] || '');
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
    }, 500); 
  };
  
  const handleDownload = useCallback(() => {
    if (visRef.current === null) {
      return
    }

    toPng(visRef.current, { cacheBust: true, backgroundColor: '#18181b' }) 
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
    setChartType('bar chart');
    setXAxisKey('');
    setYAxisKey('');
    setYAxisCategoryKey('');
    setZAxisKey('');
    setGroupKey('');
  };
  
  const renderContent = () => {
    if (appState === 'initial' || (appState !== 'ready' && appState !== 'loading')) {
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
    
    if (appState === 'error') {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-2xl font-bold">An Error Occurred</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <Button onClick={resetState}>Try Again</Button>
        </div>
      );
    }

    return (
        <Card className="h-full w-full overflow-hidden flex flex-col shadow-lg">
            <CardHeader className="flex-row items-center justify-between border-b p-4">
                <div>
                    <CardTitle className="text-xl font-bold text-foreground">
                    Data Visualization
                    </CardTitle>
                    <CardDescription>{fileInfo?.name}</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={handleDownload} disabled={appState !== 'ready'}>
                   <Download className="h-4 w-4" />
                   <span className="sr-only">Download</span>
                </Button>
            </CardHeader>
            <CardContent className="flex-grow p-4 flex flex-col min-h-0">
                <div className="w-full h-full bg-card rounded-lg border relative" ref={visRef}>
                    {appState === 'loading' ? (
                       <div className="flex items-center justify-center h-full gap-2">
                         <Loader2 className="w-8 h-8 animate-spin text-primary" />
                         <span className="text-muted-foreground">Processing...</span>
                       </div>
                    ) : (
                      <ChartRenderer 
                          data={parsedData} 
                          chartType={chartType}
                          xAxisKey={xAxisKey}
                          yAxisKey={chartType === 'heatmap' ? yAxisCategoryKey : yAxisKey}
                          zAxisKey={chartType === 'heatmap' ? yAxisKey : zAxisKey}
                          valueKey={chartType === 'heatmap' ? yAxisKey : undefined}
                          groupKey={groupKey}
                      />
                    )}
                </div>
            </CardContent>
        </Card>
    );
  };

  const renderSidebarContent = () => {
    if (appState === 'initial' || appState === 'error') {
        return (
            <div className="space-y-4">
                <FileUploader onFileUpload={handleDataProcessing} disabled={appState === 'loading'} />
                <SampleDataLoader onSampleSelect={handleDataProcessing} disabled={appState === 'loading'}/>
            </div>
        );
    }

    const needsGrouping = ['stacked bar chart', 'grouped bar chart', 'stacked area chart'].includes(chartType);

    return (
        <>
          <div>
            <Label className="text-sm font-medium">Chart Type</Label>
            <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)} disabled={appState === 'loading'}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select chart type" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="table" disabled={!possibleCharts.table}><TableIcon className="inline-block w-4 h-4 mr-2"/>Table</SelectItem>
                    <SelectItem value="bar chart" disabled={!possibleCharts['bar chart']}><BarChart className="inline-block w-4 h-4 mr-2"/>Bar Chart</SelectItem>
                    <SelectItem value="line chart" disabled={!possibleCharts['line chart']}><LineChart className="inline-block w-4 h-4 mr-2"/>Line Chart</SelectItem>
                     <SelectItem value="area chart" disabled={!possibleCharts['area chart']}><AreaChartIcon className="inline-block w-4 h-4 mr-2"/>Area Chart</SelectItem>
                    <SelectItem value="pie chart" disabled={!possibleCharts['pie chart']}><PieChart className="inline-block w-4 h-4 mr-2"/>Pie Chart</SelectItem>
                    <SelectItem value="donut chart" disabled={!possibleCharts['donut chart']}><Donut className="inline-block w-4 h-4 mr-2"/>Donut Chart</SelectItem>
                    <SelectItem value="scatter chart" disabled={!possibleCharts['scatter chart']}><ScatterChartIcon className="inline-block w-4 h-4 mr-2"/>Scatter Chart</SelectItem>
                    <SelectItem value="bubble chart" disabled={!possibleCharts['bubble chart']}><Disc className="inline-block w-4 h-4 mr-2"/>Bubble Chart</SelectItem>
                    <SelectItem value="composed chart" disabled={!possibleCharts['composed chart']}><Combine className="inline-block w-4 h-4 mr-2"/>Composed (Line+Bar)</SelectItem>
                    <SelectItem value="radar chart" disabled={!possibleCharts['radar chart']}><Radar className="inline-block w-4 h-4 mr-2"/>Radar Chart</SelectItem>
                    <SelectItem value="radial bar chart" disabled={!possibleCharts['radial bar chart']}><Target className="inline-block w-4 h-4 mr-2"/>Radial Bar Chart</SelectItem>
                    <SelectItem value="treemap" disabled={!possibleCharts['treemap']}><Map className="inline-block w-4 h-4 mr-2"/>Treemap</SelectItem>
                    <SelectItem value="funnel chart" disabled={!possibleCharts['funnel chart']}><Filter className="inline-block w-4 h-4 mr-2"/>Funnel Chart</SelectItem>
                    <SelectItem value="heatmap" disabled={!possibleCharts['heatmap']}><Thermometer className="inline-block w-4 h-4 mr-2"/>Heatmap</SelectItem>
                    <SelectItem value="stacked bar chart" disabled={!possibleCharts['stacked bar chart']}><CheckSquare className="inline-block w-4 h-4 mr-2"/>Stacked Bar Chart</SelectItem>
                    <SelectItem value="grouped bar chart" disabled={!possibleCharts['grouped bar chart']}><Layers className="inline-block w-4 h-4 mr-2"/>Grouped Bar Chart</SelectItem>
                    <SelectItem value="stacked area chart" disabled={!possibleCharts['stacked area chart']}><AreaChartIcon className="inline-block w-4 h-4 mr-2"/>Stacked Area Chart</SelectItem>

                </SelectContent>
            </Select>
          </div>

          {chartType !== 'table' && (
            <>
              {chartType === 'heatmap' ? (
                <>
                  <div>
                    <Label className="text-sm font-medium">X-Axis (Category)</Label>
                    <Select value={xAxisKey} onValueChange={setXAxisKey} disabled={appState === 'loading'}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                            {categoricalKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Y-Axis (Category)</Label>
                    <Select value={yAxisCategoryKey} onValueChange={setYAxisCategoryKey} disabled={appState === 'loading'}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                            {categoricalKeys.filter(k => k !== xAxisKey).map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                   <div>
                    <Label className="text-sm font-medium">Value (Color)</Label>
                    <Select value={yAxisKey} onValueChange={setYAxisKey} disabled={appState === 'loading'}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select a value" /></SelectTrigger>
                        <SelectContent>
                            {numericKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                      <Label className="text-sm font-medium">X-Axis / Category / Label</Label>
                       <Select value={xAxisKey} onValueChange={setXAxisKey} disabled={appState === 'loading'}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select a category" /></SelectTrigger>
                          <SelectContent>
                              {dataKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                   <div>
                      <Label className="text-sm font-medium">Y-Axis / Value / Size</Label>
                      <Select value={yAxisKey} onValueChange={setYAxisKey} disabled={appState === 'loading'}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select a value" /></SelectTrigger>
                          <SelectContent>
                              {numericKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                              {categoricalKeys.map(key => <SelectItem key={key} value={key} disabled>{key} (numeric required)</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                </>
              )}
              
              {chartType === 'bubble chart' && (
                 <div>
                    <Label className="text-sm font-medium">Z-Axis / Bubble Size (Numeric)</Label>
                    <Select value={zAxisKey} onValueChange={setZAxisKey} disabled={appState === 'loading'}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select a size value" /></SelectTrigger>
                        <SelectContent>
                            {numericKeys.filter(k => k !== yAxisKey).map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                            {categoricalKeys.map(key => <SelectItem key={key} value={key} disabled>{key} (numeric required)</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
              )}

              {needsGrouping && (
                  <div>
                      <Label className="text-sm font-medium">Group By</Label>
                      <Select value={groupKey} onValueChange={setGroupKey} disabled={appState === 'loading'}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select a grouping category" /></SelectTrigger>
                          <SelectContent>
                              {categoricalKeys.filter(k => k !== xAxisKey).map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
              )}

            </>
          )}
        </>
      );
  };

  return (
    <div className="flex h-screen bg-muted/40">
      <aside className="w-80 bg-background border-r flex flex-col">
          <header className="p-4 border-b">
              <Link href="/" className="flex items-center gap-3">
                  <DataVisionLogo className="w-8 h-8 text-primary" />
                  <h1 className="text-xl font-bold text-foreground">DataVision</h1>
              </Link>
          </header>
          <div className="flex-grow p-4 space-y-6 overflow-y-auto">
              {renderSidebarContent()}
          </div>
          <footer className="p-4 border-t">
              <Button variant="ghost" className="w-full" onClick={resetState} disabled={appState === 'initial'}>
                Start Over
              </Button>
          </footer>
      </aside>
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="w-full h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
