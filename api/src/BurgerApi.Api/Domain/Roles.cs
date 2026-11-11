namespace BurgerApi.Domain;

public static class Roles
{
    public const string Customer = "Customer";
    public const string Kitchen = "Kitchen";
    public const string Manager = "Manager";
    public const string Staff = Kitchen + "," + Manager;
}
