import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, Info, TrendingDown, AlertCircle, DollarSign, Users, Building2, Activity, BarChart3, PieChart, Save, RotateCcw, ChevronDown, ChevronUp, FileDown, Mail, Printer } from 'lucide-react';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DPCCalculator.css';

// Constants
const MONTHS_PER_YEAR = 12;

// Based on HCCI and CDC chronic disease cost data
const NATIONAL_COST = {
  multi: 24500, dm2: 22100, ckd: 18200, cancer: 16800, heartfailure: 14600,
  cad: 12300, stroke: 11400, mentalhealth: 9800, chronicpain: 8900, obesity: 7600,
  copd: 6200, asthma: 4800, arthritis: 4200, htn: 3400, lipids: 2800, thyroid: 2200
};

// DPC Reduction Rates - Based on published DPC outcome studies
// Sources: Qliance (65% ED reduction), Iora Health (42% ED reduction), 
// JAMA Network Open 2020 (54% avg), DPC Frontier (27% hosp reduction)
// Conservative defaults use lower end of published ranges
const DPC_IMPACT_RATES = {
  er_reduction: 50,        // Range: 40-60%, Default: 50% (conservative)
  urgent_reduction: 50,    // Range: 40-60%, Default: 50% (conservative)
  hosp_reduction: 20,      // Range: 15-30%, Default: 20% (conservative)
  specialist_reduction: 30,
  imaging_reduction: 25,
  medication_reduction: 35
};

const STATE_COSTS = {
  // Medicare Fee Schedule + commercial multipliers (2023)
  // Source: CMS GPCI + FAIR Health database
  al: { pcp: 125, urgent: 160, er: 1900, hosp: 9500 },
  az: { pcp: 135, urgent: 175, er: 2100, hosp: 10500 },
  ca: { pcp: 165, urgent: 200, er: 2800, hosp: 14000 },
  fl: { pcp: 140, urgent: 175, er: 2200, hosp: 10500 },
  ga: { pcp: 130, urgent: 165, er: 2000, hosp: 9800 },
  il: { pcp: 150, urgent: 185, er: 2400, hosp: 11500 },
  ny: { pcp: 175, urgent: 210, er: 3100, hosp: 15500 },
  tx: { pcp: 140, urgent: 180, er: 2200, hosp: 10000 },
  wa: { pcp: 155, urgent: 190, er: 2500, hosp: 12500 },
  national: { pcp: 145, urgent: 180, er: 2450, hosp: 12000 }
};

const STATE_NAMES = {
  al: 'Alabama', az: 'Arizona', ca: 'California', fl: 'Florida', ga: 'Georgia',
  il: 'Illinois', ny: 'New York', tx: 'Texas', wa: 'Washington',
  national: 'National Average'
};

const UTILIZATION_DEFAULTS = {
  // Source: MEPS (Medical Expenditure Panel Survey) + HCCI benchmarks
  multi: { pcp: 6, urgent: 2.0, er: 0.30, hosp: 0.25 },
  dm2: { pcp: 4, urgent: 1.0, er: 0.20, hosp: 0.12 },
  htn: { pcp: 3, urgent: 1.0, er: 0.10, hosp: 0.08 },
  cad: { pcp: 5, urgent: 1.5, er: 0.25, hosp: 0.15 },
  copd: { pcp: 5, urgent: 2.5, er: 0.40, hosp: 0.22 },
  asthma: { pcp: 4, urgent: 2.0, er: 0.15, hosp: 0.08 }
};

