import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { calculateAllTreeMetrics, calculateStandMetrics, fmt } from '../utils/calculations';
import { parseFile, exportToCSV } from '../utils/fileParser';

const createEmptyTree = (id) => ({
  id,
  species: '',
  dbh: '',
  rt: '',
  rb: '',
  db: '',
  dm: '',
  dt: '',
  woodDensity: '',
  crownNS: '',
  crownEW: '',
});

const INPUT_COLUMNS = [
  { key: 'species', label: 'Species', type: 'text', width: '110px' },
  { key: 'dbh', label: 'DBH (cm)', type: 'number', width: '75px' },
  { key: 'rt', label: 'RT (m)', type: 'number', width: '70px' },
  { key: 'rb', label: 'RB (m)', type: 'number', width: '70px' },
  { key: 'db', label: 'Db (cm)', type: 'number', width: '75px' },
  { key: 'dm', label: 'Dm (cm)', type: 'number', width: '75px' },
  { key: 'dt', label: 'Dt (cm)', type: 'number', width: '75px' },
  { key: 'woodDensity', label: 'Density (kg/m³)', type: 'number', width: '90px' },
  { key: 'crownNS', label: 'Crown NS (m)', type: 'number', width: '80px' },
  { key: 'crownEW', label: 'Crown EW (m)', type: 'number', width: '80px' },
];

const COMPUTED_COLUMNS = [
  { key: 'height', label: 'Height (m)', decimals: 2 },
  { key: 'basalArea', label: 'BA (m²)', decimals: 4 },
  { key: 'volume', label: 'Vol (m³)', decimals: 4 },
  { key: 'agb', label: 'AGB (kg)', decimals: 2 },
  { key: 'bgb', label: 'BGB (kg)', decimals: 2 },
  { key: 'crownDiameter', label: 'Dc (m)', decimals: 2 },
  { key: 'cpa', label: 'CPA (m²)', decimals: 4 },
  { key: 'slc', label: 'SLC', decimals: 4 },
];

