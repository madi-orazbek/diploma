'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function CategoryChart({ data }: { data: { name: string; value: number }[] }) {
  return <div className="h-64"><ResponsiveContainer><BarChart data={data}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#2563eb" /></BarChart></ResponsiveContainer></div>;
}
export function ActivityChart({ data }: { data: { date: string; value: number }[] }) {
  return <div className="h-64"><ResponsiveContainer><LineChart data={data}><XAxis dataKey="date" /><YAxis /><Tooltip /><Line dataKey="value" stroke="#2563eb" /></LineChart></ResponsiveContainer></div>;
}
