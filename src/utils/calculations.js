/**
 * Tree Growth Characteristics Calculator - Core Calculation Engine
 * 
 * All forestry formulas implemented as pure functions.
 * Units: DBH in cm, Height in m, Diameters in cm, Area in m², Volume in m³, Biomass in kg
 */

const PI = 3.142;

/**
 * Basal Area (BA) in m²
 * BA = π × (DBH/100)² / 4
 * @param {number} dbh - Diameter at breast height in cm
 * @returns {number} Basal area in m²
 */
export function calcBasalArea(dbh) {
  if (!dbh || dbh <= 0) return 0;
  const dbhMeters = dbh / 100;
  return (PI * Math.pow(dbhMeters, 2)) / 4;
}

/**
 * Tree Height (H) in meters
 * H = RT - RB
 * @param {number} rt - Reading at the top
 * @param {number} rb - Reading at the base
 * @returns {number} Height in meters
 */
export function calcHeight(rt, rb) {
  if (rt == null || rb == null) return 0;
  return rt - rb;
}

/**
 * Tree Volume (V) in m³ using Newton's (Simpson's) Formula
 * V = π × H × [(Db/100)² + 4(Dm/100)² + (Dt/100)²] / 24
 * @param {number} h - Total height of tree in meters
 * @param {number} db - Diameter at the base in cm
 * @param {number} dm - Diameter at the middle in cm
 * @param {number} dt - Diameter at the top in cm
 * @returns {number} Volume in m³
 */
export function calcVolume(h, db, dm, dt) {
  if (!h || h <= 0 || !db || !dm || dt == null) return 0;
  const dbM = db / 100;
  const dmM = dm / 100;
  const dtM = dt / 100;
  return (PI * h * (Math.pow(dbM, 2) + 4 * Math.pow(dmM, 2) + Math.pow(dtM, 2))) / 24;
}

/**
 * Above-Ground Biomass (AGB) in kg
 * AGB = V × Wood Density × BEF
 * @param {number} volume - Tree volume in m³
 * @param {number} woodDensity - Wood density in kg/m³
 * @param {number} bef - Biomass Expansion Factor (default 2.92)
 * @returns {number} AGB in kg
 */
export function calcAGB(volume, woodDensity, bef = 2.92) {
  if (!volume || volume <= 0 || !woodDensity || woodDensity <= 0) return 0;
  return volume * woodDensity * bef;
}

/**
 * Below-Ground Biomass (BGB) in kg
 * BGB = 25% × AGB
 * @param {number} agb - Above-ground biomass in kg
 * @returns {number} BGB in kg
 */
export function calcBGB(agb) {
  if (!agb || agb <= 0) return 0;
  return 0.25 * agb;
}

/**
 * Mean Crown Diameter (Dc) in meters
 * Dc = (NS + EW) / 2
 * @param {number} ns - North-South crown measurement in meters
 * @param {number} ew - East-West crown measurement in meters
 * @returns {number} Mean crown diameter in meters
 */
export function calcCrownDiameter(ns, ew) {
  if (!ns || !ew || ns <= 0 || ew <= 0) return 0;
  return (ns + ew) / 2;
}

/**
 * Crown Projection Area (CPA) in m²
 * CPA = π × Dc² / 4
 * @param {number} dc - Mean crown diameter in meters
 * @returns {number} CPA in m²
 */
export function calcCPA(dc) {
  if (!dc || dc <= 0) return 0;
  return (PI * Math.pow(dc, 2)) / 4;
}

/**
 * Slenderness Coefficient (SLC) - dimensionless
 * SLC = H / DBH
 * Note: H in meters, DBH in cm (as per standard forestry convention)
 * @param {number} h - Total tree height in meters
 * @param {number} dbh - Diameter at breast height in cm
 * @returns {number} SLC (dimensionless ratio)
 */
export function calcSLC(h, dbh) {
  if (!h || h <= 0 || !dbh || dbh <= 0) return 0;
  return h / dbh;
}

/**
 * Quadratic Mean Diameter (Dq) in cm
 * Dq = √(ΣD² / n)
 * @param {number[]} dbhArray - Array of DBH values in cm
 * @returns {number} Quadratic mean diameter in cm
 */
export function calcQuadraticMeanDiameter(dbhArray) {
  const valid = dbhArray.filter(d => d != null && d > 0);
  if (valid.length === 0) return 0;
  const sumOfSquares = valid.reduce((sum, d) => sum + Math.pow(d, 2), 0);
  return Math.sqrt(sumOfSquares / valid.length);
}

