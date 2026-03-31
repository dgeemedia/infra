"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYOUT_STATUS_COLORS = exports.PAYOUT_STATUS_LABELS = exports.RETRYABLE_STATUSES = exports.SUCCESS_STATUSES = exports.TERMINAL_STATUSES = exports.PayoutStatus = void 0;
var PayoutStatus;
(function (PayoutStatus) {
    PayoutStatus["PENDING"] = "PENDING";
    PayoutStatus["PROCESSING"] = "PROCESSING";
    PayoutStatus["DELIVERED"] = "DELIVERED";
    PayoutStatus["FAILED"] = "FAILED";
    PayoutStatus["FLAGGED"] = "FLAGGED";
})(PayoutStatus || (exports.PayoutStatus = PayoutStatus = {}));
exports.TERMINAL_STATUSES = [
    PayoutStatus.DELIVERED,
    PayoutStatus.FLAGGED,
];
exports.SUCCESS_STATUSES = [
    PayoutStatus.DELIVERED,
];
exports.RETRYABLE_STATUSES = [
    PayoutStatus.FAILED,
];
exports.PAYOUT_STATUS_LABELS = {
    [PayoutStatus.PENDING]: 'Pending',
    [PayoutStatus.PROCESSING]: 'Processing',
    [PayoutStatus.DELIVERED]: 'Delivered',
    [PayoutStatus.FAILED]: 'Failed',
    [PayoutStatus.FLAGGED]: 'Under Review',
};
exports.PAYOUT_STATUS_COLORS = {
    [PayoutStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PayoutStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
    [PayoutStatus.DELIVERED]: 'bg-green-100 text-green-800',
    [PayoutStatus.FAILED]: 'bg-red-100 text-red-800',
    [PayoutStatus.FLAGGED]: 'bg-orange-100 text-orange-800',
};
//# sourceMappingURL=payout-status.js.map