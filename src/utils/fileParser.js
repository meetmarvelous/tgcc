/**
 * File parsing utilities for CSV and XLSX files
 * Uses SheetJS (xlsx) for Excel files and PapaParse for CSV files
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Expected column headers (case-insensitive matching)
 * Maps user-friendly names to internal keys
 */
const COLUMN_MAP = {
  'tree': 'treeNo',
  'tree no': 'treeNo',
  'tree_no': 'treeNo',
  'treeno': 'treeNo',
  'no': 'treeNo',
  '#': 'treeNo',
  'species': 'species',
  'species name': 'species',
  'species_name': 'species',
  'dbh': 'dbh',
  'dbh (cm)': 'dbh',
  'dbh(cm)': 'dbh',
  'diameter': 'dbh',
  'rt': 'rt',
  'reading top': 'rt',
  'reading at top': 'rt',
  'reading_top': 'rt',
  'rb': 'rb',
  'reading base': 'rb',
  'reading at base': 'rb',
  'reading_base': 'rb',
  'height': 'height',
  'height (m)': 'height',
  'h': 'height',
  'db': 'db',
  'diameter base': 'db',
  'diameter_base': 'db',
  'db (cm)': 'db',
  'dm': 'dm',
  'diameter middle': 'dm',
  'diameter_middle': 'dm',
  'dm (cm)': 'dm',
  'dt': 'dt',
  'diameter top': 'dt',
  'diameter_top': 'dt',
  'dt (cm)': 'dt',
  'wood density': 'woodDensity',
  'wood_density': 'woodDensity',
  'wooddensity': 'woodDensity',
  'density': 'woodDensity',
  'density (kg/m3)': 'woodDensity',
  'crown ns': 'crownNS',
  'crown_ns': 'crownNS',
  'crownns': 'crownNS',
  'ns': 'crownNS',
  'north south': 'crownNS',
  'north-south': 'crownNS',
  'crown ew': 'crownEW',
  'crown_ew': 'crownEW',
  'crownew': 'crownEW',
  'ew': 'crownEW',
  'east west': 'crownEW',
  'east-west': 'crownEW',
};

/**
 * Normalize a column header to an internal key
 * @param {string} header 
 * @returns {string|null}
 */
function normalizeHeader(header) {
  if (!header) return null;
  const lower = header.toString().trim().toLowerCase();
  return COLUMN_MAP[lower] || null;
}

/**
 * Parse raw row data into a tree object using column mapping
 * @param {object} row - Raw row from parsed file
 * @param {object} headerMap - Mapping of original headers to internal keys
 * @param {number} index - Row index
 * @returns {object} Normalized tree data
 */
function parseRow(row, headerMap, index) {
  const tree = {
    id: index + 1,
    species: '',
    dbh: 0,
    rt: 0,
    rb: 0,
    db: 0,
    dm: 0,
    dt: 0,
    woodDensity: 0,
    crownNS: 0,
    crownEW: 0,
  };

  for (const [originalHeader, internalKey] of Object.entries(headerMap)) {
    const value = row[originalHeader];
    if (value == null || value === '') continue;

    if (internalKey === 'species' || internalKey === 'treeNo') {
      tree[internalKey] = String(value).trim();
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        tree[internalKey] = num;
      }
    }
  }

  return tree;
}

/**
 * Parse an XLSX file and extract tree data
 * @param {File} file - The File object from file input
 * @returns {Promise<object[]>} Array of tree objects
 */
