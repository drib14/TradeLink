import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Users, Eye } from 'lucide-react';
import { adminService } from '../../services/admin.service';

type Period = 'day' | 'week' | 'month' | 'year';
type VisitDay = { date: string; visitors: number };
type VisitData = { totalVisitors: number; selectedDayVisitors: number; range: { start: string; end: string }; daily: VisitDay[] };

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) => {
  const date = new Date(value + 'T12:00:00');
  return date.toLocaleDateString('en-PH', options || { month: 'long', day: 'numeric', year: 'numeric' });
};

export const AdminVisitorAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<Period>('month');
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [data, setData] = useState<VisitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selected = new Date(selectedDate + 'T12:00:00');
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const dayMap = useMemo(() => new Map((data?.daily || []).map((item) => [item.date, item.visitors])), [data]);
  const maxDay = Math.max(1, ...(data?.daily || []).map((item) => item.visitors));
  const peakDay = (data?.daily || []).reduce((peak, item) => item.visitors > (peak?.visitors || 0) ? item : peak, null as VisitDay | null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminService.getVisits({ period, date: selectedDate });
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Unable to load visitor analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [period, selectedDate]);

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    const maxDayInNextMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(selected.getDate(), maxDayInNextMonth));
    setSelectedDate(toDateKey(next));
  };

  const rangeLabel = period === 'day'
    ? formatDate(selectedDate)
    : data?.range
      ? `${formatDate(data.range.start)} — ${formatDate(data.range.end)}`
      : 'Loading range';

  return (
    <section className="admin-feature-stack">
      <div className="admin-feature-heading">
        <div>
          <span className="admin-eyebrow">PLATFORM PERFORMANCE</span>
          <h2>Visitor analytics</h2>
          <p>Understand how many people are returning to TradeLink. Visitor counts are anonymous and grouped by Philippine local date.</p>
        </div>
        <button className="admin-secondary-button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'admin-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="admin-filter-row">
        <div className="admin-segmented">
          {(['day', 'week', 'month', 'year'] as Period[]).map((item) => (
            <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>{item[0].toUpperCase() + item.slice(1)}</button>
          ))}
        </div>
        <div className="admin-range-label"><CalendarDays size={15} /> {rangeLabel}</div>
      </div>

      {error && <div className="admin-inline-error">{error}</div>}

      <div className="admin-visitor-kpis">
        <article className="admin-metric-card">
          <div className="admin-metric-icon blue"><Users size={18} /></div>
          <span>Visitors in selected {period}</span>
          <strong>{loading ? '—' : (data?.totalVisitors ?? 0).toLocaleString()}</strong>
          <small>{period === 'day' ? 'Unique visitors that day' : 'Unique visitors in this date range'}</small>
        </article>
        <article className="admin-metric-card">
          <div className="admin-metric-icon gold"><CalendarDays size={18} /></div>
          <span>Selected day</span>
          <strong>{loading ? '—' : (data?.selectedDayVisitors ?? 0).toLocaleString()}</strong>
          <small>{formatDate(selectedDate)}</small>
        </article>
        <article className="admin-metric-card">
          <div className="admin-metric-icon green"><Activity size={18} /></div>
          <span>Peak day this month</span>
          <strong>{peakDay?.visitors?.toLocaleString() || '0'}</strong>
          <small>{peakDay ? formatDate(peakDay.date, { month: 'short', day: 'numeric' }) : 'No visits recorded yet'}</small>
        </article>
      </div>

      <div className="admin-analytics-grid">
        <article className="admin-panel-card admin-calendar-panel">
          <div className="admin-panel-heading">
            <div><h3>Daily visitor calendar</h3><p>Select any date to inspect its visitor count.</p></div>
            <div className="admin-calendar-controls">
              <button aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={17} /></button>
              <button aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={17} /></button>
            </div>
          </div>
          <div className="admin-calendar-month">
            <select aria-label="Month" value={month} onChange={(event) => setSelectedDate(toDateKey(new Date(year, Number(event.target.value), 1)))}>
              {Array.from({ length: 12 }, (_, index) => <option key={index} value={index}>{new Date(2024, index, 1).toLocaleDateString('en-PH', { month: 'long' })}</option>)}
            </select>
            <select aria-label="Year" value={year} onChange={(event) => setSelectedDate(toDateKey(new Date(Number(event.target.value), month, 1)))}>
              {Array.from({ length: 7 }, (_, index) => new Date().getFullYear() - 5 + index).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button onClick={() => setSelectedDate(toDateKey(new Date()))}>Today</button>
          </div>
          <div className="admin-calendar-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => <span className="weekday" key={label}>{label}</span>)}
            {Array.from({ length: mondayOffset }, (_, index) => <span className="empty-day" key={'empty-' + index} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const key = toDateKey(new Date(year, month, day));
              const count = dayMap.get(key) || 0;
              const isSelected = key === selectedDate;
              const isToday = key === toDateKey(new Date());
              return (
                <button key={key} className={`admin-calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${count > 0 ? 'has-visits' : ''}`} onClick={() => setSelectedDate(key)} title={`${count} visitors on ${formatDate(key)}`}>
                  <span>{day}</span>
                  <i style={{ opacity: count ? Math.max(0.35, count / maxDay) : 0 }} />
                </button>
              );
            })}
          </div>
          <div className="admin-calendar-legend"><span><i className="legend-dot" /> Activity recorded</span><span>Tap a date for its count</span></div>
        </article>

        <article className="admin-panel-card admin-month-chart">
          <div className="admin-panel-heading">
            <div><h3>Monthly activity</h3><p>{selected.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</p></div>
            <span className="admin-chart-total">{(data?.daily || []).reduce((sum, item) => sum + item.visitors, 0).toLocaleString()} <small>visitors</small></span>
          </div>
          <div className="admin-bar-chart" role="img" aria-label="Daily unique visitor counts for the selected month">
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const key = toDateKey(new Date(year, month, day));
              const count = dayMap.get(key) || 0;
              return <div className="admin-bar-column" key={key} title={`${formatDate(key)}: ${count} visitors`}>
                <div className="admin-bar-track"><i style={{ height: `${count ? Math.max(5, count / maxDay * 100) : 0}%` }} /></div>
                <span>{day % 5 === 0 || day === 1 || day === daysInMonth ? day : ''}</span>
              </div>;
            })}
          </div>
          <div className="admin-chart-note"><Eye size={14} /> One anonymous browser/device is counted once per day, even if it opens multiple pages.</div>
        </article>
      </div>
    </section>
  );
};
