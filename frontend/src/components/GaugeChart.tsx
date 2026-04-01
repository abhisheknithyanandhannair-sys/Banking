import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts";
import { ReadinessBand } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GaugeChartProps {
  score: number;
  band: ReadinessBand;
}

const bandColors: Record<ReadinessBand, string> = {
  Green: "hsl(152 62% 37%)",
  Amber: "hsl(37 92% 50%)",
  Red: "hsl(0 84% 60%)",
};

export default function GaugeChart({ score, band }: GaugeChartProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const data = [
    { name: "score", value: clamped },
    { name: "remaining", value: 100 - clamped },
  ];

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader>
        <CardTitle>Readiness Band</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="85%"
                startAngle={180}
                endAngle={0}
                innerRadius={80}
                outerRadius={112}
                stroke="none"
              >
                <Cell fill={bandColors[band]} />
                <Cell fill="hsl(215 30% 90%)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="-mt-16 text-center">
          <div className="text-5xl font-semibold">{clamped}</div>
          <div className="mt-2 text-sm text-muted-foreground">{band} readiness</div>
        </div>
      </CardContent>
    </Card>
  );
}
