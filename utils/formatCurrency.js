export const formatCurrency = (amount, currency = 'INR') => {
    try {
      // Use 'en-IN' locale for Indian currency formatting.
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      console.warn(`Invalid currency code: ${currency}. Defaulting to INR.`);
      // Fallback to INR if the currency code is invalid.
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    }
  };
  