using BurgerApi.Domain;
using BurgerApi.Services;

namespace BurgerApi.Tests;

public class PasswordHasherTests
{
    [Fact]
    public void Verifies_correct_password_only()
    {
        var hash = PasswordHasher.Hash("Password1!");
        Assert.True(PasswordHasher.Verify("Password1!", hash));
        Assert.False(PasswordHasher.Verify("password1!", hash));
    }

    [Fact]
    public void Same_password_hashes_differently() =>
        Assert.NotEqual(PasswordHasher.Hash("x1x1x1"), PasswordHasher.Hash("x1x1x1"));

    [Fact]
    public void Malformed_hash_does_not_verify() => Assert.False(PasswordHasher.Verify("a", "garbage"));
}

public class FakePaymentGatewayTests
{
    private readonly FakePaymentGateway _gw = new();

    [Fact]
    public async Task Valid_card_returns_reference() =>
        Assert.StartsWith("PAY-", await _gw.ChargeAsync(10, "4242 4242 4242 4242", "A"));

    [Fact]
    public async Task Card_ending_0000_is_declined()
    {
        var ex = await Assert.ThrowsAsync<DomainException>(() => _gw.ChargeAsync(10, "4000000000000000", "A"));
        Assert.Equal(402, ex.StatusCode);
    }

    [Fact]
    public async Task Malformed_card_is_rejected() =>
        await Assert.ThrowsAsync<DomainException>(() => _gw.ChargeAsync(10, "1234", "A"));
}
