import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import settingsService from './settingsService.js';

/**
 * Buy-now-pay-later credit for wholesale customers.
 *
 * A customer becomes eligible once the total of their PAID, non-cancelled orders reaches the
 * admin's threshold (Settings.creditEligibilityAmount). Eligible customers get a credit limit
 * (Settings.creditLimit, or a per-customer override) and can check out with "Pay on credit".
 * A credit order uses credit until the admin marks it paid; cancelling it frees the credit.
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function readCreditSettings(settings = {}) {
  return {
    enabled: settings.creditEnabled === true,
    eligibilityAmount: Math.max(0, Number(settings.creditEligibilityAmount) || 0),
    defaultLimit: Math.max(0, Number(settings.creditLimit) || 0),
    dueDays: Math.max(1, Math.round(Number(settings.creditDueDays) || 30))
  };
}

const toObjectId = (id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id)));

/** Lifetime paid spend (orders that are paid and not cancelled). */
async function getPaidSpend(userId) {
  const [row] = await Order.aggregate([
    { $match: { user: toObjectId(userId), status: { $ne: 'CANCELLED' }, 'payment.status': 'PAID' } },
    { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } }
  ]);
  return { total: round2(row?.total), count: row?.count || 0 };
}

/** Credit orders that still use credit: not cancelled and not yet paid. */
async function getOpenCreditOrders(userId) {
  return Order.find({
    user: toObjectId(userId),
    'payment.method': 'CREDIT',
    'payment.status': { $ne: 'PAID' },
    status: { $ne: 'CANCELLED' }
  })
    .sort({ createdAt: -1 })
    .select('orderNumber pricing.total payment status createdAt')
    .lean();
}

/**
 * Full credit picture for one customer.
 * @param {string|ObjectId} userId
 * @param {{ settings?: object, user?: object }} [preloaded]
 */
export async function getCreditSummary(userId, preloaded = {}) {
  if (!mongoose.Types.ObjectId.isValid(String(userId))) {
    const err = new Error('Invalid customer id');
    err.statusCode = 400;
    throw err;
  }
  const settings = preloaded.settings || (await settingsService.getSettings());
  const cfg = readCreditSettings(settings);
  const user =
    preloaded.user || (await User.findById(userId).select('creditLimitOverride creditBlocked').lean()) || {};

  const [spend, openOrders] = await Promise.all([getPaidSpend(userId), getOpenCreditOrders(userId)]);

  const hasOverride = typeof user.creditLimitOverride === 'number' && user.creditLimitOverride >= 0;
  const limit = hasOverride ? user.creditLimitOverride : cfg.defaultLimit;
  const used = round2(openOrders.reduce((sum, o) => sum + (Number(o.pricing?.total) || 0), 0));
  const now = Date.now();
  const open = openOrders.map((o) => {
    const due = o.payment?.creditDueDate ? new Date(o.payment.creditDueDate) : null;
    return {
      id: String(o._id),
      orderNumber: o.orderNumber,
      amount: round2(o.pricing?.total),
      status: o.status,
      placedAt: o.createdAt,
      dueDate: due,
      overdue: Boolean(due && due.getTime() < now)
    };
  });
  const overdueCount = open.filter((o) => o.overdue).length;

  const reachedThreshold = spend.total >= cfg.eligibilityAmount;
  const blocked = user.creditBlocked === true;
  const eligible = cfg.enabled && !blocked && reachedThreshold && limit > 0;

  return {
    enabled: cfg.enabled,
    eligible,
    blocked,
    eligibilityAmount: cfg.eligibilityAmount,
    totalPaidSpend: spend.total,
    paidOrders: spend.count,
    remainingToUnlock: round2(Math.max(0, cfg.eligibilityAmount - spend.total)),
    limit: round2(limit),
    limitIsCustom: hasOverride,
    used,
    available: round2(Math.max(0, limit - used)),
    dueDays: cfg.dueDays,
    overdueCount,
    openOrders: open
  };
}

/**
 * Throws a 400 error when this customer cannot put `amount` on credit right now.
 * Returns the summary and the due date for the new order when allowed.
 */
