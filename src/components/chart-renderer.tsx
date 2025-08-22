"use client"

import React, { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Funnel, FunnelChart, Legend, Line, LineChart, Pie, PieChart as PieChartComponent, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, RadialBar, RadialBarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, Treemap, XAxis, YAxis, ZAxis } from 'recharts';
import type { ParsedData } from '@/lib/parsers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ChartType } from '@/app/page';

interface ChartRendererProps {
    data: ParsedData;
    chartType: ChartType;
    xAxisKey: string;
    yAxisKey: string;
    zAxisKey?: string;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F", "#FFBB28", "#FF8042"];

const CustomTooltip = ({ active, payload, label, chartType }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const dataPayload = data.payload;

      // Handle Funnel chart payload which has a different structure
      if (chartType === 'funnel chart' && dataPayload.payload) {
        const { name, value } = dataPayload.payload;
        return (
           <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
             <div className="grid grid-cols-2 gap-2">
                <p className="text-muted-foreground capitalize">Name</p>
                <p className="font-medium text-right">{name}</p>
                <p className="text-muted-foreground capitalize">Value</p>
                <p className="font-medium text-right">{value}</p>
             </div>
           </div>
        );
      }
      
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
          <p className="font-bold mb-1">{label || dataPayload.name || 'Details'}</p>
          {Object.entries(dataPayload).map(([key, value]) => (
            <div key={key} className="grid grid-cols-2 gap-2">
               <p className="text-muted-foreground capitalize">{key}</p>
               <p className="font-medium text-right">{String(value)}</p>
            </div>
          ))}
        </div>
      );
    }
    return null;
};

const CustomizedTreemapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, rank, name } = props;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: COLORS[index % COLORS.length],
            stroke: '#fff',
            strokeWidth: 2 / (depth + 1e-10),
            strokeOpacity: 1 / (depth + 1e-10),
          }}
        />
        {depth === 1 ? (
          <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14}>
            {name}
          </text>
        ) : null}
      </g>
    );
};


