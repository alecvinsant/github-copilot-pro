# GitHub Copilot ROI Calculator

A web-based calculator to help employers determine the return on investment (ROI) for utilizing GitHub Copilot for their development teams.

## Features

- **Interactive ROI Calculation**: Calculate the financial benefits of GitHub Copilot for your organization
- **Customizable Parameters**: Adjust inputs based on your specific situation:
  - Number of developers
  - Average developer salary
  - Expected productivity gain
  - Copilot subscription cost
  - Working hours per year
- **Comprehensive Metrics**:
  - Total annual costs
  - Time saved in hours
  - Value of time saved
  - Net annual benefit
  - ROI percentage
  - Payback period
  - Per-developer metrics

## Usage

Simply open `index.html` in a web browser to use the calculator.

### Online Access

You can also host this on any static web server or GitHub Pages to make it accessible online.

### Default Values

The calculator comes pre-populated with industry-standard values:
- 10 developers
- $120,000 average annual salary
- 25% productivity gain (based on research showing 20-30% improvement)
- $19/month per user (GitHub Copilot Business pricing)
- 2,080 working hours per year (standard full-time hours)

## How It Works

The calculator determines ROI by:

1. **Calculating Annual Costs**: Number of developers × Monthly cost × 12 months
2. **Estimating Time Saved**: Working hours × Productivity gain percentage
3. **Valuing Time Saved**: Time saved × Hourly rate (salary / working hours)
4. **Computing Net Benefit**: Value of time saved - Annual Copilot cost
5. **Determining ROI**: (Net Benefit / Annual Cost) × 100

## Typical Results

With default values, most organizations see:
- **ROI**: 1000%+ (10x return or higher)
- **Payback Period**: Less than 1 month
- **Net Annual Benefit**: $100,000+ for a team of 10 developers

## Files

- `index.html` - Main calculator interface
- `styles.css` - Styling and layout
- `calculator.js` - ROI calculation logic

## License

MIT License