export function parseXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          reject(new Error('The file contains no data rows.'));
          return;
        }

        // Build header mapping
        const originalHeaders = Object.keys(jsonData[0]);
        const headerMap = {};
        for (const header of originalHeaders) {
          const mapped = normalizeHeader(header);
          if (mapped) {
            headerMap[header] = mapped;
          }
        }

        const trees = jsonData.map((row, i) => parseRow(row, headerMap, i));
        resolve(trees);
      } catch (err) {
        reject(new Error(`Failed to parse Excel file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a CSV file and extract tree data
 * @param {File} file - The File object from file input
 * @returns {Promise<object[]>} Array of tree objects
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        if (results.data.length === 0) {
          reject(new Error('The CSV file contains no data rows.'));
          return;
        }

        // Build header mapping
        const originalHeaders = results.meta.fields || [];
        const headerMap = {};
        for (const header of originalHeaders) {
          const mapped = normalizeHeader(header);
          if (mapped) {
            headerMap[header] = mapped;
          }
        }

        const trees = results.data.map((row, i) => parseRow(row, headerMap, i));
        resolve(trees);
      },
      error: (err) => {
        reject(new Error(`Failed to parse CSV: ${err.message}`));
      },
    });
  });
}

/**
 * Parse any supported file (CSV or XLSX) based on extension
 * @param {File} file - The File object
 * @returns {Promise<object[]>} Array of tree objects
 */
export function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseXLSX(file);
  } else if (name.endsWith('.csv')) {
    return parseCSV(file);
  } else {
    return Promise.reject(new Error('Unsupported file format. Please upload a .csv or .xlsx file.'));
  }
}

/**
 * Export tree data to CSV and trigger download
 * @param {object[]} trees - Array of computed tree objects
 * @param {object} standMetrics - Stand-level metrics
 * @param {string} filename - Output filename
 */
export async function exportToCSV(trees, standMetrics, filename = 'tgcc_results.csv') {
  const headers = [
    'Tree No', 'Species', 'DBH (cm)', 'Height (m)', 'Basal Area (m²)',
    'Volume (m³)', 'AGB (kg)', 'BGB (kg)', 'Crown Diameter (m)',
    'CPA (m²)', 'SLC'
  ];

  const rows = trees.map((t, i) => [
    i + 1,
    t.species || '',
    t.dbh || '',
    (t.height != null ? t.height.toFixed(2) : ''),
    (t.basalArea != null ? t.basalArea.toFixed(4) : ''),
    (t.volume != null ? t.volume.toFixed(4) : ''),
    (t.agb != null ? t.agb.toFixed(2) : ''),
    (t.bgb != null ? t.bgb.toFixed(2) : ''),
    (t.crownDiameter != null ? t.crownDiameter.toFixed(2) : ''),
    (t.cpa != null ? t.cpa.toFixed(4) : ''),
    (t.slc != null ? t.slc.toFixed(4) : ''),
  ]);

  // Add stand metrics as summary rows
  rows.push([]);
  rows.push(['--- Stand Metrics ---']);
  rows.push(['Tree Count', standMetrics.treeCount]);
  rows.push(['Quadratic Mean Diameter (cm)', standMetrics.quadraticMeanDiameter?.toFixed(4)]);
  rows.push(['Plot Area (ha)', standMetrics.plotArea?.toFixed(4)]);
  rows.push(['Trees per Hectare', standMetrics.treesPerHectare?.toFixed(2)]);
  rows.push(['Stand Density Index (SDI)', standMetrics.sdi?.toFixed(4)]);
  rows.push(['Total Basal Area (m²)', standMetrics.totalBasalArea?.toFixed(4)]);
  rows.push(['Total Volume (m³)', standMetrics.totalVolume?.toFixed(4)]);
  rows.push(['Total AGB (kg)', standMetrics.totalAGB?.toFixed(2)]);
  rows.push(['Total BGB (kg)', standMetrics.totalBGB?.toFixed(2)]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  // If running natively on Android/iOS
  if (Capacitor.isNativePlatform()) {
    try {
      // Save file to app cache directory
      const result = await Filesystem.writeFile({
        path: filename,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      // Share the file natively
      await Share.share({
        title: 'TGCC Stand Results',
        text: 'Tree Growth Characteristics Calculator - Stand Level Metrics Export',
        url: result.uri,
        dialogTitle: 'Save or Share Results'
      });
      return;
    } catch (err) {
      console.error('Native sharing failed, falling back to browser download:', err);
    }
  }

  // Browser download fallback
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
