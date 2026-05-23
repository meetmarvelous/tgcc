import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { fmt } from '../utils/calculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartColors = {
  green: 'rgba(52, 211, 153, 0.8)',
  greenBg: 'rgba(52, 211, 153, 0.15)',
  blue: 'rgba(56, 189, 248, 0.8)',
  blueBg: 'rgba(56, 189, 248, 0.15)',
  warm: 'rgba(251, 191, 36, 0.8)',
  warmBg: 'rgba(251, 191, 36, 0.15)',
  rose: 'rgba(251, 113, 133, 0.8)',
  roseBg: 'rgba(251, 113, 133, 0.15)',
  violet: 'rgba(167, 139, 250, 0.8)',
  violetBg: 'rgba(167, 139, 250, 0.15)',
};

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      labels: {
        color: '#94b8a4',
        font: { family: 'Inter', size: 11 },
        padding: 12,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(10, 15, 13, 0.95)',
      titleColor: '#e8f5ee',
      bodyColor: '#94b8a4',
      borderColor: 'rgba(52, 211, 153, 0.2)',
      borderWidth: 1,
      padding: 10,
      titleFont: { family: 'Inter', weight: '600' },
      bodyFont: { family: 'Inter' },
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(52, 211, 153, 0.06)' },
      ticks: { color: '#5e7d6b', font: { family: 'Inter', size: 11 } },
    },
    y: {
      grid: { color: 'rgba(52, 211, 153, 0.06)' },
      ticks: { color: '#5e7d6b', font: { family: 'Inter', size: 11 } },
    },
  },
};

export default function AnalyticsExport({ trees, standMetrics }) {
  const validTrees = useMemo(() => {
    return trees.filter(t => t.dbh && t.dbh > 0);
  }, [trees]);

  const labels = validTrees.map((t, i) => t.species || `Tree ${i + 1}`);

  // DBH & Height Bar Chart
  const dbhHeightData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'DBH (cm)',
        data: validTrees.map(t => t.dbh || 0),
        backgroundColor: chartColors.green,
        borderColor: chartColors.green,
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Height (m)',
        data: validTrees.map(t => t.height || 0),
        backgroundColor: chartColors.blue,
        borderColor: chartColors.blue,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }), [validTrees, labels]);

  // Volume Bar Chart
  const volumeData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Volume (m³)',
        data: validTrees.map(t => t.volume || 0),
        backgroundColor: chartColors.violet,
        borderColor: chartColors.violet,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }), [validTrees, labels]);

  // Biomass Comparison
  const biomassData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'AGB (kg)',
        data: validTrees.map(t => t.agb || 0),
        backgroundColor: chartColors.warm,
        borderColor: chartColors.warm,
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'BGB (kg)',
        data: validTrees.map(t => t.bgb || 0),
        backgroundColor: chartColors.rose,
        borderColor: chartColors.rose,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }), [validTrees, labels]);

  // Basal Area Line Chart
  const basalAreaData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Basal Area (m²)',
        data: validTrees.map(t => t.basalArea || 0),
        borderColor: chartColors.green,
        backgroundColor: chartColors.greenBg,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: chartColors.green,
        pointBorderColor: chartColors.green,
        pointRadius: 4,
      },
    ],
  }), [validTrees, labels]);

  // Biomass Ratio Doughnut
  const biomassRatioData = useMemo(() => {
    const totalAGB = standMetrics.totalAGB || 0;
    const totalBGB = standMetrics.totalBGB || 0;
    return {
      labels: ['Above-Ground Biomass', 'Below-Ground Biomass'],
      datasets: [
        {
          data: [totalAGB, totalBGB],
          backgroundColor: [chartColors.warm, chartColors.rose],
          borderColor: ['rgba(251, 191, 36, 0.3)', 'rgba(251, 113, 133, 0.3)'],
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  }, [standMetrics]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94b8a4',
          font: { family: 'Inter', size: 11 },
          padding: 16,
        },
      },
      tooltip: defaultOptions.plugins.tooltip,
    },
  };

  if (validTrees.length === 0) {
    return (
      <div className="animate-fadeInUp">
        <div className="empty-state" style={{ marginTop: '24px' }}>
          <span className="empty-state__icon">📊</span>
          <div className="empty-state__text">
            Enter tree data in the Stand Calculator tab to see analytics and charts
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      {/* Summary Cards */}
      <div className="results-grid stagger-children" style={{ marginBottom: '24px' }}>
        <div className="result-card result-card--green">
          <div className="result-card__label">Total Trees</div>
          <div className="result-card__value">{standMetrics.treeCount}</div>
        </div>
        <div className="result-card result-card--blue">
          <div className="result-card__label">Total Volume</div>
          <div className="result-card__value">{fmt(standMetrics.totalVolume, 3)}</div>
          <div className="result-card__unit">m³</div>
        </div>
        <div className="result-card result-card--warm">
          <div className="result-card__label">Total Biomass (AGB+BGB)</div>
          <div className="result-card__value">
            {fmt((standMetrics.totalAGB || 0) + (standMetrics.totalBGB || 0), 1)}
          </div>
          <div className="result-card__unit">kg</div>
        </div>
        <div className="result-card result-card--violet">
          <div className="result-card__label">Stand Density Index</div>
          <div className="result-card__value">{fmt(standMetrics.sdi, 2)}</div>
        </div>
        <div className="result-card result-card--rose">
          <div className="result-card__label">Quadratic Mean Ø</div>
          <div className="result-card__value">{fmt(standMetrics.quadraticMeanDiameter, 2)}</div>
          <div className="result-card__unit">cm</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card__title">📏 DBH & Height Distribution</div>
          <Bar data={dbhHeightData} options={defaultOptions} />
        </div>

        <div className="chart-card">
          <div className="chart-card__title">🪵 Volume per Tree</div>
          <Bar data={volumeData} options={defaultOptions} />
        </div>

        <div className="chart-card">
          <div className="chart-card__title">🌿 Biomass Comparison (AGB vs BGB)</div>
          <Bar data={biomassData} options={defaultOptions} />
        </div>

        <div className="chart-card">
          <div className="chart-card__title">📐 Basal Area Trend</div>
          <Line data={basalAreaData} options={defaultOptions} />
        </div>

        <div className="chart-card">
          <div className="chart-card__title">🥧 Biomass Ratio (Above vs Below Ground)</div>
          <Doughnut data={biomassRatioData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}
