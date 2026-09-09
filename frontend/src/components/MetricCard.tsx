export const MetricCard = ({ icon, title, value, sub, small = false }: any) => {
  return (
    <div style={{ 
      background: 'var(--card-bg)', 
      border: '1px solid var(--card-border)', 
      borderRadius: '8px', 
      padding: small ? '1rem' : '1.2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{ 
        width: small ? '36px' : '52px', 
        height: small ? '36px' : '52px', 
        borderRadius: '12px', 
        background: 'rgba(255,255,255,0.04)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: small ? '0.75rem' : '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: small ? '1.2rem' : '1.5rem', fontWeight: 600 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );
};
