import SmallBusinessStrategy from "./small.js";
import EnterpriseStrategy from "./enterprise.js";

/**
 * WorkspaceFactory
 * Dynamically resolves and caches the correct strategy at runtime.
 */
export default class WorkspaceFactory {
    static _cache = {};

    /**
     * @param {string} businessType 
     * @param {Object} db - Database instance (e.g., Prisma)
     * @returns {BaseTaskStrategy}
     */
    static getStrategy(businessType, db) {
        const type = businessType || 'small_business';

        // Return cached instance if it exists to save memory
        if (this._cache[type]) {
            return this._cache[type];
        }

        // Initialize and cache new strategy
        switch (type) {
            case 'enterprise':
                this._cache[type] = new EnterpriseStrategy(db, type);
                break;
            case 'small_business':
            default:
                this._cache[type] = new SmallBusinessStrategy(db, type);
        }

        return this._cache[type];
    }
}