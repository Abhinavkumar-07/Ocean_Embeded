import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

export const Charts = ({ type, data }: any) => {
  if (!data || !data.depths) return <div style={{ color: 'var(--text-secondary)' }}>Click map to generate profile...</div>;

  // Format data for Recharts
  const chartData = data.depths.map((d: number, i: number) => ({
    depth: d,
    predicted: data.predicted[i],
    observed: data.observed[i],
  }));

  if (type === 'profile') {
    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
          <XAxis type="number" domain={[0, 32]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis dataKey="depth" type="category" reversed tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'white' }}
            itemStyle={{ color: 'white' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line type="monotone" dataKey="predicted" name="Predicted (OceanEmbed)" stroke="#38BDF8" strokeWidth={2} dot={{ r: 2, fill: '#38BDF8' }} />
          <Line type="monotone" dataKey="observed" name="ARGO (Observed)" stroke="#F97316" strokeWidth={2} dot={{ r: 2, fill: '#F97316' }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={true} horizontal={true} />
          <XAxis dataKey="depth" type="number" domain={[0, 1000]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
          <YAxis type="number" domain={[0, 32]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
          <Tooltip 
            contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'white' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#38BDF8" dot={false} strokeWidth={2} />
          <Line type="step" dataKey="observed" name="Observed" stroke="#F97316" dot={{ r: 3 }} strokeWidth={1} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'sonar') {
    const sonarData = data.depths.map((d: number, i: number) => ({
      depth: d,
      sound_speed: data.sound_speed[i],
    }));
    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={sonarData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
          <XAxis type="number" domain={['dataMin - 10', 'dataMax + 10']} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis dataKey="depth" type="category" reversed tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'white' }}
            itemStyle={{ color: 'white' }}
            formatter={(value) => [`${value} m/s`, 'Sound Speed']}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line type="monotone" dataKey="sound_speed" name="Acoustic Speed (Mackenzie)" stroke="#10B981" strokeWidth={2} dot={{ r: 2, fill: '#10B981' }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return null;
};
