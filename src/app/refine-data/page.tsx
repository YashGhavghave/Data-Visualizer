
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DataVisionLogo from '@/components/datavision-logo';
import FileUploader from '@/components/file-uploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { parseCsv, parseJson, type ParsedData } from '@/lib/parsers';
import { Download, Wrench, ArrowRight, CaseSensitive, Trash2, Milestone } from 'lucide-react';

type ProcessingOptions = {
  removeNulls: boolean;
  removeDuplicates: boolean;
  trimWhitespace: boolean;
};

type CaseChangeOptions = {
  column: string;
  type: 'uppercase' | 'lowercase' | 'titlecase';
};

export default function RefineDataPage() {
  const [originalData, setOriginalData] = useState<ParsedData>([]);
  const [refinedData, setRefinedData] = useState<ParsedData>([]);
  const [fileInfo, setFileInfo] = useState<{ name: string; type: string } | null>(null);
  
  const [options, setOptions] = useState<ProcessingOptions>({
    removeNulls: false,
    removeDuplicates: false,
    trimWhitespace: true,
  });

  const [columnRenames, setColumnRenames] = useState<Record<string, string>>({});
  const [caseChanges, setCaseChanges] = useState<CaseChangeOptions[]>([]);

  const { toast } = useToast();

  const headers = useMemo(() => {
    return originalData.length > 0 ? Object.keys(originalData[0]) : [];
  }, [originalData]);

  useEffect(() => {
    // Reset renames and case changes when a new file is uploaded
    const initialRenames = headers.reduce((acc, h) => ({ ...acc, [h]: h }), {});
    setColumnRenames(initialRenames);
    setCaseChanges([]);
    setRefinedData(originalData);
  }, [originalData, headers]);


  const handleFileUpload = (content: string, file: { name: string; type: string }) => {
    try {
      const isCsv = file.type.includes('csv') || file.name.endsWith('.csv');
      const data = isCsv ? parseCsv(content) : parseJson(content);
      setOriginalData(data);
      setFileInfo(file);
      toast({
        title: 'File Loaded',
        description: `${file.name} is ready for refinement.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error reading file',
        description: error.message,
      });
    }
  };
  
  const applyCaseChange = (text: string, type: 'uppercase' | 'lowercase' | 'titlecase') => {
      if(typeof text !== 'string') return text;
      switch(type) {
          case 'uppercase': return text.toUpperCase();
          case 'lowercase': return text.toLowerCase();
          case 'titlecase': return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          default: return text;
      }
  }

  const handleRefine = () => {
    let data = JSON.parse(JSON.stringify(originalData)) as ParsedData;

    // 1. Trim Whitespace
    if (options.trimWhitespace) {
      data = data.map(row => {
        const newRow = { ...row };
        for (const key in newRow) {
          if (typeof newRow[key] === 'string') {
            newRow[key] = (newRow[key] as string).trim();
          }
        }
        return newRow;
      });
    }
    
    // 2. Remove Nulls
    if (options.removeNulls) {
      data = data.filter(row => {
        return Object.values(row).every(value => value !== null && value !== undefined && value !== '');
      });
    }

    // 3. Remove Duplicates
    if (options.removeDuplicates) {
      const uniqueRows = new Map<string, Record<string, string | number>>();
      data.forEach(row => {
        const rowString = JSON.stringify(Object.values(row).sort());
        if (!uniqueRows.has(rowString)) {
          uniqueRows.set(rowString, row);
        }
      });
      data = Array.from(uniqueRows.values());
    }

    // 4. Apply Case Changes
    if(caseChanges.length > 0) {
        data = data.map(row => {
            const newRow = {...row};
            caseChanges.forEach(change => {
                if(newRow[change.column] !== undefined) {
                    newRow[change.column] = applyCaseChange(newRow[change.column] as string, change.type);
                }
            })
            return newRow;
        });
    }

    // 5. Rename Columns (must be last)
    data = data.map(row => {
      const newRow: Record<string, string | number> = {};
      for(const originalHeader in columnRenames) {
        const newHeader = columnRenames[originalHeader];
        if(row.hasOwnProperty(originalHeader)) {
          newRow[newHeader] = row[originalHeader];
        }
      }
      return newRow;
    });

    setRefinedData(data);
    toast({
      title: 'Data Refined!',
      description: `Applied selected transformations.`,
    });
  };

  const convertToCsv = (data: ParsedData): string => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ];
    return csvRows.join('\n');
  };

  const handleDownload = () => {
    const csvContent = convertToCsv(refinedData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const originalName = fileInfo?.name.split('.')[0] || 'data';
    link.setAttribute('download', `${originalName}_refined.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addCaseChange = () => {
    const defaultColumn = headers.find(h => typeof originalData[0]?.[h] === 'string');
    if (defaultColumn) {
      setCaseChanges([...caseChanges, { column: defaultColumn, type: 'uppercase' }]);
    } else {
        toast({ variant: 'destructive', title: 'Cannot Add Rule', description: 'No string columns available for case change.'})
    }
  };

  const updateCaseChange = (index: number, newChange: CaseChangeOptions) => {
    const newChanges = [...caseChanges];
    newChanges[index] = newChange;
    setCaseChanges(newChanges);
  };

  const removeCaseChange = (index: number) => {
    setCaseChanges(caseChanges.filter((_, i) => i !== index));
  };
  
  const refinedHeaders = useMemo(() => {
    return refinedData.length > 0 ? Object.keys(refinedData[0]) : [];
  }, [refinedData]);

  const renderInitialState = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center items-center">
        <Wrench className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-4xl font-bold">Data Refinement</h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        Clean, transform, and prepare your data for visualization. Remove null values, duplicates, and more.
      </p>
      <div className="w-full max-w-sm mx-auto">
         <FileUploader onFileUpload={handleFileUpload} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <DataVisionLogo className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">DataVision</span>
        </Link>
        <Button asChild>
          <Link href="/visualizer">
            Go to Visualizer <ArrowRight className="ml-2" />
          </Link>
        </Button>
      </header>

      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
        {originalData.length === 0 ? (
          renderInitialState()
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload New Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUploader onFileUpload={handleFileUpload} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Refinement Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible defaultValue="item-1">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Basic Cleaning</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="trim-whitespace">Trim Whitespace</Label>
                                        <Switch id="trim-whitespace" checked={options.trimWhitespace} onCheckedChange={(c) => setOptions(p => ({...p, trimWhitespace: c}))}/>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="remove-nulls">Remove Null Rows</Label>
                                        <Switch id="remove-nulls" checked={options.removeNulls} onCheckedChange={(c) => setOptions(p => ({...p, removeNulls: c}))} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="remove-duplicates">Remove Duplicate Rows</Label>
                                        <Switch id="remove-duplicates" checked={options.removeDuplicates} onCheckedChange={(c) => setOptions(p => ({...p, removeDuplicates: c}))} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Rename Columns</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4">
                                   {headers.map(header => (
                                       <div key={header} className="grid grid-cols-3 items-center gap-2">
                                           <Label htmlFor={`rename-${header}`} className="col-span-1 truncate">{header}</Label>
                                           <Input id={`rename-${header}`} value={columnRenames[header] || ''} onChange={(e) => setColumnRenames(prev => ({...prev, [header]: e.target.value}))} className="col-span-2"/>
                                       </div>
                                   ))}
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-3">
                                <AccordionTrigger>Change Text Case</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4">
                                    {caseChanges.map((change, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 rounded-md border">
                                            <CaseSensitive className="h-5 w-5 text-muted-foreground" />
                                            <div className="flex-grow grid grid-cols-2 gap-2">
                                                <Select value={change.column} onValueChange={(val) => updateCaseChange(index, {...change, column: val})}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        {headers.filter(h => typeof originalData[0]?.[h] === 'string').map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select value={change.type} onValueChange={(val) => updateCaseChange(index, {...change, type: val as any})}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="uppercase">UPPERCASE</SelectItem>
                                                        <SelectItem value="lowercase">lowercase</SelectItem>
                                                        <SelectItem value="titlecase">Title Case</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeCaseChange(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full" onClick={addCaseChange}>Add Case Change Rule</Button>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
                 <Button onClick={handleRefine} size="lg" className="w-full">
                    <Wrench className="mr-2 h-5 w-5" /> Apply Refinements
                </Button>
            </div>
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Data Preview</CardTitle>
                        <CardDescription>
                            Showing {refinedData.length} rows. Original has {originalData.length} rows.
                        </CardDescription>
                    </div>
                    <Button onClick={handleDownload} disabled={refinedData.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Download Refined Data (CSV)
                    </Button>
                </CardHeader>
                <CardContent className="max-h-[70vh] overflow-auto">
                   <Table>
                    <TableHeader className="sticky top-0 bg-muted">
                        <TableRow>
                        {refinedHeaders.map(header => <TableHead key={header}>{header}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {refinedData.slice(0, 100).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {refinedHeaders.map(header => (
                            <TableCell key={`${rowIndex}-${header}`}>
                                {row[header]}
                            </TableCell>
                            ))}
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                    {refinedData.length > 100 && (
                        <p className="text-center text-sm text-muted-foreground mt-4">
                            Showing first 100 rows.
                        </p>
                    )}
                     {refinedData.length === 0 && originalData.length > 0 && (
                        <p className="text-center text-muted-foreground mt-4">
                            All rows were removed by the refinement process or there's no data to display.
                        </p>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

    