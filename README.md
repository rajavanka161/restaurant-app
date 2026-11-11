# Smashline: online ordering for a burger chain

Angular 22 frontend, ASP.NET Core (.NET 10) API, SQL Server. Dapper handles orders and reports through stored procedures. EF Core handles menu, ingredients, promos and users.

## Run it

```bash
docker compose up -d                                   # SQL Server on :1433
export DOTNET_ROOT=/opt/homebrew/opt/dotnet/libexec    # if dotnet is not on your PATH
dotnet run --project api/src/BurgerApi.Api             # API on http://localhost:5151, creates and seeds BurgerDb on first start
cd web && npm install && npx ng serve                  # app on http://localhost:4200
```

Demo accounts (password `Password1!`): `customer@burger.test`, `kitchen@burger.test`, `manager@burger.test`.
Promo codes: `WELCOME10` (10%), `BIGSAVER5` ($5 off $25+), `FEAST20` (20% off $40+, max $15).
Test cards: any 16 digits works. A number ending in `0000` is declined.

## Tests

```bash
dotnet test api          # xUnit: state machine, order orchestration, payments, password hashing
cd web && npx ng test --watch=false   # Vitest: cart, auth, guards, menu and kitchen pages
```

## Layout

- `db/`: ordered SQL scripts (tables, functions, views, stored procedures, seed). The API runs them on startup.
- `api/src/BurgerApi.Api`: controllers, `OrderService` (charge, place, refund on failure), `OrderRepository` (Dapper), `AppDbContext` (EF Core).
- `web/src/app`: `core/` (API client, auth, cart), `pages/` (customer, kitchen, manager), `shared/`.

## Rules the database enforces

- Pricing (promo, tax 8%, delivery $3.99 under $30) lives in SQL functions, so quotes and orders always agree.
- Placing an order checks and decrements ingredient stock atomically. Cancelling restores it.
- Status moves only Received, Preparing, Ready, Completed. Customers can cancel only while Received, and staff while Preparing too. A cancel refunds the payment.

## Known limits

- Payments use a fake gateway (`FakePaymentGateway`). Swap in a real one behind `IPaymentGateway`.
- The JWT key in `appsettings.json` and the SQL password in `docker-compose.yml` are dev-only values.
- Orders are not covered by automated SQL integration tests. The flow was checked by hand against a live SQL Server.
- Report days are UTC.