export default function StandCalculator({ onTreesChange, onPlotSizeChange }) {
  const [trees, setTrees] = useState(() => {
    const initial = [];
    for (let i = 1; i <= 5; i++) {
      initial.push(createEmptyTree(i));
    }
    return initial;
  });

  const [plotSize, setPlotSize] = useState('10000');
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Sync state upward for analytics
  useEffect(() => {
    if (onTreesChange) onTreesChange(trees);
  }, [trees, onTreesChange]);

  useEffect(() => {
    if (onPlotSizeChange) onPlotSizeChange(parseFloat(plotSize) || 10000);
  }, [plotSize, onPlotSizeChange]);

  // Parse numeric values for calculations
  const getNumeric = (value) => {
    if (value === '' || value == null) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Compute metrics for all trees
  const computedTrees = useMemo(() => {
    return trees.map(tree => {
      const inputs = {};
      for (const col of INPUT_COLUMNS) {
        inputs[col.key] = col.type === 'text' ? tree[col.key] : getNumeric(tree[col.key]);
      }
      return {
        ...tree,
        ...calculateAllTreeMetrics(inputs),
      };
    });
  }, [trees]);

  // Compute stand-level metrics
  const standMetrics = useMemo(() => {
    return calculateStandMetrics(computedTrees, getNumeric(plotSize));
  }, [computedTrees, plotSize]);

  // Handle cell value change
  const handleCellChange = useCallback((treeId, key, value) => {
    setTrees(prev =>
      prev.map(t => (t.id === treeId ? { ...t, [key]: value } : t))
    );
  }, []);

  // Add a new tree row
  const addRow = () => {
    setTrees(prev => {
      const nextId = Math.max(...prev.map(t => t.id), 0) + 1;
      return [...prev, createEmptyTree(nextId)];
    });
  };

  // Remove a tree row
  const removeRow = (treeId) => {
    setTrees(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(t => t.id !== treeId);
    });
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus({ type: 'info', message: `Parsing ${file.name}...` });
      const parsed = await parseFile(file);

      if (parsed.length === 0) {
        setStatus({ type: 'error', message: 'No valid data found in the file.' });
        return;
      }

      // Map parsed data to tree rows
      const importedTrees = parsed.map((row, i) => ({
        id: i + 1,
        species: row.species || '',
        dbh: row.dbh || '',
        rt: row.rt || '',
        rb: row.rb || '',
        db: row.db || '',
        dm: row.dm || '',
        dt: row.dt || '',
        woodDensity: row.woodDensity || '',
        crownNS: row.crownNS || '',
        crownEW: row.crownEW || '',
      }));

      setTrees(importedTrees);
      setStatus({
        type: 'success',
        message: `✅ Successfully imported ${importedTrees.length} trees from ${file.name}`,
      });

      // Clear status after 5 seconds
      setTimeout(() => setStatus(null), 5000);
    } catch (err) {
      setStatus({ type: 'error', message: `❌ ${err.message}` });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export data
  const handleExport = () => {
    exportToCSV(computedTrees, standMetrics);
    setStatus({ type: 'success', message: '✅ Results exported as CSV!' });
    setTimeout(() => setStatus(null), 3000);
  };

  // Clear all data
  const handleClear = () => {
    const initial = [];
    for (let i = 1; i <= 5; i++) {
      initial.push(createEmptyTree(i));
    }
    setTrees(initial);
    setStatus(null);
  };

  return (
    <div className="animate-fadeInUp">
      {/* Plot Configuration */}
      <div className="plot-config">
        <div className="form-group">
          <label htmlFor="plot-size">Plot Size (m²)</label>
          <input
            id="plot-size"
            type="text"
            inputMode="decimal"
            value={plotSize}
            onChange={e => setPlotSize(e.target.value)}
            placeholder="10000"
          />
        </div>

        <div className="btn-group" style={{ paddingBottom: '2px' }}>
          <label className="btn btn--primary btn--sm" style={{ cursor: 'pointer' }}>
            📂 Import CSV/XLSX
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          <button className="btn btn--secondary btn--sm" onClick={addRow}>
            ➕ Add Row
          </button>
          <button className="btn btn--secondary btn--sm" onClick={handleExport}>
            📥 Export CSV
          </button>
          <button className="btn btn--danger btn--sm" onClick={handleClear}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {status && (
        <div className={`status-bar status-bar--${status.type} animate-slideIn`}>
          {status.message}
        </div>
      )}

      {/* Data Table */}
      <div className="card" style={{ padding: '8px' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-index">#</th>
                {INPUT_COLUMNS.map(col => (
                  <th key={col.key} style={{ minWidth: col.width }}>
                    {col.label}
                  </th>
                ))}
                {COMPUTED_COLUMNS.map(col => (
                  <th key={col.key} className="col-header-computed">
                    {col.label}
                  </th>
                ))}
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {computedTrees.map((tree, index) => (
                <tr key={tree.id}>
                  <td className="col-index">{index + 1}</td>
                  {INPUT_COLUMNS.map(col => (
                    <td key={col.key} className="col-input">
                      <input
                        className="table-input"
                        type={col.type === 'number' ? 'text' : col.type}
                        inputMode={col.type === 'number' ? 'decimal' : undefined}
                        value={trees.find(t => t.id === tree.id)?.[col.key] ?? ''}
                        onChange={e => handleCellChange(tree.id, col.key, e.target.value)}
                        placeholder="—"
                      />
                    </td>
                  ))}
                  {COMPUTED_COLUMNS.map(col => (
                    <td key={col.key} className="col-computed">
                      {fmt(tree[col.key], col.decimals)}
                    </td>
                  ))}
                  <td>
                    <button
                      className="btn btn--danger btn--icon btn--sm"
                      onClick={() => removeRow(tree.id)}
                      title="Remove row"
                      style={{ fontSize: '0.75rem' }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stand Metrics Footer */}
      <div className="section-divider">Stand-Level Metrics</div>
      <div className="stand-metrics stagger-children">
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Trees Counted (n)</div>
          <div className="stand-metric-item__value">{standMetrics.treeCount}</div>
        </div>
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Plot Area (ha)</div>
          <div className="stand-metric-item__value">{fmt(standMetrics.plotArea, 4)}</div>
        </div>
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Trees/Hectare (N)</div>
          <div className="stand-metric-item__value">{fmt(standMetrics.treesPerHectare, 2)}</div>
        </div>
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Mean DBH</div>
          <div className="stand-metric-item__value">{fmt(standMetrics.meanDBH, 2)} cm</div>
        </div>
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Mean Height</div>
          <div className="stand-metric-item__value">{fmt(standMetrics.meanHeight, 2)} m</div>
        </div>
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Quadratic Mean Ø (Dq)</div>
          <div className="stand-metric-item__value">{fmt(standMetrics.quadraticMeanDiameter, 4)} cm</div>
        </div>
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Stand Density Index</div>
          <div className="stand-metric-item__value">{fmt(standMetrics.sdi, 4)}</div>
        </div>
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Total Basal Area</div>
          <div className="stand-metric-item__value">{fmt(standMetrics.totalBasalArea, 4)} m²</div>
        </div>
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Total Volume</div>
          <div className="stand-metric-item__value">{fmt(standMetrics.totalVolume, 4)} m³</div>
        </div>
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Total AGB</div>
          <div className="stand-metric-item__value">{fmt(standMetrics.totalAGB, 2)} kg</div>
        </div>
        <div className="stand-metric-item">
          <div className="stand-metric-item__label">Total BGB</div>
          <div className="stand-metric-item__value">{fmt(standMetrics.totalBGB, 2)} kg</div>
        </div>
      </div>
    </div>
  );
}
