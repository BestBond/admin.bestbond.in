export type GiftTier = 'WORKER' | 'CONTRACTOR';

/** GET /admin/rewards */
export interface AdminRewardDto {
  id: string;
  title: string;
  description: string | null;
  pointsCost: number;
  giftTier: GiftTier;
  sortOrder: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** GET /admin/users — each list row */
export interface AdminUserListItem {
  id: string;
  name: string;
  profession: string | null;
  walletBalance: number;
  status: 'ACTIVE' | 'SUSPENDED';
  staffApprovedAt: string | null;
}

/** GET /admin/users/:id */
export interface AdminUserDetail {
  id: string;
  fullName: string | null;
  displayName: string;
  profession: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  loyaltyPoints: number;
  phone: string | null;
  deliveryAddress: string | null;
  staffApprovedAt: string | null;
  staffApprovedBy: string | null;
  updatedAt: string;
  createdAt: string;
}

/** GET /users/me/profile (authenticated staff) */
export interface MeProfileResponse {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  profession: string | null;
  deliveryAddress: string | null;
  loyaltyPoints: number;
  memberSinceYear: number | null;
  profileComplete: boolean;
  roles: string[];
  permissions: string[];
}

/** GET /transactions/me (consumer) */
export interface Transaction {
  hasMore: boolean;
  period: string;
  totalPointsEarned: number;
  totalPointsSpent: number;
  transactions: Array<{
    id: string;
    title: string;
    pointsDelta?: number;
    points?: number;
    createdAt: string;
    site?: string | null;
  }>;
}

/** GET /admin/users/:id/transactions */
export interface AdminUserLedgerResponse {
  user: {
    id: string;
    displayName: string;
    profession: string | null;
    status: string;
  };
  period: string;
  totalBalance: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  monthlyScans: number;
  hasMore: boolean;
  transactions: Array<{
    id: string;
    type: string;
    title: string;
    site: string | null;
    pointsDelta: number;
    createdAt: string;
  }>;
}


export interface DashboardData {
  pendingApprovalsCount: number;
  pendingOpsAdminApprovalsCount: number;
  totalCouponsIssued: number;
  totalCouponsReceived: number;

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

  coupons?: {
    totalIssued: number;
    totalRedeemed: number;
  };
}