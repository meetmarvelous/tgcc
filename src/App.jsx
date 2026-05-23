import { useState, useMemo } from 'react';
import './index.css';
import SingleTreeCalculator from './components/SingleTreeCalculator';
import StandCalculator from './components/StandCalculator';
import AnalyticsExport from './components/AnalyticsExport';
import { calculateAllTreeMetrics, calculateStandMetrics } from './utils/calculations';

const TABS = [
  { id: 'single', label: 'Single Tree', icon: '🌳' },
  { id: 'stand', label: 'Stand Calculator', icon: '🌲' },
  { id: 'analytics', label: 'Analytics & Export', icon: '📊' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('single');

  // Shared state for stand trees (used by both StandCalculator and Analytics)
  const [sharedTrees, setSharedTrees] = useState([]);
  const [sharedPlotSize, setSharedPlotSize] = useState(10000);

  // Compute metrics for analytics
  const computedSharedTrees = useMemo(() => {
    return sharedTrees.map(tree => {
      const inputs = {
        species: tree.species || '',
        dbh: parseFloat(tree.dbh) || 0,
        rt: parseFloat(tree.rt) || 0,
        rb: parseFloat(tree.rb) || 0,
        db: parseFloat(tree.db) || 0,
        dm: parseFloat(tree.dm) || 0,
        dt: parseFloat(tree.dt) || 0,
        woodDensity: parseFloat(tree.woodDensity) || 0,
        crownNS: parseFloat(tree.crownNS) || 0,
        crownEW: parseFloat(tree.crownEW) || 0,
      };
      return { ...tree, ...calculateAllTreeMetrics(inputs) };
    });
  }, [sharedTrees]);

  const sharedStandMetrics = useMemo(() => {
    return calculateStandMetrics(computedSharedTrees, sharedPlotSize);
  }, [computedSharedTrees, sharedPlotSize]);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <span className="app-header__icon">🌿</span>
        <h1 className="app-header__title">Tree Growth Characteristics Calculator</h1>
        <p className="app-header__subtitle">
          Forest Inventory & Growth Analysis System — TGCC App
        </p>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav" role="tablist" aria-label="Main navigation">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-nav__btn ${activeTab === tab.id ? 'tab-nav__btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            id={`tab-${tab.id}`}
          >
            <span className="tab-nav__icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main>
        {activeTab === 'single' && <SingleTreeCalculator />}
        {activeTab === 'stand' && (
          <StandCalculator
            onTreesChange={setSharedTrees}
            onPlotSizeChange={setSharedPlotSize}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsExport
            trees={computedSharedTrees}
            standMetrics={sharedStandMetrics}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 0 16px',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
      }}>
        TGCC App — Tree Growth Characteristics Calculator System
        <br />
        Designed for Foresters, Researchers & Forest Managers
      </footer>
    </div>
  );
}
