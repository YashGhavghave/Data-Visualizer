
"use client"

import React, { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Funnel, FunnelChart, Legend, Line, LineChart, Pie, PieChart as PieChartComponent, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, RadialBar, RadialBarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, Treemap, XAxis, YAxis, ZAxis } from 'recharts';
import type { ParsedData } from '@/lib/parsers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ChartType } from '@/app/visualizer/page';

interface ChartRendererProps {
    data: ParsedData;
    chartType: ChartType;
    xAxisKey: string;
    yAxisKey: string;
    zAxisKey?: string;
    valueKey?: string; // Specifically for heatmap value
    groupKey?: string;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const HEATMAP_COLORS = ['#d6e6f2', '#b5d4e9', '#8ec1e0', '#68add6', '#429bcd'];


const CustomTooltip = ({ active, payload, label, chartType }: any) => {
    if (active && payload && payload.length) {
        const dataPoint = payload[0];
        const dataPayload = dataPoint.payload;

        if (chartType === 'funnel chart' && dataPayload && dataPayload.payload) {
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

        if (dataPayload) {
            // Special handling for heatmap payload structure
             if (chartType === 'heatmap' && dataPoint.xAxis?.name && dataPoint.yAxis?.name) {
                return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                        <div className="grid grid-cols-2 gap-2">
                            <p className="text-muted-foreground capitalize">{dataPoint.xAxis.name}</p>
                            <p className="font-medium text-right">{dataPayload[dataPoint.xAxis.dataKey as string]}</p>
                            <p className="text-muted-foreground capitalize">{dataPoint.yAxis.name}</p>
                            <p className="font-medium text-right">{dataPayload[dataPoint.yAxis.dataKey as string]}</p>
                            <p className="text-muted-foreground capitalize">Value</p>
                            <p className="font-medium text-right">{dataPayload.value}</p>
                        </div>
                    </div>
                );
            }

            return (
                <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                    <p className="font-bold mb-1">{label || dataPayload.name || (payload[0].dataKey ? dataPayload[payload[0].dataKey] : '') || 'Details'}</p>
                    {Object.entries(dataPayload).map(([key, value]) => (
                        (typeof value === 'string' || typeof value === 'number') && (
                            <div key={key} className="grid grid-cols-2 gap-2">
                                <p className="text-muted-foreground capitalize">{key}</p>
                                <p className="font-medium text-right">{String(value)}</p>
                            </div>
                        )
                    ))}
                </div>
            );
        }
    }
    return null;
};


const CustomizedTreemapContent = (props: any) => {
    const { depth, x, y, width, height, index, name, value } = props;

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
        {depth === 1 ? (
          <text x={x + 4} y={y + 18} fill="#fff" fontSize={12} fillOpacity={0.9}>
            {value}
          </text>
        ) : null}
      </g>
    );
};


