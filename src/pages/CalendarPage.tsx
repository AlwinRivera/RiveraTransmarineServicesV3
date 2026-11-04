import { Button, Group, Text } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLookups, useStore } from '../data/store';
import { STATUS, isReserving } from '../data/rules';
import { PageHeader, statusTextColor, statusVar } from '../components/common';
import { useBookingDrawer } from '../components/BookingDrawer';
import { addDays, daysBetween, todayISO } from '../lib/format';
import type { Booking, BookingStatus } from '../types';

const DAYS = 21;

function startOfWeek(iso: string) {
  const d = dayjs(iso);
  const dow = (d.day() + 6) % 7; // Monday = 0
  return d.subtract(dow, 'day').format('YYYY-MM-DD');
}

/** Puts overlapping bars on separate lines inside a vessel's row. */
function assignLanes(items: { b: Booking; col: number; span: number }[]) {
  const laneEnds: number[] = [];
  return items
    .sort((a, b) => a.col - b.col)
    .map((it) => {
      let lane = laneEnds.findIndex((end) => end < it.col);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[lane] = it.col + it.span - 1;
      return { ...it, lane };
    });
}

export default function CalendarPage() {
  const { state } = useStore();
  const { client } = useLookups();
  const today = todayISO();
  const [from, setFrom] = useState(() => startOfWeek(today));
  const { openFromLink, drawer } = useBookingDrawer();
  const to = addDays(from, DAYS - 1);
  const days = Array.from({ length: DAYS }, (_, i) => addDays(from, i));
  const todayCol = daysBetween(from, today) + 1;

  const shown = state.bookings.filter(
    (b) => (isReserving(b.status) || b.status === 'quoted') && b.startDate <= to && b.endDate >= from,
  );

  return (
    <>
      <PageHeader
        title="Fleet calendar"
        sub={`${dayjs(from).format('D MMM')} to ${dayjs(to).format('D MMM YYYY')}`}
        actions={
          <>
            <Button.Group>
              <Button variant="default" onClick={() => setFrom(addDays(from, -7))} aria-label="Previous week">
                <IconChevronLeft size={18} />
              </Button>
              <Button variant="default" onClick={() => setFrom(startOfWeek(today))}>
                This week
              </Button>
              <Button variant="default" onClick={() => setFrom(addDays(from, 7))} aria-label="Next week">
                <IconChevronRight size={18} />
              </Button>
            </Button.Group>
            <Button component={Link} to="/bookings/new" leftSection={<IconPlus size={18} />}>
              New booking
            </Button>
          </>
        }
      />

      <div className="cal-wrap">
        <div className="cal" style={{ gridTemplateColumns: `170px repeat(${DAYS}, minmax(38px, 1fr))` }}>
          <div className="cal-head" style={{ position: 'sticky', left: 0, background: 'var(--mantine-color-body)', zIndex: 2 }} />
          {days.map((d) => (
            <div key={d} className={`cal-head${d === today ? ' is-today' : ''}`}>
              {dayjs(d).format('ddd')}
              <br />
              <span className="rv-num" style={{ fontSize: 15 }}>
                {dayjs(d).format('D')}
              </span>
            </div>
          ))}

          {state.vessels.map((v) => {
            const items = assignLanes(
              shown
                .filter((b) => b.vesselIds.includes(v.id))
                .map((b) => {
                  const s = b.startDate < from ? from : b.startDate;
                  const e = b.endDate > to ? to : b.endDate;
                  return { b, col: daysBetween(from, s) + 1, span: daysBetween(s, e) + 1 };
                }),
            );
            const lanes = Math.max(1, ...items.map((i) => i.lane + 1));
            return (
              <div key={v.id} style={{ display: 'contents' }}>
                <Link to={`/vessels/${v.id}`} className="cal-vessel" style={{ color: 'inherit', textDecoration: 'none' }}>
                  {v.name}
                  <Text size="xs" c="dimmed" fw={400}>
                    {v.type}
                  </Text>
                </Link>
                <div
                  className="cal-lane"
                  style={{
                    gridColumn: `2 / span ${DAYS}`,
                    gridTemplateColumns: `repeat(${DAYS}, minmax(38px, 1fr))`,
                    gridTemplateRows: `repeat(${lanes}, 34px)`,
                  }}
                >
                  {todayCol >= 1 && todayCol <= DAYS && (
                    <div className="cal-today-line" style={{ gridColumn: todayCol, gridRow: '1 / -1' }} />
                  )}
                  {items.map(({ b, col, span, lane }) => {
                    const tentative = !isReserving(b.status);
                    return (
                      <Link
                        key={b.id}
                        to={`/bookings/${b.id}`}
                        onClick={openFromLink(b.id)}
                        className={`cal-bar${tentative ? ' is-tentative' : ''}`}
                        style={{
                          gridColumn: `${col} / span ${span}`,
                          gridRow: lane + 1,
                          background: statusVar(b.status),
                          color: tentative ? statusVar(b.status) : statusTextColor(b.status),
                        }}
                        title={`${client(b.clientId)?.company}: ${b.origin} to ${b.destination} (${STATUS[b.status].label})`}
                      >
                        <strong>{client(b.clientId)?.company}</strong> {b.origin} to {b.destination}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Group gap="lg" mt="md">
        {(['quoted', 'confirmed', 'departed', 'delayed', 'arrived', 'completed'] as BookingStatus[]).map((s) => (
          <Group key={s} gap={6}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: s === 'quoted' ? 'transparent' : statusVar(s),
                border: s === 'quoted' ? `2px dashed ${statusVar(s)}` : undefined,
              }}
            />
            <Text size="sm">{STATUS[s].label}</Text>
          </Group>
        ))}
        <Text size="sm" c="dimmed">
          Quotes don't hold the vessel yet. Tap a bar to see and update the booking.
        </Text>
      </Group>
      {drawer}
    </>
  );
}
