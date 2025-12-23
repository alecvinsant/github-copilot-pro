# DPC ROI Calculator

A comprehensive calculator for employers to analyze the Return on Investment (ROI) when implementing Direct Primary Care (DPC) for their employees.

## Features

- **Multiple Insurance Models**: Supports fully insured, self-funded, and no insurance scenarios
- **State-Specific Costs**: Healthcare cost data for all 50 states
- **Chronic Condition Profiles**: Pre-configured profiles for common chronic conditions with national cost averages
- **Evidence-Based Reductions**: DPC impact rates based on published outcome studies (40-60% ER reduction, 15-30% hospitalization reduction)
- **Comprehensive Cost Analysis**: Detailed breakdown showing traditional healthcare costs vs. DPC model
- **Visual Proof**: Clear display of savings with cost comparisons and ROI calculations
- **Additional Benefits**: Highlights non-financial benefits like employee satisfaction and preventive care

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

Open [http://localhost:5173](http://localhost:5173) to view the calculator in your browser.

### Build

```bash
npm run build
```

## How It Works

The calculator uses evidence-based data from:
- Health Care Cost Institute (HCCI)
- CDC chronic disease cost data
- DPC Coalition outcome studies
- Kaiser Family Foundation Health Benefits Survey

### Calculation Methodology

1. **Input Collection**: Gathers employer data including number of employees, current healthcare costs, utilization patterns
2. **Baseline Calculation**: Computes traditional healthcare costs based on insurance type
3. **DPC Model Application**: Applies evidence-based reduction rates for ER visits, urgent care, hospitalizations
4. **ROI Computation**: Calculates total savings, per-employee savings, and return on DPC investment

### Insurance Types

- **Fully Insured**: Premium-based model with typical 20-40% premium reduction when pairing DPC with HDHP
- **Self-Funded**: Claims-based model showing reduction in actual utilization costs
- **No Insurance**: Total economic burden model comparing retail vs. wholesale pricing

## Cost Savings Examples

Based on typical scenarios:
- **50 employees, Multiple Chronic Conditions**: $150,000+ annual savings
- **100 employees, Diabetes**: $180,000+ annual savings
- **200 employees, Mixed Population**: $400,000+ annual savings

## Data Sources

- DPC Reduction Rates: 40-60% ER reduction (Qliance, Iora Health studies)
- Hospital Reduction: 15-30% (JAMA Primary Care studies)
- National Cost Data: CDC, HCCI
- State Cost Data: Medicare reimbursement rates, state health department data

## Technologies Used

- React 19
- Vite
- Lucide React (icons)
- Modern CSS with gradients and animations

## License

ISC