const ChartRenderer = ({ data, chartType, xAxisKey, yAxisKey, zAxisKey }: ChartRendererProps) => {

  const chartData = useMemo(() => {
    const numericY = (val: any) => (val === undefined || val === null || isNaN(Number(val))) ? 0 : Number(val);
    
    if (!data || data.length === 0) return [];

    if (chartType === 'pie chart' || chartType === 'radial bar chart' || chartType === 'funnel chart' || chartType === 'radar chart') {
        const aggregated: Record<string, number> = {};
        data.forEach(d => {
            const category = d[xAxisKey] as string;
            const value = numericY(d[yAxisKey]);
            if(category === undefined || value === undefined) return;
            if (aggregated[category]) {
                aggregated[category] += value;
            } else {
                aggregated[category] = value;
            }
        });
        if (chartType === 'funnel chart') {
          return Object.keys(aggregated).map((key, index) => ({ name: key, value: aggregated[key], fill: COLORS[index % COLORS.length] }));
        }
        return Object.keys(aggregated).map(key => ({ name: key, value: aggregated[key] }));
    }
     if (chartType === 'treemap') {
        return data.map(d => ({
            name: d[xAxisKey],
            size: numericY(d[yAxisKey]),
        }));
    }

    return data.map(d => {
        const xValue = d[xAxisKey];
        const yValue = d[yAxisKey];
        const base = { ...d };

        if (chartType === 'scatter chart' || chartType === 'bubble chart') {
            return {
                ...base,
                [xAxisKey]: numericY(xValue),
                [yAxisKey]: numericY(yValue),
                ...(zAxisKey && { [zAxisKey]: numericY(d[zAxisKey]) })
            }
        }
        
        return {
            ...base,
            [yAxisKey]: numericY(yValue)
        };
    });
  }, [data, xAxisKey, yAxisKey, zAxisKey, chartType]);

  const renderNoData = (message: string) => <div className="flex items-center justify-center h-full text-muted-foreground">{message}</div>;

  if (chartType !== 'table' && (!xAxisKey || !yAxisKey)) {
    return renderNoData("Please select the appropriate axes or categories to display the chart.");
  }

  if(chartType !== 'table' && (!chartData || chartData.length === 0)) {
    return renderNoData("No data available for the selected chart configuration.");
  }
  
  const BaseChartLayout = ({ children }: {children: React.ReactNode}) => (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey={xAxisKey} type={chartType === 'scatter chart' || chartType === 'bubble chart' ? 'number' : 'category'} tick={{fontSize: 12}} name={xAxisKey} />
      <YAxis tick={{fontSize: 12}} name={yAxisKey} />
      <Tooltip content={<CustomTooltip chartType={chartType} />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, fill: 'hsl(var(--primary-foreground) / 0.2)' }} />
      <Legend />
      {children}
    </>
  );

  switch(chartType) {
    case 'table':
        if (!data || data.length === 0) return renderNoData("No data to display.");
        return (
            <div className="absolute inset-0 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {Object.keys(data[0]).map(key => <TableHead key={key}>{key}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow key={index}>
                                {Object.values(row).map((cell, cellIndex) => <TableCell key={cellIndex}>{String(cell)}</TableCell>)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );

    case 'pie chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
            <PieChartComponent>
                <Tooltip content={<CustomTooltip chartType={chartType} />} />
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={'80%'} label>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Legend />
            </PieChartComponent>
            </ResponsiveContainer>
        );

    case 'bar chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <BaseChartLayout>
                <Bar dataKey={yAxisKey} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BaseChartLayout>
            </BarChart>
            </ResponsiveContainer>
        );

    case 'line chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <BaseChartLayout>
                <Line type="monotone" dataKey={yAxisKey} stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 8 }} dot={{r: 4, fill: 'hsl(var(--chart-1))'}}/>
                </BaseChartLayout>
            </LineChart>
            </ResponsiveContainer>
        );

    case 'area chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <BaseChartLayout>
                    <Area type="monotone" dataKey={yAxisKey} stroke="hsl(var(--chart-1))" fill="url(#colorUv)" />
                </BaseChartLayout>
            </AreaChart>
            </ResponsiveContainer>
        );
        
    case 'scatter chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <BaseChartLayout>
                    <Scatter name="Data points" dataKey={yAxisKey} fill="hsl(var(--chart-1))" />
                </BaseChartLayout>
            </ScatterChart>
            </ResponsiveContainer>
        );

    case 'bubble chart':
        if (!zAxisKey) return renderNoData("Please select a Z-Axis (size) for the bubble chart.");
        return (
            <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" dataKey={xAxisKey} name={xAxisKey} tick={{fontSize: 12}} />
                <YAxis type="number" dataKey={yAxisKey} name={yAxisKey} tick={{fontSize: 12}} />
                <ZAxis type="number" dataKey={zAxisKey} name={zAxisKey} range={[10, 500]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip chartType={chartType} />} />
                <Legend />
                <Scatter name="Bubbles" data={chartData} fill="hsl(var(--chart-1))" />
            </ScatterChart>
            </ResponsiveContainer>
        );
    
    case 'composed chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <BaseChartLayout>
                        <Bar dataKey={yAxisKey} barSize={20} fill="hsla(var(--chart-2), 0.8)" />
                        <Line type="monotone" dataKey={yAxisKey} stroke="hsl(var(--chart-1))" />
                    </BaseChartLayout>
                </ComposedChart>
            </ResponsiveContainer>
        );
        
    case 'radar chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis />
                    <Tooltip content={<CustomTooltip chartType={chartType} />} />
                    <Radar name={yAxisKey} dataKey="value" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                    <Legend />
                </RadarChart>
            </ResponsiveContainer>
        );
        
    case 'radial bar chart':
        return (
             <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" barSize={10} data={chartData}>
                    <RadialBar 
                      background 
                      dataKey="value"
                    >
                       {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </RadialBar>
                    <Tooltip content={<CustomTooltip chartType={chartType} />}/>
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                </RadialBarChart>
            </ResponsiveContainer>
        );
        
    case 'treemap':
        return (
             <ResponsiveContainer width="100%" height="100%">
                <Treemap
                    data={chartData}
                    dataKey="size"
                    ratio={4 / 3}
                    stroke="#fff"
                    fill="hsl(var(--chart-2))"
                    content={<CustomizedTreemapContent />}
                >
                  <Tooltip content={<CustomTooltip chartType={chartType} />} />
                </Treemap>
            </ResponsiveContainer>
        );

    case 'funnel chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                    <Tooltip content={<CustomTooltip chartType={chartType} />}/>
                    <Funnel dataKey="value" data={chartData} isAnimationActive>
                       {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Funnel>
                     <Legend />
                </FunnelChart>
            </ResponsiveContainer>
        );
        
    default:
        return renderNoData("Select a chart type.");
  }

};

export default ChartRenderer;
