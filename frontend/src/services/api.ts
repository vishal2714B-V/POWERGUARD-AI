import {
  DashboardKPIs, RoomLiveStatus, PredictionSummary, AnomalyItem,
  AlertItem, RecommendationItem, SimulationResult, WastageChargeItem
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('powerguard_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const parsed = JSON.parse(errorText);
        errorMsg = parsed.detail || errorMsg;
      } catch {
        errorMsg = errorText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    return this.request<{
      access_token: string;
      token_type: string;
      role: 'ADMIN' | 'USER';
      username: string;
      assigned_room_id: number | null;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Energy & KPIs
  async getKPIs(): Promise<DashboardKPIs> {
    return this.request<DashboardKPIs>('/energy/kpis');
  }

  async getHourlyConsumption() {
    return this.request<any[]>('/energy/charts/hourly');
  }

  async getDailyConsumption() {
    return this.request<any[]>('/energy/charts/daily');
  }

  async getRoomWiseConsumption() {
    return this.request<any[]>('/energy/charts/room-wise');
  }

  async getApplianceBreakdown() {
    return this.request<any[]>('/energy/charts/appliance-wise');
  }

  // Rooms
  async getLiveRooms(): Promise<RoomLiveStatus[]> {
    return this.request<RoomLiveStatus[]>('/rooms/live');
  }

  async getRoomDetails(roomId: number) {
    return this.request<any>(`/rooms/${roomId}`);
  }

  // Predictions
  async getPredictionSummary(): Promise<PredictionSummary> {
    return this.request<PredictionSummary>('/predictions/summary');
  }

  // Anomalies
  async getAnomalies(): Promise<AnomalyItem[]> {
    return this.request<AnomalyItem[]>('/anomalies/');
  }

  async getActiveWastage(): Promise<AnomalyItem[]> {
    return this.request<AnomalyItem[]>('/anomalies/active-wastage');
  }

  // Alerts
  async getAlerts(severity?: string): Promise<AlertItem[]> {
    const q = severity ? `?severity=${severity}` : '';
    return this.request<AlertItem[]>(`/alerts/${q}`);
  }

  async markAlertRead(alertId: number) {
    return this.request<any>(`/alerts/${alertId}/read`, { method: 'POST' });
  }

  async markAllAlertsRead() {
    return this.request<any>('/alerts/mark-all-read', { method: 'POST' });
  }

  // Recommendations
  async getRecommendations(): Promise<RecommendationItem[]> {
    return this.request<RecommendationItem[]>('/recommendations/');
  }

  async applyRecommendation(recId: number) {
    return this.request<any>(`/recommendations/${recId}/apply`, { method: 'POST' });
  }

  async dismissRecommendation(recId: number) {
    return this.request<any>(`/recommendations/${recId}/dismiss`, { method: 'POST' });
  }

  // Simulation
  async runSimulation(params: any): Promise<SimulationResult> {
    return this.request<SimulationResult>('/simulation/run', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Smart Wastage Charge
  async getWastageCharges(): Promise<WastageChargeItem[]> {
    return this.request<WastageChargeItem[]>('/wastage-charge/');
  }

  async calculateWastageCharge(params: any): Promise<WastageChargeItem> {
    return this.request<WastageChargeItem>('/wastage-charge/calculate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Reports
  async getReportSummary() {
    return this.request<any>('/reports/summary');
  }

  getCSVExportUrl() {
    return `${API_BASE_URL}/reports/export/csv`;
  }

  // Settings
  async getSettings() {
    return this.request<any>('/settings/');
  }

  async updateSettings(params: any) {
    return this.request<any>('/settings/update', {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  }

  // Demo Mode
  async triggerDemoScenario(scenario: 'normal' | 'wastage' | 'high-load') {
    return this.request<any>(`/demo/scenario/${scenario}`, { method: 'POST' });
  }
}

export const api = new ApiService();
