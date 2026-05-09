
export interface User {
  id: string;
  fullName: string;
  name: string;
  profession: string;
  walletBalance: number;
  loyaltyPoints: number;
  phone: string;
  email: string;
  deliveryAddress: string;
  isActive: boolean;
  memberSinceYear: number;
  updatedAt: string;
  status: string;
}

export interface Transaction {
hasMore: boolean;
period: string;
totalPointsEarned: number;
totalPointsSpent: number; 
transactions: any[];
}


export interface DashboardData {
  pendingApprovalsCount: number;
  pendingOpsAdminApprovalsCount: number;

  pointsIssued: {
    totalLast7Days: number;
    percentVsPriorWeek: number;
  };

  pointsRedeemed: {
    totalLast7Days: number;
    percentVsPriorWeek: number;
  };

  activeUsers: {
    countLast7Days: number;
    dailyActiveUsersLast5Days: number[];
  };

  couponsScannedToday: {
    count: number;
    last5MinutesCount: number;
  };
}