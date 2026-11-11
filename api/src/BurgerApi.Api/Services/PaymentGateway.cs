using BurgerApi.Domain;

namespace BurgerApi.Services;

public interface IPaymentGateway
{
    Task<string> ChargeAsync(decimal amount, string cardNumber, string cardholder);
    Task RefundAsync(string paymentReference, decimal amount);
}

public class FakePaymentGateway : IPaymentGateway
{
    public Task<string> ChargeAsync(decimal amount, string cardNumber, string cardholder)
    {
        var digits = new string(cardNumber.Where(char.IsDigit).ToArray());
        if (digits.Length is < 12 or > 19) throw new DomainException("Invalid card number.");
        if (digits.EndsWith("0000")) throw new DomainException("Card was declined.", 402);
        return Task.FromResult($"PAY-{Guid.NewGuid():N}"[..20]);
    }

    public Task RefundAsync(string paymentReference, decimal amount) => Task.CompletedTask;
}