export async function assertCanUseCredit(userId, amount) {
  const summary = await getCreditSummary(userId);
  const fail = (message) => {
    const err = new Error(message);
    err.statusCode = 400;
    throw err;
  };

  if (!summary.enabled) fail('Pay on credit is not available right now.');
  if (summary.blocked) fail('Pay on credit is not available on your account. Please contact us.');
  if (!summary.eligible) {
    fail(`Pay on credit unlocks after ₹${summary.eligibilityAmount.toLocaleString('en-IN')} of paid orders. ₹${summary.remainingToUnlock.toLocaleString('en-IN')} to go.`);
  }
  if (summary.overdueCount > 0) fail('Please clear your overdue credit payments before placing another credit order.');
  if (round2(amount) > summary.available) {
    fail(`This order (₹${round2(amount).toLocaleString('en-IN')}) is more than your available credit (₹${summary.available.toLocaleString('en-IN')}).`);
  }

  const dueDate = new Date(Date.now() + summary.dueDays * 24 * 60 * 60 * 1000);
  return { summary, dueDate };
}

/** Credit columns for the admin customer list (one query per page, not per customer). */
export async function getCreditOverviewForUsers(users = []) {
  if (!users.length) return new Map();
  const settings = await settingsService.getSettings();
  const cfg = readCreditSettings(settings);
  const ids = users.map((u) => toObjectId(u._id));

  const [paidRows, usedRows] = await Promise.all([
    Order.aggregate([
      { $match: { user: { $in: ids }, status: { $ne: 'CANCELLED' }, 'payment.status': 'PAID' } },
      { $group: { _id: '$user', total: { $sum: '$pricing.total' } } }
    ]),
    Order.aggregate([
      { $match: { user: { $in: ids }, status: { $ne: 'CANCELLED' }, 'payment.method': 'CREDIT', 'payment.status': { $ne: 'PAID' } } },
      { $group: { _id: '$user', used: { $sum: '$pricing.total' } } }
    ])
  ]);
  const paid = new Map(paidRows.map((r) => [String(r._id), r.total]));
  const usedMap = new Map(usedRows.map((r) => [String(r._id), r.used]));

  const out = new Map();
  for (const u of users) {
    const key = String(u._id);
    const hasOverride = typeof u.creditLimitOverride === 'number' && u.creditLimitOverride >= 0;
    const limit = hasOverride ? u.creditLimitOverride : cfg.defaultLimit;
    const spend = round2(paid.get(key));
    const used = round2(usedMap.get(key));
    out.set(key, {
      eligible: cfg.enabled && u.creditBlocked !== true && spend >= cfg.eligibilityAmount && limit > 0,
      blocked: u.creditBlocked === true,
      totalPaidSpend: spend,
      limit: round2(limit),
      limitIsCustom: hasOverride,
      used,
      available: round2(Math.max(0, limit - used))
    });
  }
  return out;
}

/** Admin: set a customer's own limit (null = use the store default) and/or block credit. */
export async function updateCustomerCredit(userId, { creditLimitOverride, creditBlocked } = {}) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('Invalid customer id');
    err.statusCode = 400;
    throw err;
  }
  const set = {};
  if (creditLimitOverride !== undefined) {
    if (creditLimitOverride === null || creditLimitOverride === '') {
      set.creditLimitOverride = null;
    } else {
      const n = Number(creditLimitOverride);
      if (!Number.isFinite(n) || n < 0) {
        const err = new Error('Credit limit must be 0 or more');
        err.statusCode = 400;
        throw err;
      }
      set.creditLimitOverride = round2(n);
    }
  }
  if (creditBlocked !== undefined) set.creditBlocked = creditBlocked === true;

  const user = await User.findOneAndUpdate({ _id: userId, role: 'USER' }, { $set: set }, { new: true })
    .select('creditLimitOverride creditBlocked')
    .lean();
  if (!user) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }
  return getCreditSummary(userId, { user });
}

export default {
  readCreditSettings,
  getCreditSummary,
  assertCanUseCredit,
  getCreditOverviewForUsers,
  updateCustomerCredit
};
