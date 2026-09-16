export interface RecentRegistration {
  name: string;
  club: string;
  category: string;
  date: string;
}

export interface CategoryDistribution {
  name: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  totalPlayers: string;
  activeCategoriesCount: string;
  recentRegistrations: RecentRegistration[];
  categoryDistributions: CategoryDistribution[];
}
