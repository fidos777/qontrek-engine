def calculate_roi(bill_amount: float, solar_cost: float = 20000, savings_rate: float = 0.7):
    """
    Estimate ROI based on user's monthly bill.
    Default solar cost = RM20,000, estimated savings = 70% of bill.
    """
    monthly_savings = bill_amount * savings_rate
    payback_period_months = solar_cost / monthly_savings
    return {
        "monthly_savings": monthly_savings,
        "payback_period_months": round(payback_period_months, 1),
        "solar_cost": solar_cost
    }

if __name__ == "__main__":
    bill = float(input("Masukkan anggaran bil elektrik bulanan (RM): "))
    result = calculate_roi(bill)
    print("\n📊 ROI Summary:")
    print(f"• Penjimatan bulanan: RM{result['monthly_savings']:.2f}")
    print(f"• Kos solar: RM{result['solar_cost']}")
    print(f"• Tempoh pulangan modal: {result['payback_period_months']} bulan")

