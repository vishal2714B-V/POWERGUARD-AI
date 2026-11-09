import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { PredictionPage } from './pages/PredictionPage';
import { WastagePage } from './pages/WastagePage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { SimulationPage } from './pages/SimulationPage';
import { SmartWastageChargePage } from './pages/SmartWastageChargePage';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserPortalPage } from './pages/UserPortalPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedRoomId, setSelectedRoomId] = useState<number>(8);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(3);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchAlertsCount = async () => {
        try {
          const list = await api.getAlerts();
          const unread = list.filter((a) => !a.is_read).length;
          setUnreadAlertsCount(unread);
        } catch (err) {
          // ignore
        }
      };
      fetchAlertsCount();
      const interval = setInterval(fetchAlertsCount, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#070b13',
        color: '#38bdf8',
        fontFamily: 'var(--font-sans)',
      }}>
        Initializing PowerGuard AI...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleSelectRoom = (roomId: number) => {
    setSelectedRoomId(roomId);
    setCurrentTab('room-detail');
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Executive Energy Command Dashboard';
      case 'monitoring': return 'Real-Time Facility Telemetry Matrix';
      case 'room-detail': return `Zone Telemetry Inspection: Room ${selectedRoomId === 8 ? '204' : selectedRoomId}`;
      case 'prediction': return 'AI Machine Learning Energy Predictor';
      case 'wastage': return 'Isolation Forest Wastage & Anomaly Classifier';
      case 'recommendations': return 'AI Advisory & Recommendation Engine';
      case 'simulation': return 'What-If Facility Optimization Simulator';
      case 'wastage-charge': return 'Simulated Smart Wastage Charge';
      case 'reports': return 'Energy Audit & Sustainability Reports';
      case 'alerts': return 'Incident & Anomaly Alert Feed';
      case 'settings': return 'System Settings & IoT Diagnostics';
      case 'user-portal': return 'Assigned Room Custodian Portal';
      default: return 'PowerGuard AI';
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadAlertsCount={unreadAlertsCount}
      />

      <div className="main-content">
        <Navbar
          pageTitle={getPageTitle()}
          unreadCount={unreadAlertsCount}
          onOpenAlerts={() => setCurrentTab('alerts')}
        />

        <main style={{ flex: 1 }}>
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigateToRoom={handleSelectRoom}
              onNavigateToTab={(t) => setCurrentTab(t)}
            />
          )}

          {currentTab === 'monitoring' && (
            <LiveMonitoringPage onSelectRoom={handleSelectRoom} />
          )}

          {currentTab === 'room-detail' && (
            <RoomDetailPage
              roomId={selectedRoomId}
              onBack={() => setCurrentTab('monitoring')}
              onNavigateToTab={(t) => setCurrentTab(t)}
            />
          )}

          {currentTab === 'prediction' && <PredictionPage />}

          {currentTab === 'wastage' && (
            <WastagePage onSelectRoom={handleSelectRoom} />
          )}

          {currentTab === 'recommendations' && <RecommendationsPage />}

          {currentTab === 'simulation' && <SimulationPage />}

          {currentTab === 'wastage-charge' && <SmartWastageChargePage />}

          {currentTab === 'reports' && <ReportsPage />}

          {currentTab === 'alerts' && <AlertsPage />}

          {currentTab === 'settings' && <SettingsPage />}

          {currentTab === 'user-portal' && (
            <UserPortalPage onNavigateToTab={(t) => setCurrentTab(t)} />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