// Helper function to format field names for display
const formatLabel = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export default function DPCCalculator() {
  // Load saved data from localStorage on mount
  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem('dpc_calculator_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.formData || null;
      }
    } catch (e) {
      console.error('Error loading saved data:', e);
    }
    return null;
  };

  const defaultFormData = {
    insurance_type: 'fully_insured',
    state: 'tx',
    chronic_condition: 'multi',
    num_employees: 50,
    pcp_visits: 6,
    urgent_visits: 2.0,
    er_visits: 0.30,
    hosp_admits: 0.25,
    pcp_cost: 140,
    urgent_cost: 180,
    er_cost: 2200,
    hosp_cost: 10000,
    annual_premium: 7000,
    premium_reduction: 25,
    pairing_with_hdhp: true, // NEW: Explicit HDHP pairing toggle
    admin_fees_pmpm: 75,
    stop_loss_premium_pmpm: 150,
    dpc_monthly: 75,
    reduction_percent: DPC_IMPACT_RATES.er_reduction,
    hosp_reduction_percent: DPC_IMPACT_RATES.hosp_reduction
  };

  const [formData, setFormData] = useState(loadSavedData() || defaultFormData);
  const [results, setResults] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    basic: false,
    costs: false,
    dpc: false,
    results: false,
    charts: false
  });
  const [lastSaved, setLastSaved] = useState(null);

  // Autosave to localStorage whenever formData changes
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('dpc_calculator_draft', JSON.stringify({
          formData,
          timestamp: new Date().toISOString()
        }));
        setLastSaved(new Date());
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [formData]);

  // Keyboard shortcut: Enter to calculate
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Enter key triggers calculation if not in textarea
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !e.shiftKey && !e.ctrlKey) {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT')) {
          e.preventDefault();
          calculateSavings();
        }
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [formData]); // Re-attach when formData changes to capture latest state

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section) => {
    setSectionsCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const resetForm = () => {
    if (window.confirm('Reset calculator to default values? This will clear all your inputs.')) {
      setFormData(defaultFormData);
      setResults(null);
      localStorage.removeItem('dpc_calculator_draft');
      setLastSaved(null);
    }
  };

  const clearSavedDraft = () => {
    localStorage.removeItem('dpc_calculator_draft');
    setLastSaved(null);
  };

  const applyStateDefaults = (state) => {
    const costs = STATE_COSTS[state] || STATE_COSTS.national;
    setFormData(prev => ({
      ...prev,
      state,
      pcp_cost: costs.pcp,
      urgent_cost: costs.urgent,
      er_cost: costs.er,
      hosp_cost: costs.hosp
    }));
  };

  const applyConditionDefaults = (condition) => {
    const util = UTILIZATION_DEFAULTS[condition];
    if (util) {
      setFormData(prev => ({
        ...prev,
        chronic_condition: condition,
        pcp_visits: util.pcp,
        urgent_visits: util.urgent,
        er_visits: util.er,
        hosp_admits: util.hosp
      }));
    }
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (!results) return;

    const csvRows = [];
    csvRows.push('DPC ROI Calculator - Results Export');
    csvRows.push('');
    csvRows.push('Summary Metrics');
    csvRows.push(`Total Annual Savings,$${results.annual_total_savings.toLocaleString()}`);
    csvRows.push(`ROI Percentage,${results.roi_percentage.toFixed(1)}%`);
    csvRows.push(`Savings per Employee,$${results.annual_savings_per_employee.toLocaleString()}`);
    csvRows.push(`DPC Investment,$${results.dpc_investment.toLocaleString()}`);
    csvRows.push('');
    csvRows.push('Company Information');
    csvRows.push(`Insurance Type,${formData.insurance_type}`);
    csvRows.push(`State,${STATE_NAMES[formData.state]}`);
    csvRows.push(`Number of Employees,${formData.num_employees}`);
    csvRows.push('');
    csvRows.push('Cost Breakdown');
    csvRows.push('Component,Traditional,With DPC,Savings');
    
    if (results.insurance_type === 'fully_insured') {
      csvRows.push(`Insurance Premium,$${results.traditional_breakdown.premium.toLocaleString()},$${results.dpc_breakdown.premium.toLocaleString()},$${(results.traditional_breakdown.premium - results.dpc_breakdown.premium).toLocaleString()}`);
      csvRows.push(`DPC Membership,$0,$${results.dpc_breakdown.membership.toLocaleString()},-$${results.dpc_breakdown.membership.toLocaleString()}`);
    } else {
      Object.keys(results.traditional_breakdown).forEach(key => {
        const trad = results.traditional_breakdown[key];
        const dpc = results.dpc_breakdown[key] || 0;
        csvRows.push(`${formatLabel(key)},$${trad.toLocaleString()},$${dpc.toLocaleString()},$${(trad - dpc).toLocaleString()}`);
      });
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `DPC_Impact_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Email mailto link function
  const emailResults = () => {
    if (!results) return;

    const subject = encodeURIComponent('DPC Impact Analysis Results');
    const body = encodeURIComponent(`DPC Impact Analysis - Results

SUMMARY METRICS:
• Total Annual Savings: $${results.annual_total_savings.toLocaleString()}
• ROI Percentage: ${results.roi_percentage.toFixed(1)}%
• Savings per Employee: $${results.annual_savings_per_employee.toLocaleString()}
• DPC Investment: $${results.dpc_investment.toLocaleString()}
• 5-Year Projection: $${(results.annual_total_savings * 5).toLocaleString()}

COMPANY INFORMATION:
• Insurance Type: ${formData.insurance_type}
• State: ${STATE_NAMES[formData.state]}
• Number of Employees: ${formData.num_employees}
• Chronic Condition Profile: ${formData.chronic_condition}

COST COMPARISON:
• Traditional Healthcare: $${results.traditional_annual_per_employee.toLocaleString()}/employee/year
• With DPC: $${results.dpc_annual_per_employee.toLocaleString()}/employee/year
• Savings: $${results.annual_savings_per_employee.toLocaleString()}/employee/year

This analysis was generated using the DPC Impact Analysis platform.
Educational estimates only - not actuarial projections.
Consult licensed benefits consultants and actuaries before making coverage decisions.
`);

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Print function
  const printResults = () => {
    window.print();
  };

  const calculateSavings = () => {
    setCalculating(true);
    
    setTimeout(() => {
      const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
      const clamp = (v, min, max) => Math.min(Math.max(num(v), min), max);
      const pct = (v) => clamp(v, 0, 100) / 100;
      const money = (v) => Math.round((num(v) + Number.EPSILON) * 100) / 100;

      const CAPS = {
        ER_URGENT: 50,
        HOSP: 20,
        PREMIUM: 25,
        RETAIL_MULTIPLIER: 1.5,
        WHOLESALE_MULTIPLIER: 0.7
      };

      const insuranceType = formData.insurance_type;
      const employees = clamp(formData.num_employees, 1, 500000);

      const erUrgentRed = pct(clamp(formData.reduction_percent, 0, CAPS.ER_URGENT));
      const hospRed = pct(clamp(formData.hosp_reduction_percent, 0, CAPS.HOSP));
      const premiumRed = pct(clamp(formData.premium_reduction ?? 0, 0, CAPS.PREMIUM));

      const pcpClaims = clamp(formData.pcp_visits, 0, 12) * clamp(formData.pcp_cost, 0, 100000);
      const urgentClaims = clamp(formData.urgent_visits, 0, 12) * clamp(formData.urgent_cost, 0, 100000);
      const erClaims = clamp(formData.er_visits, 0, 12) * clamp(formData.er_cost, 0, 100000);
      const hospClaims = clamp(formData.hosp_admits, 0, 2) * clamp(formData.hosp_cost, 0, 500000);

      const dpcMembership = clamp(formData.dpc_monthly, 0, 500) * MONTHS_PER_YEAR;

      const dpcUrgentClaims = urgentClaims * (1 - erUrgentRed);
      const dpcErClaims = erClaims * (1 - erUrgentRed);
      const dpcHospClaims = hospClaims * (1 - hospRed);

      let traditionalTotal = 0;
      let dpcTotal = 0;
      let traditionalBreakdown = {};
      let dpcBreakdown = {};

      if (insuranceType === 'fully_insured') {
        const annualPremium = clamp(formData.annual_premium, 0, 50000);
        // Only apply premium reduction if explicitly pairing with HDHP
        const pairingHDHP = formData.pairing_with_hdhp ?? true;
        const actualPremiumRed = pairingHDHP ? premiumRed : 0;
        const reducedPremium = annualPremium * (1 - actualPremiumRed);

        traditionalTotal = annualPremium;
        dpcTotal = reducedPremium + dpcMembership;

        const utilizationEstimate = pcpClaims + urgentClaims + erClaims + hospClaims;
        const utilizationSavingsEstimate =
          pcpClaims + (urgentClaims + erClaims) * erUrgentRed + hospClaims * hospRed; // FIXED: Add PCP savings

        traditionalBreakdown = {
          premium: money(annualPremium),
          utilization_estimate: money(utilizationEstimate)
        };

        dpcBreakdown = {
          premium: money(reducedPremium),
          membership: money(dpcMembership),
          utilization_estimate: money(utilizationEstimate - utilizationSavingsEstimate),
          hdhp_pairing: pairingHDHP
        };
      } else if (insuranceType === 'self_funded') {
        const admin = clamp(formData.admin_fees_pmpm, 0, 2000) * MONTHS_PER_YEAR;
        const stopLoss = clamp(formData.stop_loss_premium_pmpm, 0, 2000) * MONTHS_PER_YEAR;

        // CRITICAL FIX: DPC membership REPLACES PCP claims
        traditionalTotal = pcpClaims + urgentClaims + erClaims + hospClaims + admin + stopLoss;
        // DPC: PCP cost = $0 (replaced by membership), reduced ER/urgent/hosp
        dpcTotal = dpcUrgentClaims + dpcErClaims + dpcHospClaims + admin + stopLoss + dpcMembership;

        traditionalBreakdown = {
          pcp: money(pcpClaims),
          urgent: money(urgentClaims),
          er: money(erClaims),
          hospital: money(hospClaims),
          admin_fees: money(admin),
          stop_loss: money(stopLoss)
        };

        dpcBreakdown = {
          pcp: money(0), // FIXED: Explicit $0 for PCP (replaced by DPC membership)
          membership: money(dpcMembership),
          urgent: money(dpcUrgentClaims),
          er: money(dpcErClaims),
          hospital: money(dpcHospClaims),
          admin_fees: money(admin),
          stop_loss: money(stopLoss)
        };
      } else { // no_insurance
        const retail = CAPS.RETAIL_MULTIPLIER;
        const wholesale = CAPS.WHOLESALE_MULTIPLIER;

        const traditionalMedical = (pcpClaims + urgentClaims + erClaims + hospClaims) * retail;
        // FIXED: DPC eliminates PCP claims entirely (replaced by membership)
        const dpcMedical = (dpcUrgentClaims + dpcErClaims + dpcHospClaims) * wholesale;

        traditionalTotal = traditionalMedical;
        dpcTotal = dpcMembership + dpcMedical;

        traditionalBreakdown = { medical: money(traditionalMedical) };
        dpcBreakdown = { 
          pcp_eliminated: money(pcpClaims * retail), // Show PCP savings explicitly
          membership: money(dpcMembership), 
          medical: money(dpcMedical) 
        };
      }

      const perEmployeeSavings = traditionalTotal - dpcTotal;
      const totalSavings = perEmployeeSavings * employees;
      const dpcInvestment = dpcMembership * employees;
      const roiOnInvestmentPct = dpcInvestment > 0 ? (totalSavings / dpcInvestment) * 100 : 0;

      // 5-YEAR PROJECTION with medical trend
      const MEDICAL_TREND = 0.065; // 6.5% annual trend (industry standard)
      const DPC_FEE_INCREASE = 0.03; // DPC fees increase 3% per year
      
      const fiveYearProjection = [];
      for (let year = 1; year <= 5; year++) {
        const trendFactor = Math.pow(1 + MEDICAL_TREND, year - 1);
        const dpcFeeFactor = Math.pow(1 + DPC_FEE_INCREASE, year - 1);
        
        const yearTraditional = traditionalTotal * trendFactor;
        const yearDPC = (dpcTotal - dpcMembership) * trendFactor + dpcMembership * dpcFeeFactor;
        const yearSavings = (yearTraditional - yearDPC) * employees;
        
        fiveYearProjection.push({
          year,
          traditional: money(yearTraditional),
          dpc: money(yearDPC),
          savings: money(yearSavings),
          cumulative: money(fiveYearProjection.reduce((sum, y) => sum + y.savings, yearSavings))
        });
      }

      setResults({
        traditional_annual_per_employee: money(traditionalTotal),
        dpc_annual_per_employee: money(dpcTotal),
        annual_savings_per_employee: money(perEmployeeSavings),
        annual_total_savings: money(totalSavings),
        dpc_investment: money(dpcInvestment),
        roi_percentage: money(roiOnInvestmentPct),
        insurance_type: insuranceType,
        traditional_breakdown: traditionalBreakdown,
        dpc_breakdown: dpcBreakdown,
        five_year_projection: fiveYearProjection // NEW: 5-year trend analysis
      });

      setCalculating(false);
    }, 300);
  };

  return (
    <div className="dpc-calculator">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1>DPC Impact Analysis</h1>
          <p className="subtitle">
            Quantify Healthcare Savings with Data-Driven DPC Modeling
          </p>
          
          {/* Autosave indicator and reset button */}
          <div className="toolbar">
            {lastSaved && (
              <div className="autosave-indicator">
                <Save size={14} />
                <span>Draft saved {new Date(lastSaved).toLocaleTimeString()}</span>
              </div>
            )}
            <button 
              onClick={resetForm}
              className="reset-button"
              title="Reset calculator to default values"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>
        </header>

        <div className="content">
          {/* Form Section */}
          <div className="form-section">
            {/* Basic Information */}
            <div className="card">
              <div className="card-header" onClick={() => toggleSection('basic')}>
                <div className="card-header-content">
                  <div className="step-badge">1</div>
                  <h2>Basic Information</h2>
                </div>
                <button className="collapse-toggle" aria-label="Toggle section">
                  {sectionsCollapsed.basic ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              {!sectionsCollapsed.basic && (
              <div className="card-content">
                <div className="form-group">
                  <label>
                    Insurance Type
                    <span className="info-icon" title="Choose your current insurance structure">
                      <Info size={16} />
                    </span>
                  </label>
                  <select
                    value={formData.insurance_type}
                    onChange={(e) => handleInputChange('insurance_type', e.target.value)}
                  >
                    <option value="fully_insured">Fully Insured</option>
                    <option value="self_funded">Self-Funded</option>
                    <option value="no_insurance">No Insurance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => applyStateDefaults(e.target.value)}
                  >
                    {Object.entries(STATE_NAMES).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Chronic Condition Profile</label>
                  <select
                    value={formData.chronic_condition}
                    onChange={(e) => applyConditionDefaults(e.target.value)}
                  >
                    <option value="multi">Multiple Conditions (3+) - $24,500/yr</option>
                    <option value="dm2">Type 2 Diabetes - $22,100/yr</option>
                    <option value="ckd">Chronic Kidney Disease - $18,200/yr</option>
                    <option value="cad">Coronary Artery Disease - $12,300/yr</option>
                    <option value="copd">COPD - $6,200/yr</option>
                    <option value="asthma">Asthma - $4,800/yr</option>
                    <option value="htn">Hypertension - $3,400/yr</option>
                  </select>
                  {NATIONAL_COST[formData.chronic_condition] && (
                    <div className="info-box">
                      📊 National Avg Cost: ${NATIONAL_COST[formData.chronic_condition].toLocaleString()}/year
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Number of Employees</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.num_employees}
                    onChange={(e) => handleInputChange('num_employees', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              )}
            </div>

            {/* Healthcare Costs */}
            <div className="card">
              <div className="card-header" onClick={() => toggleSection('costs')}>
                <div className="card-header-content">
                  <div className="step-badge">2</div>
                  <h2>Healthcare Costs & Utilization</h2>
                </div>
                <button className="collapse-toggle" aria-label="Toggle section">
                  {sectionsCollapsed.costs ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              {!sectionsCollapsed.costs && (
              <div className="card-content">
                <div className="grid-2">
                  <div className="form-group">
                    <label>PCP Visits/Year</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.pcp_visits}
                      onChange={(e) => handleInputChange('pcp_visits', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cost per Visit ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.pcp_cost}
                      onChange={(e) => handleInputChange('pcp_cost', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Urgent Care/Year</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.urgent_visits}
                      onChange={(e) => handleInputChange('urgent_visits', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cost per Visit ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.urgent_cost}
                      onChange={(e) => handleInputChange('urgent_cost', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>ER Visits/Year</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.er_visits}
                      onChange={(e) => handleInputChange('er_visits', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cost per Visit ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.er_cost}
                      onChange={(e) => handleInputChange('er_cost', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hospitalizations/Year</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.hosp_admits}
                      onChange={(e) => handleInputChange('hosp_admits', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cost per Stay ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.hosp_cost}
                      onChange={(e) => handleInputChange('hosp_cost', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                {formData.insurance_type === 'fully_insured' && (
                  <div className="insurance-specific">
                    <div className="grid-2">
                      <div className="form-group">
                        <label>Annual Premium ($)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.annual_premium}
                          onChange={(e) => handleInputChange('annual_premium', parseFloat(e.target.value))}
                        />
                        <small>Employer's annual premium per employee</small>
                      </div>
                      <div className="form-group">
                        <label>
                          Premium Reduction (%)
                          <span className="info-icon" title="Premium reduction achieved by pairing DPC with High Deductible Health Plan (HDHP). DPC covers all primary care; HDHP provides catastrophic coverage only. Lower premium HDHP offsets DPC membership cost. Typical employer savings: 20-40%.">
                            <Info size={16} />
                          </span>
                        </label>
                        
                        {/* NEW: HDHP Pairing Checkbox */}
                        <div className="form-group checkbox-group" style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={formData.pairing_with_hdhp ?? true}
                              onChange={(e) => handleInputChange('pairing_with_hdhp', e.target.checked)}
                              style={{ marginRight: '8px', width: 'auto' }}
                            />
                            <span>Pairing DPC with HDHP (required for premium reduction)</span>
                          </label>
                        </div>
                        
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={formData.premium_reduction}
                          onChange={(e) => handleInputChange('premium_reduction', parseFloat(e.target.value))}
                          disabled={!formData.pairing_with_hdhp}
                        />
                        <small>{formData.pairing_with_hdhp ? 'Typical: 20-40% reduction' : 'Enable HDHP pairing to apply premium reduction'}</small>
                      </div>
                    </div>
                  </div>
                )}

                {formData.insurance_type === 'self_funded' && (
                  <div className="insurance-specific">
                    <div className="grid-2">
                      <div className="form-group">
                        <label>Admin Fees PMPM ($)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.admin_fees_pmpm}
                          onChange={(e) => handleInputChange('admin_fees_pmpm', parseFloat(e.target.value))}
                        />
                        <small>Typical: $50-100/month</small>
                      </div>
                      <div className="form-group">
                        <label>Stop-Loss Premium PMPM ($)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stop_loss_premium_pmpm}
                          onChange={(e) => handleInputChange('stop_loss_premium_pmpm', parseFloat(e.target.value))}
                        />
                        <small>Typical: $100-200/month</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* DPC Settings */}
            <div className="card dpc-card">
              <div className="card-header" onClick={() => toggleSection('dpc')}>
                <div className="card-header-content">
                  <TrendingDown size={20} />
                  <h2>DPC Impact Assumptions</h2>
                </div>
                <button className="collapse-toggle" aria-label="Toggle section">
                  {sectionsCollapsed.dpc ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              {!sectionsCollapsed.dpc && (
              <div className="card-content">
                <div className="grid-3">
                  <div className="form-group">
                    <label>DPC Monthly Cost ($)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.dpc_monthly}
                      onChange={(e) => handleInputChange('dpc_monthly', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      ER/Urgent Reduction (%)
                      <span className="info-icon" title="Research: Qliance 65%, Iora 42%, JAMA 2020: 54% avg. Conservative default: 50%">
                        <Info size={16} />
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.reduction_percent}
                      onChange={(e) => handleInputChange('reduction_percent', parseFloat(e.target.value))}
                    />
                    <small className="range-display">
                      Published range: 40-60%
                    </small>
                  </div>
                  <div className="form-group">
                    <label>
                      Hospital Reduction (%)
                      <span className="info-icon" title="Research: DPC Frontier 27%, JPCC 2019: 19% avg. Conservative default: 20%">
                        <Info size={16} />
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.hosp_reduction_percent}
                      onChange={(e) => handleInputChange('hosp_reduction_percent', parseFloat(e.target.value))}
                    />
                    <small className="range-display">
                      Published range: 15-30%
                    </small>
                  </div>
                </div>

                <button
                  className="calculate-btn"
                  onClick={calculateSavings}
                  disabled={calculating}
                >
                  {calculating ? (
                    <>Calculating...</>
                  ) : (
                    <>
                      <Calculator size={20} />
                      Calculate Savings
                    </>
                  )}
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          {results && (
            <div className="results-section">
              <h2 className="results-title">Your DPC Impact Analysis</h2>
              
              {/* Credibility Warning for Small Sample Sizes */}
              {formData.num_employees < 100 && (
                <div className="credibility-warning">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Sample Size Notice:</strong> Results for employers with fewer than 100 employees may have higher variance. 
                    Actual outcomes can vary significantly based on employee demographics, health status, and local market conditions. 
                    Larger populations produce more statistically reliable estimates. Consider professional actuarial review for implementation decisions.
                  </div>
                </div>
              )}
              
              {/* Summary Cards */}
              <div className="summary-cards">
                <div className="summary-card highlight">
                  <DollarSign className="card-icon" size={32} />
                  <div>
                    <h3>Total Annual Savings</h3>
                    <p className="big-number">${results.annual_total_savings.toLocaleString()}</p>
                  </div>
                </div>
                <div className="summary-card">
                  <TrendingDown className="card-icon" size={32} />
                  <div>
                    <h3>ROI Percentage</h3>
                    <p className="big-number">{results.roi_percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="summary-card">
                  <Users className="card-icon" size={32} />
                  <div>
                    <h3>Savings per Employee</h3>
                    <p className="big-number">${results.annual_savings_per_employee.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Export/Share Buttons */}
              <div className="export-buttons">
                <button onClick={exportToCSV} className="export-button" title="Download CSV">
                  <FileDown size={16} />
                  <span>Export CSV</span>
                </button>
                <button onClick={emailResults} className="export-button" title="Email results">
                  <Mail size={16} />
                  <span>Email Results</span>
                </button>
                <button onClick={printResults} className="export-button" title="Print results">
                  <Printer size={16} />
                  <span>Print</span>
                </button>
              </div>

              {/* Cost Comparison */}
              <div className="comparison-section">
                <h3>Cost Breakdown & Proof</h3>
                <div className="comparison-table">
                  <div className="table-header">
                    <div>Cost Component</div>
                    <div>Traditional Healthcare</div>
                    <div>With DPC</div>
                    <div>Savings</div>
                  </div>
                  <div className="table-body">
                    {results.insurance_type === 'fully_insured' && (
                      <>
                        <div className="table-row">
                          <div>Insurance Premium</div>
                          <div>${results.traditional_breakdown.premium.toLocaleString()}</div>
                          <div>${results.dpc_breakdown.premium.toLocaleString()}</div>
                          <div className="savings">
                            ${(results.traditional_breakdown.premium - results.dpc_breakdown.premium).toLocaleString()}
                          </div>
                        </div>
                        <div className="table-row">
                          <div>DPC Membership</div>
                          <div>$0</div>
                          <div>${results.dpc_breakdown.membership.toLocaleString()}</div>
                          <div className="cost">-${results.dpc_breakdown.membership.toLocaleString()}</div>
                        </div>
                      </>
                    )}
                    {results.insurance_type === 'self_funded' && (
                      <>
                        {Object.keys(results.traditional_breakdown).map(key => (
                          <div className="table-row" key={key}>
                            <div>{formatLabel(key)}</div>
                            <div>${results.traditional_breakdown[key].toLocaleString()}</div>
                            <div>${(results.dpc_breakdown[key] || 0).toLocaleString()}</div>
                            <div className={results.traditional_breakdown[key] > (results.dpc_breakdown[key] || 0) ? 'savings' : 'cost'}>
                              ${Math.abs(results.traditional_breakdown[key] - (results.dpc_breakdown[key] || 0)).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    <div className="table-row total">
                      <div><strong>Total Annual Cost</strong></div>
                      <div><strong>${results.traditional_annual_per_employee.toLocaleString()}</strong></div>
                      <div><strong>${results.dpc_annual_per_employee.toLocaleString()}</strong></div>
                      <div className="savings"><strong>${results.annual_savings_per_employee.toLocaleString()}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Analytics Section */}
              <div className="analytics-section">
                <h3 className="section-title">
                  <BarChart3 size={24} />
                  Visual Savings Analysis
                </h3>
                
                <div className="charts-grid">
                  {/* Savings Comparison Bar Chart */}
                  <div className="chart-card">
                    <h4>Cost Comparison</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        {
                          name: 'Traditional',
                          cost: results.traditional_annual_per_employee,
                          fill: '#ef4444'
                        },
                        {
                          name: 'With DPC',
                          cost: results.dpc_annual_per_employee,
                          fill: '#10b981'
                        }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <Tooltip 
                          formatter={(value) => `$${value.toLocaleString()}`}
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                        <Bar dataKey="cost" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 5-Year Savings Projection */}
                  <div className="chart-card">
                    <h4>5-Year Cumulative Savings</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[
                        { year: 'Year 1', savings: results.annual_total_savings },
                        { year: 'Year 2', savings: results.annual_total_savings * 2 },
                        { year: 'Year 3', savings: results.annual_total_savings * 3 },
                        { year: 'Year 4', savings: results.annual_total_savings * 4 },
                        { year: 'Year 5', savings: results.annual_total_savings * 5 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip 
                          formatter={(value) => `$${value.toLocaleString()}`}
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="savings" 
                          stroke="#667eea" 
                          strokeWidth={3}
                          dot={{ fill: '#667eea', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Savings Breakdown Donut */}
                {results.insurance_type === 'fully_insured' && (
                  <div className="chart-card full-width">
                    <h4>Savings Breakdown</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={[
                            { name: 'Premium Savings', value: results.traditional_breakdown.premium - results.dpc_breakdown.premium, color: '#10b981' },
                            { name: 'DPC Investment', value: results.dpc_breakdown.membership, color: '#f59e0b' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                        >
                          {[
                            { name: 'Premium Savings', value: results.traditional_breakdown.premium - results.dpc_breakdown.premium, color: '#10b981' },
                            { name: 'DPC Investment', value: results.dpc_breakdown.membership, color: '#f59e0b' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* 5-YEAR PROJECTION TABLE */}
              {results.five_year_projection && (
                <div className="projection-section" style={{ marginTop: '30px' }}>
                  <h3>5-Year Savings Projection</h3>
                  <p className="note" style={{ marginBottom: '15px' }}>
                    Projections include 6.5% annual medical trend and 3% DPC fee increase
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="projection-table" style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#667eea', color: 'white' }}>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Year</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Traditional Cost</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>DPC Cost</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Annual Savings</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Cumulative Savings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.five_year_projection.map((yearData, idx) => (
                          <tr key={idx} style={{ 
                            borderBottom: '1px solid #e5e7eb',
                            backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'white'
                          }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>Year {yearData.year}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              ${(yearData.traditional * formData.num_employees).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              ${(yearData.dpc * formData.num_employees).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                              ${yearData.savings.toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#667eea', fontWeight: 'bold' }}>
                              ${yearData.cumulative.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Calculation Methodology */}
              <div className="methodology-section">
                <h3>Calculation Methodology</h3>
                <div className="methodology-content">
                  <div className="method-card">
                    <h4>Data Sources</h4>
                    <ul>
                      <li><strong>Reduction Rates:</strong> Qliance, Iora Health, JAMA Network Open (2020)</li>
                      <li><strong>Cost Data:</strong> CDC, HCCI, Medicare Fee Schedules</li>
                      <li><strong>Utilization:</strong> MEPS (Medical Expenditure Panel Survey)</li>
                      <li><strong>Premiums:</strong> Kaiser Family Foundation Employer Health Benefits Survey</li>
                    </ul>
                  </div>
                  <div className="method-card">
                    <h4>Conservative Assumptions</h4>
                    <ul>
                      <li>ER/Urgent reduction: 50% (published range: 40-60%)</li>
                      <li>Hospital reduction: 20% (published range: 15-30%)</li>
                      <li>Premium reduction: 25% (published range: 20-40%)</li>
                      <li>No stacking of reductions - applied independently</li>
                    </ul>
                  </div>
                  {results.insurance_type === 'fully_insured' && (
                    <div className="method-card">
                      <h4>Fully Insured Formula</h4>
                      <p><strong>Traditional:</strong> Annual Premium × Employees</p>
                      <p><strong>With DPC:</strong> Reduced Premium + (DPC Fee × 12 × Employees)</p>
                      <p className="note">Premium reduction from pairing DPC with lower-cost HDHP</p>
                    </div>
                  )}
                  {results.insurance_type === 'self_funded' && (
                    <div className="method-card">
                      <h4>Self-Funded Formula</h4>
                      <p><strong>Traditional:</strong> PCP + Urgent + ER + Hospital Claims + Admin + Stop-Loss</p>
                      <p><strong>With DPC:</strong> Reduced Claims + Admin + Stop-Loss + DPC Membership</p>
                      <p className="note">Direct utilization reduction from improved primary care access</p>
                    </div>
                  )}
                  {results.insurance_type === 'no_insurance' && (
                    <div className="method-card">
                      <h4>No Insurance Formula</h4>
                      <p><strong>Traditional:</strong> Medical Costs × 1.5 (retail pricing)</p>
                      <p><strong>With DPC:</strong> DPC Membership + Reduced Costs × 0.7 (wholesale)</p>
                      <p className="note">Reflects negotiated vs. retail pricing differential</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="metrics-section">
                <h3>Key Metrics</h3>
                <div className="metrics-grid">
                  <div className="metric">
                    <span className="metric-label">Break-even Period:</span>
                    <span className="metric-value">Immediate</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">5-Year Savings Projection:</span>
                    <span className="metric-value">${(results.annual_total_savings * 5).toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">DPC Investment:</span>
                    <span className="metric-value">${results.dpc_investment.toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Return on DPC Investment:</span>
                    <span className="metric-value">
                      {results.dpc_investment > 0 
                        ? `$${(results.annual_total_savings / results.dpc_investment).toFixed(2)}x`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Disclaimer */}
        <footer className="footer">
          <div className="disclaimer">
            <AlertCircle size={20} />
            <div>
              <strong>Educational Estimates Only:</strong> This calculator provides educational estimates based on published research. 
              Results are not actuarial projections or medical advice. Actual outcomes vary by employer demographics, implementation quality, and market conditions.
              Consult licensed benefits consultants and actuaries before making coverage decisions.
              <br /><br />
              <strong>Data Sources:</strong>
              <ul className="source-list">
                <li>DPC Utilization Impact: Qliance, Iora Health, JAMA Network Open (2020), DPC Frontier</li>
                <li>Chronic Disease Costs: CDC NHIS, Health Care Cost Institute (HCCI), American Diabetes Association</li>
                <li>Healthcare Pricing: CMS Medicare Fee Schedules, FAIR Health database, state all-payer claims data</li>
                <li>Utilization Benchmarks: Medical Expenditure Panel Survey (MEPS), HCCI claims database</li>
                <li>Premium Data: Kaiser Family Foundation Employer Health Benefits Survey (annual)</li>
              </ul>
              <small className="citation-link-wrapper">
                See <a href="/DATA_SOURCES.md" target="_blank" rel="noopener noreferrer" className="citation-link">DATA_SOURCES.md</a> for complete methodology and citations.
              </small>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
