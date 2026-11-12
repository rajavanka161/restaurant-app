# Planted cases

Twelve small additions on branch `test/planted-cases`, one commit each (`Planted case N: ...`), so each can be reverted alone. Line numbers are for the tip of this branch. Each change lives in its own new file where possible (cases 2, 5, 8, 10 and 12 also edit existing files).

"Expected scanner result" is a recommendation, not the output of any tool: *normal link* means a resolved edge, *unresolved* means a recorded edge whose target cannot be determined, *nothing* means no edge should be emitted.

Cases 6, 7, 8 and 12 add C# or SQL objects with **no caller**. They were kept uncalled so no case depends on another and every commit reverts cleanly. For those, the "affected" answer is the object itself, with no endpoint or screen.

## 1. Dynamic SQL

- Added: `db/005_archive_orders.sql`. Table `dbo.OrdersArchive` (lines 1-9). Procedure `dbo.usp_ArchiveOldOrders` (lines 11-27). It builds `@target` from the `@ArchiveTable` parameter (line 18), assembles `@sql` (lines 19-24) and runs `EXEC sp_executesql @sql, ...` (line 25).
- Expected scanner result:
  - Normal link: `usp_ArchiveOldOrders` reads `dbo.Orders`. The table name is a literal inside the string on line 22. Report it at low confidence, or flag it as "inside dynamic SQL".
  - Unresolved: the write target `dbo.<@ArchiveTable>` (lines 20 and 24). The name is a parameter, so do not guess `OrdersArchive`.
  - Normal link: the table `dbo.OrdersArchive` is created in the same file. Nothing ties the procedure to it except the parameter default `N'OrdersArchive'` (line 13).
- "What could be affected": changing `dbo.Orders` columns `Id, UserId, Status, Total, CreatedAt` can break this procedure. It reaches no endpoint or screen, because nothing calls it.

## 2. Runtime-chosen implementation

- Added:
  - `api/src/BurgerApi.Api/Services/DiscountPolicy.cs`: `IDiscountPolicy` (line 3), `NoDiscountPolicy` (line 8), `WeekendDiscountPolicy` (line 13).
  - `Program.cs` lines 15-16 pick one from `Pricing:DiscountPolicy`.
  - `appsettings.json` line 8 sets `"None"`.
  - `OrderService.cs`: constructor parameter on line 6, use on line 31 (`discounts?.LoyaltyDiscount(...)`), and `charge` is passed to `ChargeAsync` on line 32 and `RefundAsync` on line 39.
- Expected scanner result:
  - Normal link: `OrderService` depends on `IDiscountPolicy` (constructor, high confidence).
  - Normal link: each implementation implements the interface (high).
  - Registration in `Program.cs` is a conditional factory, so the interface→implementation edge is ambiguous. Report both `NoDiscountPolicy` and `WeekendDiscountPolicy` at reduced confidence, or one "runtime-selected" edge. Do not report only one.
- "What could be affected": changing `IDiscountPolicy.LoyaltyDiscount` or either implementation affects `OrderService.PlaceOrderAsync`. That means `POST api/orders` (`OrdersController.Place`) and the Checkout screen (`/checkout`, `checkout.page.ts:122`).
- Caveat: the default is `None`, so charges are unchanged. With `Weekend`, the charged amount no longer matches the database total.

## 3. Built-up URL

- Added: `web/src/app/core/menu-section.service.ts`. `const url = [API_URL, 'menu', name].join('/')` is on line 11, and the request is on line 12.
- Expected scanner result: unresolved HTTP call (GET). The URL depends on the runtime argument `name`. The static prefix `<API_URL>/menu/` is known. It may be reported as a low-confidence candidate set (`GET /api/menu/*`). It must not be a confident link to `GET /api/menu/all`.
- "What could be affected": no screen. `MenuSectionService.section` has no callers. The server routes that might satisfy it (`GET api/menu/all`, `GET api/menu/categories`) are reached only through a prefix match.

## 4. Missing endpoint

- Added: `web/src/app/core/loyalty.service.ts` line 9, `GET ${API_URL}/loyalty/points`. No controller route matches `api/loyalty/points`.
- Expected scanner result: unresolved link. The URL is fully static and normalizes to `GET /api/loyalty/points`, with no matching endpoint. Report it as "endpoint not found", not as a link to some nearby controller.
- "What could be affected": no endpoint. No screen calls `LoyaltyService.points` either. Changing the service affects nothing else.