const ChartRenderer = ({ data, chartType, xAxisKey, yAxisKey, zAxisKey, valueKey, groupKey }: ChartRendererProps) => {

  const numericY = (val: any) => (val === undefined || val === null || isNaN(Number(val))) ? 0 : Number(val);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    if (['bar chart', 'line chart', 'area chart', 'pie chart', 'donut chart', 'funnel chart', 'radar chart', 'radial bar chart'].includes(chartType)) {
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
        
        let mappedData = Object.keys(aggregated).map(key => ({ [xAxisKey]: key, [yAxisKey]: aggregated[key], name: key, value: aggregated[key] }));

        if (chartType === 'funnel chart') {
          return mappedData.map((item, index) => ({ ...item, fill: COLORS[index % COLORS.length] }));
        }
        return mappedData;
    }

    if (['stacked bar chart', 'grouped bar chart', 'stacked area chart'].includes(chartType) && groupKey) {
        const aggregated: Record<string, Record<string, number>> = {};
        const groupValues = new Set<string>();

        data.forEach(d => {
            const mainCategory = d[xAxisKey] as string;
            const subCategory = d[groupKey] as string;
            const value = numericY(d[yAxisKey]);

            if (!mainCategory || !subCategory || value === undefined) return;

            groupValues.add(subCategory);
            if (!aggregated[mainCategory]) {
                aggregated[mainCategory] = { [xAxisKey]: mainCategory };
            }
            if (!aggregated[mainCategory][subCategory]) {
                aggregated[mainCategory][subCategory] = 0;
            }
            aggregated[mainCategory][subCategory] += value;
        });

        return Object.values(aggregated).map(item => {
            const newItem = { ...item };
            groupValues.forEach(group => {
                if (!newItem[group]) {
                    newItem[group] = 0;
                }
            });
            return newItem;
        });
    }
    
    if (chartType === 'composed chart') {
       const aggregated: Record<string, any> = {};
       data.forEach(d => {
         const category = d[xAxisKey] as string;
         if (!category) return;
         if (!aggregated[category]) {
           aggregated[category] = { [xAxisKey]: category, [yAxisKey]: 0 };
         }
         aggregated[category][yAxisKey] += numericY(d[yAxisKey]);
       });
       return Object.values(aggregated);
    }

     if (chartType === 'treemap') {
        const aggregated: Record<string, number> = {};
        data.forEach(d => {
            const name = d[xAxisKey] as string;
            const value = numericY(d[yAxisKey]);
            if (name) {
                aggregated[name] = (aggregated[name] || 0) + value;
            }
        });
        return Object.keys(aggregated).map(name => ({
            name: name,
            size: aggregated[name],
            value: aggregated[name],
        }));
    }

    if(chartType === 'heatmap') {
        if (!valueKey) return [];
        return data.map(d => ({
            [xAxisKey]: d[xAxisKey],
            [yAxisKey]: d[yAxisKey],
            value: numericY(d[valueKey])
        }));
    }
    
    if (chartType === 'bubble chart' && zAxisKey) {
        return data.map(d => ({
            ...d,
            [xAxisKey]: numericY(d[xAxisKey]),
            [yAxisKey]: numericY(d[yAxisKey]),
            [zAxisKey]: numericY(d[zAxisKey])
        }));
    }

    if (chartType === 'scatter chart') {
        return data.map(d => ({
            ...d,
            [xAxisKey]: numericY(d[xAxisKey]),
            [yAxisKey]: numericY(d[yAxisKey]),
        }));
    }

    return data;
  }, [data, xAxisKey, yAxisKey, zAxisKey, chartType, valueKey, groupKey]);

  const groupKeys = useMemo(() => {
    if (!groupKey || !['stacked bar chart', 'grouped bar chart', 'stacked area chart'].includes(chartType)) return [];
    if (chartData.length === 0) return [];
    const keys = new Set<string>();
    chartData.forEach(row => {
        Object.keys(row).forEach(key => {
            if (key !== xAxisKey) {
                keys.add(key);
            }
        });
    });
    return Array.from(keys);
  }, [chartData, chartType, groupKey, xAxisKey]);


  const renderNoData = (message: string) => <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">{message}</div>;

  if (chartType !== 'table' && (!xAxisKey || !yAxisKey)) {
    return renderNoData("Please select the appropriate axes to display the chart.");
  }

  if (['stacked bar chart', 'grouped bar chart', 'stacked area chart'].includes(chartType) && !groupKey) {
      return renderNoData("Please select a 'Group By' category for this chart type.");
  }

  if(chartType === 'heatmap' && !valueKey) {
      return renderNoData("Please select a value for the Heatmap color scale.");
  }

  if(chartType === 'bubble chart' && !zAxisKey) {
      return renderNoData("Please select a Z-axis for the Bubble chart size.");
  }
  
  if(chartType !== 'table' && (!chartData || chartData.length === 0)) {
    return renderNoData("No data available for the selected chart configuration.");
  }
  
  const BaseChartLayout = ({ children, xIsNumeric = false }: {children: React.ReactNode, xIsNumeric?: boolean}) => (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey={xAxisKey} type={xIsNumeric ? 'number' : 'category'} tick={{fontSize: 12}} name={xAxisKey} />
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
    
    case 'donut chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
            <PieChartComponent>
                <Tooltip content={<CustomTooltip chartType={chartType} />} />
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={'60%'} outerRadius={'80%'} label>
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

    case 'stacked bar chart':
    case 'grouped bar chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <BaseChartLayout>
                        {groupKeys.map((key, index) => (
                            <Bar key={key} dataKey={key} stackId={chartType === 'stacked bar chart' ? 'a' : undefined} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BaseChartLayout>
                </BarChart>
            </ResponsiveContainer>
        );

    case 'stacked area chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <BaseChartLayout>
                        {groupKeys.map((key, index) => (
                            <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                        ))}
                    </BaseChartLayout>
                </AreaChart>
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
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <BaseChartLayout xIsNumeric={true}>
                    <Scatter name="Data points" data={chartData} fill="hsl(var(--chart-1))" />
                </BaseChartLayout>
            </ScatterChart>
            </ResponsiveContainer>
        );

    case 'bubble chart':
        return (
            <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" dataKey={xAxisKey} name={xAxisKey} tick={{fontSize: 12}} />
                <YAxis type="number" dataKey={yAxisKey} name={yAxisKey} tick={{fontSize: 12}} />
                <ZAxis type="number" dataKey={zAxisKey} name={zAxisKey} range={[100, 1000]} />
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
        
    case 'heatmap':
        const xDomain = Array.from(new Set(chartData.map(d => d[xAxisKey] as string)));
        const yDomain = Array.from(new Set(chartData.map(d => d[yAxisKey] as string)));
        
        return (
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis type="category" dataKey={xAxisKey} name={xAxisKey} ticks={xDomain} tick={{fontSize: 12}}/>
                    <YAxis type="category" dataKey={yAxisKey} name={yAxisKey} ticks={yDomain} tick={{fontSize: 12}}/>
                    <ZAxis type="number" dataKey="value" range={[0, 500]}/>
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip chartType={chartType} />} />
                    <Legend />
                    <Scatter name="Heatmap" data={chartData} shape="square">
                      {chartData.map((entry, index) => {
                          const valueDomain = chartData.map(d => d.value as number);
                          const zDomain = [Math.min(...valueDomain), Math.max(...valueDomain)];
                          const colorScale = (value: number) => {
                              if (zDomain[0] === zDomain[1]) return HEATMAP_COLORS[2];
                              const ratio = (value - zDomain[0]) / (zDomain[1] - zDomain[0] || 1);
                              const idx = Math.min(Math.floor(ratio * HEATMAP_COLORS.length), HEATMAP_COLORS.length - 1);
                              return HEATMAP_COLORS[idx];
                          };
                          return <Cell key={`cell-${index}`} fill={colorScale(entry.value as number)} />
                      })}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        );
        
    default:
        return renderNoData("Select a chart type.");
  }

};

export default ChartRenderer;

    