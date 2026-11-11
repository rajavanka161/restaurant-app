namespace BurgerApi.Domain;

public enum OrderStatus { Received, Preparing, Ready, Completed, Cancelled }

public static class OrderStateMachine
{
    public static OrderStatus? Next(OrderStatus current) => current switch
    {
        OrderStatus.Received => OrderStatus.Preparing,
        OrderStatus.Preparing => OrderStatus.Ready,
        OrderStatus.Ready => OrderStatus.Completed,
        _ => null
    };

    public static bool CanAdvance(OrderStatus from, OrderStatus to) => Next(from) == to;

    public static bool CanCancel(OrderStatus status, bool isStaff) =>
        isStaff
            ? status is OrderStatus.Received or OrderStatus.Preparing
            : status == OrderStatus.Received;
}
