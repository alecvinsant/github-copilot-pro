// ROI Calculator for GitHub Copilot
document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculateBtn');
    
    // Add event listeners for real-time calculation
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', calculateROI);
    });
    
    calculateBtn.addEventListener('click', calculateROI);
    
    // Calculate on page load with default values
    calculateROI();
});

function calculateROI() {
    // Get input values
    const numDevelopers = parseFloat(document.getElementById('numDevelopers').value) || 0;
    const avgSalary = parseFloat(document.getElementById('avgSalary').value) || 0;
    const productivityGain = parseFloat(document.getElementById('productivityGain').value) || 0;
    const copilotCost = parseFloat(document.getElementById('copilotCost').value) || 0;
    const workingHours = parseFloat(document.getElementById('workingHours').value) || 0;
    
    // Validate inputs
    if (numDevelopers <= 0 || avgSalary <= 0 || workingHours <= 0) {
        return;
    }
    
    // Calculate costs
    const annualCopilotCost = numDevelopers * copilotCost * 12;
    
    // Calculate benefits
    const hourlyRate = avgSalary / workingHours;
    const timeSavedPerDev = workingHours * (productivityGain / 100);
    const totalTimeSaved = timeSavedPerDev * numDevelopers;
    const valueOfTimeSaved = totalTimeSaved * hourlyRate;
    
    // Calculate ROI metrics
    const netBenefit = valueOfTimeSaved - annualCopilotCost;
    const roiPercentage = annualCopilotCost > 0 ? (netBenefit / annualCopilotCost) * 100 : 0;
    const paybackPeriodMonths = annualCopilotCost > 0 ? (annualCopilotCost / (valueOfTimeSaved / 12)) : 0;
    
    // Per developer metrics
    const costPerDev = copilotCost * 12;
    const valuePerDev = timeSavedPerDev * hourlyRate;
    const netPerDev = valuePerDev - costPerDev;
    
    // Update UI
    updateResult('totalCost', formatCurrency(annualCopilotCost));
    updateResult('timeSaved', formatNumber(totalTimeSaved));
    updateResult('valueSaved', formatCurrency(valueOfTimeSaved));
    updateResult('netBenefit', formatCurrency(netBenefit));
    updateResult('roiPercentage', formatPercentage(roiPercentage));
    updateResult('paybackPeriod', formatPaybackPeriod(paybackPeriodMonths));
    updateResult('costPerDev', formatCurrency(costPerDev));
    updateResult('valuePerDev', formatCurrency(valuePerDev));
    updateResult('netPerDev', formatCurrency(netPerDev));
    
    // Update ROI color based on value
    const roiElement = document.getElementById('roiPercentage');
    if (roiPercentage > 0) {
        roiElement.style.color = '#059669'; // Green for positive ROI
    } else if (roiPercentage < 0) {
        roiElement.style.color = '#dc2626'; // Red for negative ROI
    } else {
        roiElement.style.color = '#6b7280'; // Gray for zero ROI
    }
    
    // Update net benefit color
    const netBenefitElement = document.getElementById('netBenefit');
    if (netBenefit > 0) {
        netBenefitElement.style.color = '#059669';
    } else if (netBenefit < 0) {
        netBenefitElement.style.color = '#dc2626';
    } else {
        netBenefitElement.style.color = '#6b7280';
    }
}

function updateResult(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value) + '%';
}

function formatPaybackPeriod(months) {
    if (months <= 0 || !isFinite(months)) {
        return 'N/A';
    }
    
    if (months < 1) {
        const days = Math.round(months * 30);
        return days + ' days';
    }
    
    if (months < 12) {
        return Math.round(months * 10) / 10 + ' months';
    }
    
    const years = months / 12;
    return Math.round(years * 10) / 10 + ' years';
}
