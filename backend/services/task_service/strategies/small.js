import BaseTaskStrategy from "./base.js";

/**
 * SmallBusinessStrategy
 * Strict limits, simple RBAC workflows where members cannot create tasks.
 */
export default class SmallBusinessStrategy extends BaseTaskStrategy {
    constructor(db, type) {
        super(db, type);
    }

    getTaskQuotas() {
        return {
            maxActiveTasks: 200,
            requireApprovalsForRequests: false,
            allowBulkOperations: false
        };
    }

    async validateTaskCreation({ membership }) {
        if (!membership) return { allowed: false, reason: "Membership context required" };

        // Strict Policy: Members can only execute, not create.
        if (membership.role === 'member') {
            return { allowed: false, reason: "In a Small Workspace, members can only execute tasks." };
        }

        return { allowed: true };
    }
}