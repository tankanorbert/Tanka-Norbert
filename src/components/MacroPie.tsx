import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const COLORS = [
  "#ef4444", // protein - piros
  "#22c55e", // carbs - zöld
  "#facc15", // fat - sárga
];


type MacroPieProps = {
  title: string;
  calories: number;
  macros: {
    protein: { calories: number; percent: number };
    carbs: { calories: number; percent: number };
    fat: { calories: number; percent: number };
  };
};

export function MacroPie({ title, calories, macros }: MacroPieProps) {
  const data = [
    { name: `Protein (${macros.protein.percent}%)`, value: macros.protein.calories },
    { name: `Carbs (${macros.carbs.percent}%)`, value: macros.carbs.calories },
    { name: `Fat (${macros.fat.percent}%)`, value: macros.fat.calories },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 8 }}>{title} — {calories} kcal</h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
            {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
