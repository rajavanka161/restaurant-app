namespace BurgerApi.Services.Events;

public record OrderPlaced(int OrderId, int UserId, decimal Total);

public interface IEventHandler<in TEvent>
{
    Task HandleAsync(TEvent @event);
}

public interface IEventBus
{
    Task PublishAsync<TEvent>(TEvent @event);
}

public class EventBus(IServiceProvider services, ILogger<EventBus> logger) : IEventBus
{
    public async Task PublishAsync<TEvent>(TEvent @event)
    {
        foreach (var handler in services.GetServices<IEventHandler<TEvent>>())
        {
            try { await handler.HandleAsync(@event); }
            catch (Exception ex) { logger.LogError(ex, "{Handler} failed for {Event}", handler.GetType().Name, typeof(TEvent).Name); }
        }
    }
}
