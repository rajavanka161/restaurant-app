using System.Net;
using System.Text;
using BurgerApi.Contracts;

namespace BurgerApi.Services;

public interface IReceiptRenderer
{
    string ContentType { get; }
    string Render(OrderDetail order);
}

public class PlainTextReceiptRenderer : IReceiptRenderer
{
    public string ContentType => "text/plain";

    public string Render(OrderDetail d)
    {
        var sb = new StringBuilder().AppendLine($"Order #{d.Order.Id}");
        foreach (var l in d.Items) sb.AppendLine($"{l.Quantity} x {l.Name}  {l.LineTotal:0.00}");
        return sb.AppendLine($"Total {d.Order.Total:0.00}").ToString();
    }
}

public class HtmlReceiptRenderer : IReceiptRenderer
{
    public string ContentType => "text/html";

    public string Render(OrderDetail d)
    {
        var sb = new StringBuilder().Append($"<h1>Order #{d.Order.Id}</h1><ul>");
        foreach (var l in d.Items) sb.Append($"<li>{l.Quantity} x {WebUtility.HtmlEncode(l.Name)} {l.LineTotal:0.00}</li>");
        return sb.Append($"</ul><p>Total {d.Order.Total:0.00}</p>").ToString();
    }
}
