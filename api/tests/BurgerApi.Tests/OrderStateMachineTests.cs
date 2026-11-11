using BurgerApi.Domain;

namespace BurgerApi.Tests;

public class OrderStateMachineTests
{
    [Theory]
    [InlineData(OrderStatus.Received, OrderStatus.Preparing)]
    [InlineData(OrderStatus.Preparing, OrderStatus.Ready)]
    [InlineData(OrderStatus.Ready, OrderStatus.Completed)]
    public void Advances_one_step_at_a_time(OrderStatus from, OrderStatus to)
    {
        Assert.True(OrderStateMachine.CanAdvance(from, to));
        Assert.Equal(to, OrderStateMachine.Next(from));
    }

    [Theory]
    [InlineData(OrderStatus.Received, OrderStatus.Ready)]
    [InlineData(OrderStatus.Received, OrderStatus.Completed)]
    [InlineData(OrderStatus.Preparing, OrderStatus.Received)]
    [InlineData(OrderStatus.Completed, OrderStatus.Preparing)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.Preparing)]
    public void Rejects_skips_and_backwards_moves(OrderStatus from, OrderStatus to) =>
        Assert.False(OrderStateMachine.CanAdvance(from, to));

    [Theory]
    [InlineData(OrderStatus.Completed)]
    [InlineData(OrderStatus.Cancelled)]
    public void Terminal_states_have_no_next(OrderStatus s) => Assert.Null(OrderStateMachine.Next(s));

    [Theory]
    [InlineData(OrderStatus.Received, false, true)]
    [InlineData(OrderStatus.Preparing, false, false)]
    [InlineData(OrderStatus.Preparing, true, true)]
    [InlineData(OrderStatus.Ready, true, false)]
    [InlineData(OrderStatus.Completed, true, false)]
    [InlineData(OrderStatus.Cancelled, true, false)]
    public void Cancel_rules(OrderStatus s, bool staff, bool expected) =>
        Assert.Equal(expected, OrderStateMachine.CanCancel(s, staff));
}
