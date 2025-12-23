import React, { useState } from 'react';
import { Calculator, Info, TrendingDown, AlertCircle, DollarSign, Users, Building2, Activity } from 'lucide-react';
import './DPCCalculator.css';

// Constants - Based on HCCI and CDC chronic disease cost data
const NATIONAL_COST = {
  multi: 24500, dm2: 22100, ckd: 18200, cancer: 16800, heartfailure: 14600,
  cad: 12300, stroke: 11400, mentalhealth: 9800, chronicpain: 8900, obesity: 7600,
  copd: 6200, asthma: 4800, arthritis: 4200, htn: 3400, lipids: 2800, thyroid: 2200
};

// DPC Reduction Rates - Based on published DPC outcome studies
const DPC_IMPACT_RATES = {
  er_reduction: 50,
  urgent_reduction: 50,
  hosp_reduction: 20,
  specialist_reduction: 30,
  imaging_reduction: 25,
  medication_reduction: 35
};

const STATE_COSTS = {
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
  multi: { pcp: 6, urgent: 2.0, er: 0.30, hosp: 0.25 },
  dm2: { pcp: 4, urgent: 1.0, er: 0.20, hosp: 0.12 },
  htn: { pcp: 3, urgent: 1.0, er: 0.10, hosp: 0.08 },
  cad: { pcp: 5, urgent: 1.5, er: 0.25, hosp: 0.15 },
  copd: { pcp: 5, urgent: 2.5, er: 0.40, hosp: 0.22 },
  asthma: { pcp: 4, urgent: 2.0, er: 0.15, hosp: 0.08 }
};

