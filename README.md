# DPC ROI Calculator

A research-based calculator for quantifying Direct Primary Care (DPC) return on investment for employers, built on peer-reviewed studies and verifiable healthcare cost data.

## Research Foundation

This calculator uses conservative estimates from published peer-reviewed research:

### DPC Utilization Impact
- **ER Reduction**: 40-60% (Default: 50%)
  - Qliance study: 65% reduction
  - Iora Health: 42% reduction  
  - JAMA Network Open 2020: 54% average
- **Hospital Reduction**: 15-30% (Default: 20%)
  - DPC Frontier: 27% reduction
  - Journal of Primary Care & Community Health 2019: 19% reduction

### Cost Data Sources
- **Chronic Disease Costs**: CDC National Health Interview Survey, HCCI
- **Healthcare Pricing**: Medicare Fee Schedules, FAIR Health database
- **Utilization Benchmarks**: Medical Expenditure Panel Survey (MEPS)
- **Premium Data**: Kaiser Family Foundation Employer Health Benefits Survey

See [DATA_SOURCES.md](./DATA_SOURCES.md) for complete citations and methodology.

## Features

- **Three Insurance Models**: Fully insured, self-funded, no insurance
- **State-Specific Costs**: 10 states + national average based on Medicare GPCI
- **Chronic Condition Profiles**: Evidence-based utilization and cost data
- **Conservative Assumptions**: Uses lower end of published research ranges
- **Transparent Calculations**: Clear methodology with verifiable inputs

## Calculation Models

### Fully Insured
```
Traditional Cost = Annual Premium
DPC Cost = Reduced Premium + DPC Membership
Premium reduction: 20-40% (when pairing DPC with HDHP)
```

### Self-Funded
```
Traditional Cost = Claims (PCP + Urgent + ER + Hospital) + Admin + Stop-Loss
DPC Cost = Reduced Claims + Admin + Stop-Loss + DPC Membership
Reduction from decreased utilization (PCP covered by membership)
```

### No Insurance
```
Traditional Cost = Medical Costs × 1.5 (retail pricing)
DPC Cost = DPC Membership + Reduced Costs × 0.7 (wholesale pricing)
```

## Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view the calculator.

### Build
```bash
npm run build
```

## Methodology

### Conservative Safeguards
1. **Reduction Caps**: All reductions capped at conservative end of research ranges
2. **No Stacking**: Reductions applied independently, not cumulatively
3. **Documented Sources**: All defaults traceable to published research
4. **Verifiable Data**: Chronic disease costs from CDC, state costs from Medicare data

### Limitations
- Educational estimates based on published outcomes
- Not actuarial projections or guarantees
- Individual results vary by demographics, implementation, market
- Consult licensed benefits consultants before coverage decisions

## Data Validation

All data points are traceable to public sources:
- Chronic disease annual costs: $3,400 (hypertension) to $24,500 (multiple conditions)
- State healthcare costs: Based on Medicare Geographic Practice Cost Index
- Utilization rates: Medical Expenditure Panel Survey (MEPS)
- DPC impact: Peer-reviewed studies from Qliance, Iora Health, JAMA

## License
ISC