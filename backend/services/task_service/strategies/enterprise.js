import BaseTaskStrategy from "./base.js";

/**
 * EnterpriseStrategy
 * Massive scale quotas, hierarchical workflows, and UX-focused data mutations.
 */
export default class EnterpriseStrategy extends BaseTaskStrategy {
    constructor(db, type) {
        super(db, type);
    }

    getTaskQuotas() {
        return {
            maxActiveTasks: 50000,
            requireApprovalsForRequests: false,
            allowBulkOperations: true
        };
    }

    async validateTaskCreation({ membership }) {
        if (!membership) return { allowed: false, reason: "Membership context required" };

        // Enterprise UX: Don't block the user. Intercept and push to 'proposed' pipeline.
        if (membership.role === 'member') {
            return {
                allowed: true,
                mutatedData: { status: 'proposed' } // Data mutation happens here
            };
        }

        return { allowed: true };
    }
}