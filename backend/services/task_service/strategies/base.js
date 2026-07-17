/**
 * BaseTaskStrategy - The core contract for all workspace types.
 * Enforces strict implementation of quota and validation rules.
 */
export default class BaseTaskStrategy {
    constructor(db, businessType) {
        this.db = db;
        this.businessType = businessType || 'small_business';
    }

    /**
     * @returns {Object} Quota configuration
     */
    getTaskQuotas() {
        throw new Error("Method 'getTaskQuotas' must be implemented by subclasses.");
    }

    /**
     * @param {Object} params - { workspaceId, taskData, membership }
     * @returns {Promise<Object>} - { allowed: boolean, reason?: string, mutatedData?: Object }
     */
    async validateTaskCreation(params) {
        throw new Error("Method 'validateTaskCreation' must be implemented by subclasses.");
    }
}