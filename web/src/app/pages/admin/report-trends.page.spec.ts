import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SalesTrendReport } from '../../core/models';
import { ReportTrendsPage, changeLabel, rangeEndingToday } from './report-trends.page';

const totals = (orders: number, net: number) => ({ orderCount: orders, grossSales: net, refundedAmount: 0, netSales: net, discountsGiven: 2, cancelledCount: 0 });

const report = (over: Partial<SalesTrendReport> = {}): SalesTrendReport => ({
  from: '2026-11-07T00:00:00', to: '2026-11-13T00:00:00', current: totals(12, 150), previous: totals(10, 120),
  netSalesChangePct: 25, orderCountChangePct: 20,
  daily: [{ salesDate: '2026-11-12T00:00:00', orders: 5, netSales: 60 }, { salesDate: '2026-11-13T00:00:00', orders: 0, netSales: 0 }],
  prepTimes: [{ hour: 12, orders: 4, avgMinutes: 7.5 }],
  ...over,
});

describe('rangeEndingToday', () => {
  it('covers the requested number of days ending today in UTC', () => {
    expect(rangeEndingToday(7, new Date('2026-11-13T23:30:00Z'))).toEqual({ from: '2026-11-07', to: '2026-11-13' });
    expect(rangeEndingToday(30, new Date('2026-03-02T00:10:00Z'))).toEqual({ from: '2026-02-01', to: '2026-03-02' });
  });
});

describe('changeLabel', () => {
  it('words gains, losses, no change and a missing baseline', () => {
    expect(changeLabel(25)).toBe('+25% vs previous period');
    expect(changeLabel(-12.5)).toBe('−12.5% vs previous period');
    expect(changeLabel(0)).toBe('Same as the previous period');
    expect(changeLabel(null)).toBe('No sales in the previous period');
  });
});

describe('ReportTrendsPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  it('loads the last 7 days and shows totals, comparison and prep time', async () => {
    const fixture = TestBed.createComponent(ReportTrendsPage);
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url.endsWith('/reports/trends'));
    expect(req.request.params.get('from')).toBeTruthy();
    expect(req.request.params.get('to')).toBeTruthy();
    req.flush(report());
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(text).toContain('$150.00');
    expect(text).toContain('+25% vs previous period');
    expect(text).toContain('7.5 min (4)');
    fixture.destroy();
  });

  it('reloads when a preset is chosen', async () => {
    const fixture = TestBed.createComponent(ReportTrendsPage);
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/reports/trends')).flush(report());
    ([...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) => b.textContent?.includes('Last 30 days')) as HTMLButtonElement).click();
    const req = http.expectOne((r) => r.url.endsWith('/reports/trends'));
    expect(req.request.params.get('from')).toBe(rangeEndingToday(30).from);
    req.flush(report());
    fixture.destroy();
  });

  it('shows the server message when the range is rejected and the prep-time empty state', async () => {
    const fixture = TestBed.createComponent(ReportTrendsPage);
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/reports/trends')).flush({ error: 'Pick a range of 92 days or fewer.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent).toContain('92 days');
    fixture.destroy();

    const again = TestBed.createComponent(ReportTrendsPage);
    again.detectChanges();
    http.expectOne((r) => r.url.endsWith('/reports/trends')).flush(report({ prepTimes: [] }));
    await again.whenStable();
    again.detectChanges();
    expect((again.nativeElement as HTMLElement).textContent).toContain('No orders reached Ready');
    again.destroy();
  });
});
