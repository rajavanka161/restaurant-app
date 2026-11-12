namespace BurgerApi.Services;

public class PriceRounder
{
    public decimal ToNearestFiveCents(decimal price) => Math.Round(price * 20m, MidpointRounding.AwayFromZero) / 20m;
}
