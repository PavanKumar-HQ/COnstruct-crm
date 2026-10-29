import Decimal from "decimal.js";

// Standard configuration for operational currency and quantities
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class CurrencyMath {
  /**
   * Adds multiple amounts with decimal precision
   */
  static add(...amounts: (number | string | Decimal)[]): Decimal {
    return amounts.reduce<Decimal>((sum, val) => sum.plus(new Decimal(val || 0)), new Decimal(0));
  }

  /**
   * Multiplies quantity and rate with decimal precision
   */
  static multiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return new Decimal(a || 0).times(new Decimal(b || 0));
  }

  /**
   * Subtracts subtrahends from minuend
   */
  static subtract(minuend: number | string | Decimal, ...subtrahends: (number | string | Decimal)[]): Decimal {
    return subtrahends.reduce<Decimal>(
      (diff, val) => diff.minus(new Decimal(val || 0)),
      new Decimal(minuend || 0)
    );
  }

  /**
   * Rounds a decimal to 2 decimal places (standard financial cents/paise)
   */
  static toFixed2(val: number | string | Decimal): string {
    return new Decimal(val || 0).toFixed(2);
  }

  /**
   * Calculates Revised Contract Value:
   * Revised Contract Value = Original Approved Contract Value + Approved Change Orders
   */
  static calculateRevisedContractValue(
    originalContractValue: number | string | Decimal,
    approvedChangeOrdersTotal: number | string | Decimal
  ): Decimal {
    return this.add(originalContractValue, approvedChangeOrdersTotal);
  }

  /**
   * Calculates Remaining Budget:
   * Remaining Budget = Revised Approved Budget - Actual Recorded Cost (with Open Commitments tracked separately)
   */
  static calculateRemainingBudget(
    revisedBudget: number | string | Decimal,
    actualCost: number | string | Decimal
  ): Decimal {
    return this.subtract(revisedBudget, actualCost);
  }

  /**
   * Calculates Outstanding Customer Balance:
   * Customer Outstanding = Posted Invoice Balances - Allocated Customer Payments & Credits
   */
  static calculateCustomerOutstanding(
    postedInvoicesTotal: number | string | Decimal,
    allocatedPaymentsTotal: number | string | Decimal,
    creditsTotal: number | string | Decimal = 0
  ): Decimal {
    return this.subtract(postedInvoicesTotal, allocatedPaymentsTotal, creditsTotal);
  }
}
