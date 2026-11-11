namespace BurgerApi.Services;

public interface IDiscountPolicy
{
    decimal LoyaltyDiscount(decimal subtotal);
}

public class NoDiscountPolicy : IDiscountPolicy
{
    public decimal LoyaltyDiscount(decimal subtotal) => 0m;
}

public class WeekendDiscountPolicy : IDiscountPolicy
{
    public decimal LoyaltyDiscount(decimal subtotal) =>
        DateTime.UtcNow.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday ? Math.Round(subtotal * 0.05m, 2) : 0m;
}