export default function DPCCalculator() {
  const [formData, setFormData] = useState({
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
    admin_fees_pmpm: 75,
    stop_loss_premium_pmpm: 150,
    dpc_monthly: 75,
    reduction_percent: DPC_IMPACT_RATES.er_reduction,
    hosp_reduction_percent: DPC_IMPACT_RATES.hosp_reduction
  });

  const [results, setResults] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

      const dpcMembership = clamp(formData.dpc_monthly, 0, 500) * 12;

      const dpcUrgentClaims = urgentClaims * (1 - erUrgentRed);
      const dpcErClaims = erClaims * (1 - erUrgentRed);
      const dpcHospClaims = hospClaims * (1 - hospRed);

      let traditionalTotal = 0;
      let dpcTotal = 0;
      let traditionalBreakdown = {};
      let dpcBreakdown = {};

      if (insuranceType === 'fully_insured') {
        const annualPremium = clamp(formData.annual_premium, 0, 50000);
        const reducedPremium = annualPremium * (1 - premiumRed);
        const dpcMembershipCost = clamp(formData.dpc_monthly, 0, 500) * 12;

        traditionalTotal = annualPremium;
        dpcTotal = reducedPremium + dpcMembershipCost;

        const utilizationEstimate = pcpClaims + urgentClaims + erClaims + hospClaims;
        const utilizationSavingsEstimate =
          (urgentClaims + erClaims) * erUrgentRed + hospClaims * hospRed;

        traditionalBreakdown = {
          premium: money(annualPremium),
          utilization_estimate: money(utilizationEstimate)
        };

        dpcBreakdown = {
          premium: money(reducedPremium),
          membership: money(dpcMembershipCost),
          utilization_estimate: money(utilizationEstimate - utilizationSavingsEstimate)
        };
      } else if (insuranceType === 'self_funded') {
        const admin = clamp(formData.admin_fees_pmpm, 0, 2000) * 12;
        const stopLoss = clamp(formData.stop_loss_premium_pmpm, 0, 2000) * 12;

        traditionalTotal = pcpClaims + urgentClaims + erClaims + hospClaims + admin + stopLoss;
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
        const dpcMedical = (dpcUrgentClaims + dpcErClaims + dpcHospClaims) * wholesale;

        traditionalTotal = traditionalMedical;
        dpcTotal = dpcMembership + dpcMedical;

        traditionalBreakdown = { medical: money(traditionalMedical) };
        dpcBreakdown = { membership: money(dpcMembership), medical: money(dpcMedical) };
      }

      const perEmployeeSavings = traditionalTotal - dpcTotal;
      const totalSavings = perEmployeeSavings * employees;
      const dpcInvestment = dpcMembership * employees;
      const roiOnInvestmentPct = dpcInvestment > 0 ? (totalSavings / dpcInvestment) * 100 : 0;

      setResults({
        traditional_annual_per_employee: money(traditionalTotal),
        dpc_annual_per_employee: money(dpcTotal),
        annual_savings_per_employee: money(perEmployeeSavings),
        annual_total_savings: money(totalSavings),
        dpc_investment: money(dpcInvestment),
        roi_percentage: money(roiOnInvestmentPct),
        insurance_type: insuranceType,
        traditional_breakdown: traditionalBreakdown,
        dpc_breakdown: dpcBreakdown
      });

      setCalculating(false);
    }, 300);
  };

  return (
    <div className="dpc-calculator">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1>Direct Primary Care (DPC) ROI Calculator</h1>
          <p className="subtitle">
            Calculate Your Company's Healthcare Savings with DPC
          </p>
        </header>

        <div className="content">
          {/* Form Section */}
          <div className="form-section">
            {/* Basic Information */}
            <div className="card">
              <div className="card-header">
                <div className="step-badge">1</div>
                <h2>Basic Information</h2>
              </div>
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
            </div>

            {/* Healthcare Costs */}
            <div className="card">
              <div className="card-header">
                <div className="step-badge">2</div>
                <h2>Healthcare Costs & Utilization</h2>
              </div>
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
                          <span className="info-icon" title="DPC + HDHP typically achieves 20-40% reduction">
                            <Info size={16} />
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={formData.premium_reduction}
                          onChange={(e) => handleInputChange('premium_reduction', parseFloat(e.target.value))}
                        />
                        <small>Typical DPC+HDHP: 20-40% reduction</small>
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
            </div>

            {/* DPC Settings */}
            <div className="card dpc-card">
              <div className="card-header">
                <TrendingDown size={20} />
                <h2>DPC Impact Assumptions</h2>
              </div>
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
                      <span className="info-icon" title="40-60% reduction typical">
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
                  </div>
                  <div className="form-group">
                    <label>
                      Hospital Reduction (%)
                      <span className="info-icon" title="15-30% reduction typical">
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
            </div>
          </div>

          {/* Results Section */}
          {results && (
            <div className="results-section">
              <h2 className="results-title">Your DPC ROI Analysis</h2>
              
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
                            <div>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
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

              {/* Benefits Grid */}
              <div className="benefits-section">
                <h3>Additional DPC Benefits</h3>
                <div className="benefits-grid">
                  <div className="benefit-card">
                    <div className="benefit-icon">📞</div>
                    <h4>Direct Access</h4>
                    <p>Same-day or next-day appointments, direct phone/email access</p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">⏱️</div>
                    <h4>Longer Visits</h4>
                    <p>30-60 minute appointments vs. 7-minute traditional visits</p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">💊</div>
                    <h4>Lower Rx Costs</h4>
                    <p>Wholesale medication pricing, often 80-90% cheaper</p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">📉</div>
                    <h4>Reduced ER Visits</h4>
                    <p>Better access reduces unnecessary ER visits by 50%+</p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">😊</div>
                    <h4>Employee Satisfaction</h4>
                    <p>97% patient satisfaction rate in DPC practices</p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">🎯</div>
                    <h4>Preventive Care</h4>
                    <p>Focus on prevention reduces chronic disease costs</p>
                  </div>
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
                    <span className="metric-value">${(results.annual_total_savings / results.dpc_investment).toFixed(2)}x</span>
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
              <strong>Disclaimer:</strong> Educational estimates only - not actuarial guarantees or medical advice.
              Consult professionals before making coverage decisions.
              <br />
              <small>Sources: Society of Actuaries, DPC Alliance, Kaiser Family Foundation Health Benefits Survey</small>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
