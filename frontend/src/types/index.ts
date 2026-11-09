export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  assigned_room_id?: number | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface RoomLiveStatus {
  room_id: number;
  room_number: string;
  name: string;
  floor: number;
  current_power_kw: number;
  voltage: number;
  current_amp: number;
  temperature: number;
  occupancy: number;
  ac_status: boolean;
  light_status: boolean;
  fan_status: boolean;
  computer_status: boolean;
  status: 'NORMAL' | 'WARNING' | 'WASTAGE' | 'CRITICAL';
  risk_score: number;
  active_anomaly_reason?: string;
  last_updated: string;
}

export interface DashboardKPIs {
  today_consumption_kwh: number;
  current_power_kw: number;
  predicted_consumption_kwh: number;
  estimated_cost: number;
  potential_savings: number;
  wastage_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  wastage_risk_score: number;
  total_active_rooms: number;
  wastage_rooms_count: number;
  unread_alerts_count: number;
  co2_emissions_kg: number;
}

export interface PredictionSummary {
  next_hour_kwh: number;
  next_day_kwh: number;
  model_name: string;
  training_samples: number;
  mae: number;
  rmse: number;
  r2_score: number;
  explanation: string;
  timeline: Array<{
    timestamp: string;
    actual_kwh: number | null;
    predicted_kwh: number;
    is_future: boolean;
  }>;
  feature_importances: Record<string, number>;
}

export interface AnomalyItem {
  id: number;
  timestamp: string;
  room_id: number;
  room_number: string;
  room_name?: string;
  anomaly_score: number;
  risk_score: number;
  severity: 'NORMAL' | 'WARNING' | 'WASTAGE' | 'CRITICAL';
  is_wastage: boolean;
  reason: string;
  power_kw: number;
  duration_hours: number;
  wasted_kwh: number;
  wasted_cost: number;
  occupancy?: number;
  ac_status?: boolean;
  light_status?: boolean;
  factors?: Array<{
    factor_name: string;
    contribution_score: number;
    description: string;
  }>;
}

export interface AlertItem {
  id: number;
  timestamp: string;
  room_id: number;
  room_number: string;
  room_name?: string;
  alert_type: 'CRITICAL' | 'WARNING' | 'INFO' | 'OPTIMIZATION';
  title: string;
  message: string;
  recommended_action?: string;
  is_read: boolean;
}

export interface RecommendationItem {
  id: number;
  timestamp: string;
  room_id: number;
  room_number: string;
  room_name?: string;
  category: string;
  problem: string;
  suggested_action: string;
  estimated_kwh_saving: number;
  estimated_cost_saving: number;
  estimated_co2_saving: number;
  status: 'PENDING' | 'APPLIED' | 'DISMISSED';
}

export interface SimulationResult {
  scenario_name: string;
  current_daily_kwh: number;
  optimized_daily_kwh: number;
  energy_saved_kwh: number;
  cost_saved_inr: number;
  co2_reduced_kg: number;
  percentage_saved: number;
  breakdown_by_category: Record<string, number>;
  hourly_comparison: Array<{
    hour: string;
    current_kwh: number;
    optimized_kwh: number;
    saving_kwh: number;
  }>;
}

export interface WastageChargeItem {
  id?: number;
  room_number: string;
  billing_period: string;
  expected_kwh: number;
  actual_kwh: number;
  avoidable_excess_kwh: number;
  penalty_rate: number;
  simulated_charge_inr: number;
  status: string;
  disclaimer: string;
}