/**
 * Plot Area in hectares
 * A = plotSize / 10,000
 * @param {number} plotSize - Plot size in m²
 * @returns {number} Plot area in hectares
 */
export function calcPlotArea(plotSize) {
  if (!plotSize || plotSize <= 0) return 0;
  return plotSize / 10000;
}

/**
 * Number of Trees per Unit Area (per hectare)
 * N = n / A
 * @param {number} n - Number of trees counted in the plot
 * @param {number} plotSize - Plot size in m²
 * @returns {number} Trees per hectare
 */
export function calcTreesPerHectare(n, plotSize) {
  const area = calcPlotArea(plotSize);
  if (area <= 0 || !n || n <= 0) return 0;
  return n / area;
}

/**
 * Stand Density Index (SDI)
 * SDI = N × (Dq / 25.4) ^ 1.605
 * @param {number} treesPerHectare - Number of trees per hectare (N)
 * @param {number} dq - Quadratic mean diameter in cm
 * @returns {number} Stand Density Index
 */
export function calcSDI(treesPerHectare, dq) {
  if (!treesPerHectare || treesPerHectare <= 0 || !dq || dq <= 0) return 0;
  return treesPerHectare * Math.pow(dq / 25.4, 1.605);
}

/**
 * Calculate all individual tree characteristics from raw inputs
 * @param {object} inputs - Raw input values for a single tree
 * @returns {object} All calculated characteristics
 */
export function calculateAllTreeMetrics(inputs) {
  const {
    species = '',
    dbh = 0,
    rt = 0,
    rb = 0,
    db = 0,
    dm = 0,
    dt = 0,
    woodDensity = 0,
    crownNS = 0,
    crownEW = 0,
  } = inputs;

  const height = calcHeight(rt, rb);
  const basalArea = calcBasalArea(dbh);
  const volume = calcVolume(height, db, dm, dt);
  const agb = calcAGB(volume, woodDensity);
  const bgb = calcBGB(agb);
  const crownDiameter = calcCrownDiameter(crownNS, crownEW);
  const cpa = calcCPA(crownDiameter);
  const slc = calcSLC(height, dbh);

  return {
    species,
    dbh,
    height,
    basalArea,
    volume,
    agb,
    bgb,
    crownDiameter,
    cpa,
    slc,
    // Pass through raw inputs
    rt, rb, db, dm, dt, woodDensity, crownNS, crownEW,
  };
}

/**
 * Calculate stand-level metrics from an array of tree data
 * @param {object[]} trees - Array of tree objects with at least dbh values
 * @param {number} plotSize - Plot size in m²
 * @returns {object} Stand-level metrics
 */
export function calculateStandMetrics(trees, plotSize) {
  const validTrees = trees.filter(t => t.dbh && t.dbh > 0);
  const n = validTrees.length;

  if (n === 0) {
    return {
      treeCount: 0,
      quadraticMeanDiameter: 0,
      plotArea: calcPlotArea(plotSize),
      treesPerHectare: 0,
      sdi: 0,
      totalBasalArea: 0,
      totalVolume: 0,
      totalAGB: 0,
      totalBGB: 0,
      meanDBH: 0,
      meanHeight: 0,
    };
  }

  const dbhArray = validTrees.map(t => t.dbh);
  const dq = calcQuadraticMeanDiameter(dbhArray);
  const treesPerHectare = calcTreesPerHectare(n, plotSize);
  const sdi = calcSDI(treesPerHectare, dq);

  const totalBasalArea = validTrees.reduce((sum, t) => sum + (t.basalArea || 0), 0);
  const totalVolume = validTrees.reduce((sum, t) => sum + (t.volume || 0), 0);
  const totalAGB = validTrees.reduce((sum, t) => sum + (t.agb || 0), 0);
  const totalBGB = validTrees.reduce((sum, t) => sum + (t.bgb || 0), 0);
  const meanDBH = dbhArray.reduce((sum, d) => sum + d, 0) / n;
  const meanHeight = validTrees.reduce((sum, t) => sum + (t.height || 0), 0) / n;

  return {
    treeCount: n,
    quadraticMeanDiameter: dq,
    plotArea: calcPlotArea(plotSize),
    treesPerHectare,
    sdi,
    totalBasalArea,
    totalVolume,
    totalAGB,
    totalBGB,
    meanDBH,
    meanHeight,
  };
}

/**
 * Format a number to a specified number of decimal places
 * @param {number} value 
 * @param {number} decimals 
 * @returns {string}
 */
export function fmt(value, decimals = 4) {
  if (value == null || isNaN(value)) return '—';
  if (value === 0) return '0';
  return Number(value).toFixed(decimals);
}
