// Strategy 1: Basic Counter App
export const basicCounterStrategy = {
    channelName: 'basic-counter',
    whitelist: ['counter/setIncrement', 'counter/setDecrement']
};

// Strategy 2: Sync Everything
export const syncEverythingStrategy = {
    channelName: 'sync-all'
    // No whitelist = sync all actions
};

// Strategy 3: No Sync (Local Only)
export const noSyncStrategy = {
    channelName: 'no-sync',
    whitelist: [] // Empty whitelist = nothing syncs
};

// Export all strategies for easy access
export const strategies = {
    basicCounter: basicCounterStrategy,
    syncEverything: syncEverythingStrategy,
    noSync: noSyncStrategy
};

// Helper function to get strategy by name
export const getStrategy = (strategyName) => {
    return strategies[strategyName] || strategies.basicCounter;
};
