import { AdvancedDashboard } from './AdvancedDashboard'
import { OceanProvider } from './store/OceanContext';
import './index.css';

function App() {
  return (
    <OceanProvider>
      <AdvancedDashboard />
    </OceanProvider>
  );
}

export default App;