## 5. Dead endpoint

- Added: `OrdersController.cs` lines 53-54, `GET api/kitchen/open-count`, staff only. It reuses `repo.ListActiveAsync()`.
- Expected scanner result:
  - Normal link: the endpoint to `IOrderRepository.ListActiveAsync` (high).
  - Nothing from the web side. No Angular call produces `/kitchen/open-count`, so the endpoint should show as having no callers.
- "What could be affected": changing `ListActiveAsync` or `vw_OrderSummary` affects this endpoint, in addition to `GET api/kitchen/orders` and the Kitchen screen. No screen is affected through this endpoint itself.

## 6. Interpolated SQL

- Added: `api/src/BurgerApi.Api/Services/OrderQueries.cs`. `column` is chosen from a whitelist on line 13. The interpolated query is on line 16: `$"SELECT TOP (@count) * FROM dbo.vw_OrderSummary ORDER BY {column} DESC"`.
- Expected scanner result:
  - Normal link: `OrderQueries.ListSortedAsync` reads `dbo.vw_OrderSummary` at medium confidence. The object name is static text outside the interpolated hole.
  - The `ORDER BY {column}` hole does not change the table dependency. The scanner may flag the call as "interpolated SQL". Column-level links through `{column}` are unresolved.
- "What could be affected": changes to `vw_OrderSummary` (including `Total` and `CreatedAt`) affect this method. It has no callers, so no endpoint or screen.

## 7. Stored procedure path

- Added:
  - `db/006_customer_spend.sql`. `dbo.usp_OrderCountForUser` (lines 1-8). `dbo.usp_CustomerSpend` (lines 10-19). It calls the other procedure on line 16, `EXEC dbo.usp_OrderCountForUser`, and the function on line 18, `dbo.fn_TaxAmount`.
  - `api/src/BurgerApi.Api/Services/SpendRepository.cs`. `CustomerSpendAsync` calls `"dbo.usp_CustomerSpend"` with `CommandType.StoredProcedure` on lines 16-17.
- Expected scanner result:
  - Normal link: `SpendRepository.CustomerSpendAsync` to `dbo.usp_CustomerSpend` (high, procedure name is a literal).
  - Normal link: `usp_CustomerSpend` to `usp_OrderCountForUser` (high).
  - Normal link: `usp_CustomerSpend` to `fn_TaxAmount` (high).
  - Normal link: `usp_CustomerSpend` and `usp_OrderCountForUser` read `dbo.Orders`.
- "What could be affected": changing `fn_TaxAmount` affects `usp_CustomerSpend` and `SpendRepository.CustomerSpendAsync`, in addition to the existing quote and order procedures (`usp_QuoteCart`, `usp_PlaceOrder`). The new chain reaches no endpoint or screen. The existing chain reaches Checkout and the cart quote.

## 8. EF raw SQL

- Added:
  - `db/007_top_customers.sql`, `dbo.usp_TopCustomers` (lines 1-11).
  - `Services/CustomerInsights.cs`: `[Keyless] TopCustomer` (line 7) and `FromSqlRaw("EXEC dbo.usp_TopCustomers @Count", ...)` (lines 18-19).
  - `Data/AppDbContext.cs` line 12, the `TopCustomers` DbSet.
- Expected scanner result:
  - Normal link: `CustomerInsights.TopCustomersAsync` to `dbo.usp_TopCustomers` (high-to-medium, name is a literal in the raw SQL string).
  - `usp_TopCustomers` reads `dbo.Users` and `dbo.Orders`.
  - The `TopCustomers` DbSet maps to a table that does not exist. It is never queried directly. A scanner should not report a link to a table `TopCustomers`, or should mark it unresolved. It is a result shape only.
- "What could be affected": changes to `dbo.Users` or `dbo.Orders` affect it. `CustomerInsights` has no callers and is not registered in DI, so no endpoint or screen.

## 9. SELECT * view

