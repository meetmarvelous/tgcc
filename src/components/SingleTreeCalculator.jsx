import { useState, useMemo } from 'react';
import { calculateAllTreeMetrics, fmt } from '../utils/calculations';

const DEFAULT_INPUTS = {
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
};

const INPUT_FIELDS = [
  { key: 'species', label: 'Species Name', placeholder: 'e.g. Tectona grandis', type: 'text', unit: 'optional' },
  { key: 'dbh', label: 'DBH', placeholder: '25', type: 'number', unit: 'cm' },
  { key: 'rt', label: 'Reading at Top (RT)', placeholder: '20', type: 'number', unit: 'm' },
  { key: 'rb', label: 'Reading at Base (RB)', placeholder: '2', type: 'number', unit: 'm' },
  { key: 'db', label: 'Diameter at Base (Db)', placeholder: '30', type: 'number', unit: 'cm' },
  { key: 'dm', label: 'Diameter at Middle (Dm)', placeholder: '22', type: 'number', unit: 'cm' },
  { key: 'dt', label: 'Diameter at Top (Dt)', placeholder: '12', type: 'number', unit: 'cm' },
  { key: 'woodDensity', label: 'Wood Density', placeholder: '600', type: 'number', unit: 'kg/m³' },
  { key: 'crownNS', label: 'Crown N-S', placeholder: '5', type: 'number', unit: 'm' },
  { key: 'crownEW', label: 'Crown E-W', placeholder: '4.5', type: 'number', unit: 'm' },
];

const RESULT_ITEMS = [
  { key: 'height', label: 'Height', unit: 'm', decimals: 2, color: 'green' },
  { key: 'basalArea', label: 'Basal Area', unit: 'm²', decimals: 4, color: 'green' },
  { key: 'volume', label: 'Volume', unit: 'm³', decimals: 4, color: 'blue' },
  { key: 'agb', label: 'Above-Ground Biomass', unit: 'kg', decimals: 2, color: 'warm' },
  { key: 'bgb', label: 'Below-Ground Biomass', unit: 'kg', decimals: 2, color: 'warm' },
  { key: 'crownDiameter', label: 'Crown Diameter', unit: 'm', decimals: 2, color: 'violet' },
  { key: 'cpa', label: 'Crown Projection Area', unit: 'm²', decimals: 4, color: 'violet' },
  { key: 'slc', label: 'Slenderness Coefficient', unit: 'H/DBH', decimals: 4, color: 'rose' },
];

export default function SingleTreeCalculator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);

  const handleChange = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const numericInputs = useMemo(() => {
    const parsed = {};
    for (const [key, value] of Object.entries(inputs)) {
      if (key === 'species') {
        parsed[key] = value;
      } else {
        parsed[key] = value === '' ? 0 : parseFloat(value) || 0;
      }
    }
    return parsed;
  }, [inputs]);

  const results = useMemo(() => {
    return calculateAllTreeMetrics(numericInputs);
  }, [numericInputs]);

  const hasResults = numericInputs.dbh > 0;

  const handleClear = () => {
    setInputs(DEFAULT_INPUTS);
  };

  return (
    <div className="animate-fadeInUp">
      <div className="card">
        <h2 className="card__title">
          <span className="card__title-icon">🌳</span>
          Single Tree Calculator
        </h2>

        <div className="form-grid">
          {INPUT_FIELDS.map(field => (
            <div className="form-group" key={field.key}>
              <label htmlFor={`single-${field.key}`}>
                {field.label} {field.unit && <span style={{ opacity: 0.5 }}>({field.unit})</span>}
              </label>
              <input
                id={`single-${field.key}`}
                type={field.type === 'number' ? 'text' : field.type}
                inputMode={field.type === 'number' ? 'decimal' : undefined}
                placeholder={field.placeholder}
                value={inputs[field.key]}
                onChange={e => handleChange(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px' }}>
          <button className="btn btn--secondary btn--sm" onClick={handleClear}>
            🗑️ Clear All
          </button>
        </div>
      </div>

      {hasResults && (
        <>
          <div className="section-divider">Computed Results</div>

          {numericInputs.species && (
            <div className="status-bar status-bar--success animate-slideIn">
              🌿 Species: <strong>{numericInputs.species}</strong>
            </div>
          )}

          <div className="results-grid stagger-children">
            {RESULT_ITEMS.map(item => (
              <div className={`result-card result-card--${item.color}`} key={item.key}>
                <div className="result-card__label">{item.label}</div>
                <div className="result-card__value">{fmt(results[item.key], item.decimals)}</div>
                <div className="result-card__unit">{item.unit}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {!hasResults && (
        <div className="empty-state" style={{ marginTop: '24px' }}>
          <span className="empty-state__icon">📐</span>
          <div className="empty-state__text">
            Enter tree measurements above to see calculated growth characteristics
          </div>
        </div>
      )}
    </div>
  );
}
