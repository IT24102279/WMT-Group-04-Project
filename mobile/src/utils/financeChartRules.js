export const financeChartColors = {
  income: '#1C7C54',
  expense: '#B33A3A',
  pending: '#D99A2B',
  completed: '#2F6FED',
  overdue: '#8E2F8F'
};

export const formatCurrency = (amount, currency = 'LKR', locale = 'en-LK') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount || 0));
};

export const sortLegendLabels = (labels, mode = 'alphabetical') => {
  const clone = [...labels];

  if (mode === 'logical') {
    const order = ['pending', 'completed', 'overdue', 'income', 'expense'];
    return clone.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }

  return clone.sort((a, b) => a.localeCompare(b));
};

export const sanitizeChartLabels = (labels, maxLength = 10) =>
  labels.map((label) => {
    if (label.length <= maxLength) {
      return label;
    }
    return `${label.slice(0, maxLength - 1)}...`;
  });