- Added: `db/008_all_promos_view.sql` line 3, `SELECT * FROM dbo.Promos` inside `dbo.vw_AllPromos`.
- Expected scanner result: normal link from the view to `dbo.Promos` (high). Column-level lineage is "all columns", not an enumerated list. The scanner should say the column list is expanded from `*`, not emit zero columns.
- "What could be affected": adding, renaming or dropping any `Promos` column changes this view's shape. The view has no readers, so no endpoint or screen. The EF `Promo` entity (`Data/Entities.cs`) maps the same table independently.

## 10. Shared component

- Added:
  - `web/src/app/shared/money.ts`, selector `app-money` (line 5), class `Money` (line 9).
  - `pages/orders.page.ts`: import on line 7, `imports` on line 12, usage on line 28.
  - `pages/order-detail.page.ts`: import on line 7, `imports` on line 11, usage on line 47.
- Expected scanner result: normal link (high) from `OrdersPage` to `Money` and from `OrderDetailPage` to `Money`. The link comes from the selector in the template matched to the component's `imports` entry. `Money` is not referenced from TypeScript code, only the import and the template tag.
- "What could be affected": changing `Money` affects two screens.
  - My orders, `/orders`, which loads `GET api/orders/mine`.
  - Order status, `/orders/:id`, which loads `GET api/orders/{id}`.
  - It does not affect the admin orders page, which still formats totals itself.

## 11. Wrapped HTTP call

- Added:
  - `web/src/app/core/http-gateway.ts`. `HttpGateway.get` calls ``this.http.get<T>(`${API_URL}${path}`)`` on line 9.
  - `web/src/app/core/menu-count.service.ts`. `MenuCountService.count` calls `this.gateway.get<MenuItem[]>('/menu/all')` on line 10.
- Expected scanner result:
  - Inside the wrapper, the URL is `API_URL + path` with `path` a parameter. That is an unresolved call (like case 3).
  - At the caller, the literal `'/menu/all'` is passed to a method that wraps `HttpClient`. A scanner that follows the wrapper should report a link to `GET /api/menu/all` at reduced confidence. A scanner that does not should report an unresolved call, never a confident direct link.
- "What could be affected": if the link is followed, changing `MenuController`'s `all` action affects `MenuCountService.count`. No screen calls `MenuCountService`, so no screen is affected through it.

## 12. Unqualified vs qualified names

- Added:
  - `db/009_unqualified_names.sql`. `vw_OrderTotalsByStatus` reads unqualified `Orders` (line 4). `usp_OrderItemCount` joins qualified `dbo.OrderItems` with unqualified `Orders` (line 13).
  - `Services/OrderCounts.cs`. Unqualified `FROM Orders` (line 13) and qualified `FROM dbo.Orders` (line 14).
  - The rest of the code base is fully qualified. For example `usp_QuoteCart` and every query in `OrderRepository.cs`.
- Expected scanner result: all of these resolve to the same table, `dbo.Orders` (normal link, high). Unqualified names resolve through the default schema `dbo`. `dbo.OrderItems` on line 13 and `Orders` beside it must be two different tables, not a mismatch.
- "What could be affected": changing `dbo.Orders` affects `vw_OrderTotalsByStatus`, `usp_OrderItemCount` and `OrderCounts.CountAsync`, and the rest of the existing procedures. None of the three new objects has a caller, so they reach no endpoint or screen.

## Checks run on this branch

- `dotnet test api`: 38 passed.
- `ng build`: succeeded. `ng test --watch=false`: 25 passed.
- Every new SQL object was created at API start-up and the procedures and views were executed against the dev database. The seed has no orders, so they returned empty or zero results. The `@@ROWCOUNT` value returned by `usp_ArchiveOldOrders` was not checked with real rows.

# Graph-gap cases (branch `test/graph-gaps`)

Cases 1-21 below add running code for patterns the app did not use before. One commit per case (`Graph gap N: ...`). Line numbers are for the tip of the branch. "Certain" means the link can be read from the source text alone. "Inferred" means it needs DI, configuration, naming or runtime knowledge. A perfect graph marks which is which.

