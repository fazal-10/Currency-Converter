export function convertAmount(params: {
  inputAmount: number;
  convertedAmount: number;
}): { convertedAmount: number; unitRate: number } {
  const { inputAmount, convertedAmount } = params;

  if (!Number.isFinite(inputAmount) || inputAmount <= 0) {
    return { convertedAmount, unitRate: 0 };
  }

  return {
    convertedAmount,
    unitRate: convertedAmount / inputAmount,
  };
}

