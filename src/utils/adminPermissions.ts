/**
 * Full admin (backend `isFullAdminUser`): sees contractor/painter app + dealer queues.
 * Ops-only admins have `dealer.redemptions.manage` only.
 */
export function seesFullRedemptionApprovalQueue(): boolean {
  try {
    const raw = localStorage.getItem("userPermissions");
    const perms = raw ? JSON.parse(raw) : [];
    return (
      Array.isArray(perms) &&
      (perms.includes("users.manage") || perms.includes("rbac.manage"))
    );
  } catch {
    return false;
  }
}