| # | File:line | What a perfect dependency graph shows |
|---|-----------|----------------------------------------|
| 1 | `db/010_order_notes_reviews.sql:8-9, 20-21` | Nodes: tables `OrderNotes`, `MenuItemReviews`. Foreign-key links, each pointing from the child to the parent: `OrderNotes`→`Orders` (`FK_OrderNotes_Orders`, column `OrderId`), `OrderNotes`→`Users` (`AuthorUserId`), `MenuItemReviews`→`MenuItems` (`MenuItemId`), `MenuItemReviews`→`Users` (`UserId`). All four are certain, and each carries the constraint name and the column. Changing `dbo.Users` now affects `OrderNotes` and `MenuItemReviews` as well. |
| 2 | `db/011_promo_audit_trigger.sql:12-22` | Nodes: trigger `trg_Promos_Audit`, table `PromoAudit` (new, line 2). Links: trigger is attached to `Promos` (`ON dbo.Promos`, line 13, certain). Trigger reads `Promos` columns `IsActive` and `UsedCount` through the pseudo-tables `inserted`/`deleted`, and writes `PromoAudit` (line 18, certain). `inserted`/`deleted` must not become nodes. No procedure or C# code names the trigger. It still fires on every `UPDATE dbo.Promos`, so `usp_PlaceOrder` (`UsedCount` update), `/api/promos/{code}/deactivate` once case 9 exists, and `usp_SetPromoLimits` (case 5) all reach `PromoAudit` implicitly. That implied path is inferred from the table, not from any call text. |
| 3 | `db/012_menuitems_sortweight.sql:2, 5` | Column `MenuItems.SortWeight` is added by this script (line 2: `INT NOT NULL`, default constraint `DF_MenuItems_SortWeight`). Check constraint `CK_MenuItems_SortWeight` (line 5) is attached to `MenuItems` and references only `SortWeight`. Links point from the script to `MenuItems` (alters, certain). The column belongs to `MenuItems` even though `001_schema.sql` does not declare it, so the table's final shape is `001` plus `012`. Nothing reads `SortWeight`. The EF `MenuItem` entity does not map it. |
| 4 | `db/013_ingredients_synonym.sql:2, 4-11` | Nodes: synonym `dbo.syn_Ingredients`, procedure `usp_LowStockIngredients`. Link: synonym→`dbo.Ingredients` (line 2, certain, resolved by the `FOR` target). Link: procedure reads `syn_Ingredients` (line 9, certain). The procedure never names `Ingredients`. A perfect graph resolves through the synonym and also shows procedure→`Ingredients` (inferred, one hop through the alias), with columns `Id, Name, StockQty, ReorderLevel`. Changing `Ingredients.StockQty` affects this procedure. No caller exists, so no endpoint or screen is reached. |
| 5 | `db/014_column_level.sql:3-4, 13, 17`; `Services/ExtendedPriceReader.cs:14` | Column-level links, not just table-level. (a) View `vw_MenuItemPrices` reads `MenuItems.Id`, `Name`, `Price` only (line 3-4, certain). It must not claim `Description`, `Calories` or the other columns. (b) Procedure `usp_SetPromoLimits` writes `Promos.UsageLimit` and `Promos.MaxDiscount` only (line 13, certain). The `WHERE Id` column is a read, not a write. (c) `OrderItems.ExtendedPrice` is a computed column (line 17) that depends on `OrderItems.UnitPrice` and `Quantity`. A graph should show column→column dependencies, so changing `UnitPrice` affects `ExtendedPrice`. (d) `ExtendedPriceReader.ForOrderAsync` reads the single column `OrderItems.ExtendedPrice` by name from an inline Dapper string (line 14, certain from the literal, medium confidence because it is SQL inside C#). It also reads `OrderItems.OrderId` and `Id` (filter and order), and through the computed column it depends on `UnitPrice` and `Quantity` (inferred). `ExtendedPriceReader` has no callers and is not registered in DI. |
| 6 | `db/015_cross_database.sql:17` (also 2, 5, 10-11) | Node: procedure `usp_ListRateCard`. Link: reads `OtherDb.dbo.RateCard` (line 17, certain from the three-part name). `OtherDb` is a different database, so the table is an external node in database `OtherDb`, never a node in `BurgerDb` and never merged with a same-named local table. The script also creates that database and table (lines 2 and 5) and seeds one row (line 11). Columns `Code`, `Rate`. No caller exists. |
