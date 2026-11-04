import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useStore } from './data/store';
import type { Role } from './types';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import TodayPage from './pages/TodayPage';
import CalendarPage from './pages/CalendarPage';
import BookingsPage from './pages/BookingsPage';
import BookingPage from './pages/BookingPage';
import VesselsPage from './pages/VesselsPage';
import VesselPage from './pages/VesselPage';
import ClientsPage from './pages/ClientsPage';
import ClientPage from './pages/ClientPage';
import CaptainPage from './pages/CaptainPage';
import SettingsPage from './pages/SettingsPage';
import TrackPage from './pages/TrackPage';
import PlaybookPage from './pages/PlaybookPage';
import InterviewPage from './pages/InterviewPage';
import HandoverPage from './pages/HandoverPage';

/** Sends people to the screens their role is allowed to open. */
function Guard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={user.role === 'captain' ? '/captain' : '/'} replace />;
  return <>{children}</>;
}

const OFFICE: Role[] = ['owner', 'staff'];

/** Gives a page a fresh state whenever the record in the link changes. */
function Keyed({ page: Page }: { page: () => ReactNode }) {
  const { id } = useParams();
  return <Page key={id} />;
}

// HashRouter keeps links working on GitHub Pages, which can't redirect unknown paths.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/track/:code" element={<TrackPage />} />
        <Route
          path="/captain"
          element={
            <Guard roles={['captain']}>
              <CaptainPage />
            </Guard>
          }
        />
        <Route
          element={
            <Guard roles={OFFICE}>
              <Layout />
            </Guard>
          }
        >
          <Route path="/" element={<TodayPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/new" element={<BookingPage />} />
          <Route path="/bookings/:id" element={<BookingPage />} />
          <Route path="/vessels" element={<VesselsPage />} />
          <Route path="/vessels/:id" element={<Keyed page={VesselPage} />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<Keyed page={ClientPage} />} />
          <Route path="/playbook" element={<PlaybookPage />} />
          <Route path="/playbook/interview" element={<InterviewPage />} />
          <Route
            path="/handover"
            element={
              <Guard roles={['owner']}>
                <HandoverPage />
              </Guard>
            }
          />
          <Route
            path="/settings"
            element={
              <Guard roles={['owner']}>
                <SettingsPage />
              </Guard>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
