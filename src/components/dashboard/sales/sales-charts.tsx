
"use client"
import * as React from "react"
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, Line, LineChart, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { format } from "date-fns"

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface SalesChartsProps {
  categoryData: { name: string; sales: number }[]
  dailyData: { date: string, revenue: number }[]
  monthlyData: { month: string, revenue: number }[]
}

export default function SalesCharts({ categoryData, dailyData, monthlyData }: SalesChartsProps) {
  
  const categoryChartConfig = React.useMemo(() => {
    const config: any = {};
    categoryData.forEach((item, index) => {
        config[item.name] = {
            label: item.name,
            color: CHART_COLORS[index % CHART_COLORS.length]
        }
    })
    return config;
  }, [categoryData]);

  const dailyChartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
  } satisfies Record<string, any>;
  
  const monthlyChartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--chart-2))" },
  } satisfies Record<string, any>

  const totalSales = React.useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.sales, 0)
  }, [categoryData]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>A breakdown of revenue by product category.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={categoryChartConfig}
              className="mx-auto aspect-square h-full w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={categoryData}
                  dataKey="sales"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                >
                    {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryChartConfig[entry.name]?.color} />
                    ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  className="flex flex-wrap justify-center gap-4 mt-4"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle>Daily Sales</CardTitle>
                <CardDescription>Revenue over the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer config={dailyChartConfig} className="h-full w-full">
                    <BarChart accessibilityLayer data={dailyData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer config={monthlyChartConfig} className="h-full w-full">
                    <LineChart accessibilityLayer data={monthlyData} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0,3)} />
                        <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  )
}
