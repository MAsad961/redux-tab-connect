import { BroadcastChannel } from 'broadcast-channel';
import { v4 as uuidv4 } from 'uuid';
import { Store, Middleware, UnknownAction } from 'redux';

export interface SyncAction extends UnknownAction {
    syncId?: string;
    tabId?: string;
    isSynced?: boolean;
    payload?: any;
    [key: string]: any;
}

export interface SyncStateConfig {
    channelName?: string;
    whitelist?: string[];
}

export interface StateRequestAction extends SyncAction {
    type: 'REQUEST_STATE';
}

export interface StateResponseAction extends SyncAction {
    type: 'RECEIVE_STATE';
    payload: any;
}

const tabId: string = uuidv4();

const REQUEST = 'REQUEST_STATE';
const RESPONSE = 'RECEIVE_STATE';
const REDUX_STATE_SYNCING = 'REDUX_STATE_SYNCING';

const channelCache = new Map<string, BroadcastChannel>();


const getChannel = (channelName: string): BroadcastChannel => {
    if (!channelCache.has(channelName)) {
        try {
            const channel = new BroadcastChannel(channelName);
            channelCache.set(channelName, channel);
        } catch (error) {
            console.error('[SyncState] Failed to create broadcast channel:', error);
            throw new Error(`Failed to create broadcast channel: ${error}`);
        }
    }
    return channelCache.get(channelName)!;
};

const createSyncStateMiddleware = (config: SyncStateConfig = {}): Middleware => {
    const { channelName, whitelist = undefined } = config;

    let channel: BroadcastChannel;
    try {
        channel = getChannel(channelName ?? REDUX_STATE_SYNCING);
    } catch (error) {
        console.error('[SyncState] Failed to initialize channel in middleware:', error);
        return store => next => action => next(action);
    }

    return store => next => action => {
        try {
            const typedAction = action as UnknownAction & Partial<SyncAction>;

            if (!typedAction || typeof typedAction !== 'object' || typeof typedAction.type !== 'string') {
                console.warn('[SyncState] Invalid action structure, skipping sync:', typedAction);
                return next(action);
            }

            if (typedAction.isSynced || typedAction.type.startsWith('@@')) {
                return next(action);
            }

            const shouldSync = whitelist === undefined || (whitelist && whitelist.length > 0 && whitelist.includes(typedAction.type));

            let result;
            try {
                result = next(action);
            } catch (error) {
                console.error('[SyncState] Error executing action locally:', error);
                throw error;
            }

            if (shouldSync) {
                try {
                    const syncedAction: SyncAction = {
                        ...typedAction,
                        syncId: uuidv4(),
                        tabId: tabId,
                        isSynced: true
                    };

                    channel.postMessage(syncedAction);
                } catch (error) {
                    console.error('[SyncState] Failed to broadcast action:', error);
                }
            }

            return result;
        } catch (error) {
            console.error('[SyncState] Middleware error:', error);
            return next(action);
        }
    };
};

const initSyncStateListener = (store: Store, channelName?: string): void => {
    if (!store || typeof store.dispatch !== 'function' || typeof store.getState !== 'function') {
        console.error('[SyncState] Invalid store provided to listener');
        return;
    }

    let channel: BroadcastChannel;
    try {
        channel = getChannel(channelName ?? REDUX_STATE_SYNCING);
    } catch (error) {
        console.error('[SyncState] Failed to initialize channel in listener:', error);
        return;
    }

    channel.onmessage = (action: SyncAction) => {
        try {
            if (!action || typeof action !== 'object' || typeof action.type !== 'string') {
                console.warn('[SyncState] Received invalid action, ignoring:', action);
                return;
            }

            if (action.type === REQUEST && action.tabId !== tabId) {
                try {
                    const state = store.getState();

                    if (state !== undefined && state !== null && typeof state === 'object') {
                        const responseAction = {
                            type: RESPONSE,
                            payload: state,
                            syncId: uuidv4(),
                            tabId: tabId,
                            isSynced: true
                        } as StateResponseAction;

                        try {
                            channel.postMessage(responseAction);
                        } catch (error) {
                            console.error('[SyncState] Failed to send state response:', error);
                        }
                    } else {
                        console.log('[SyncState] No valid state to send');
                    }
                } catch (error) {
                    console.error('[SyncState] Error getting state for response:', error);
                }
            }
            else if (action.type === RESPONSE && action.tabId !== tabId) {
                if (action.payload !== undefined && action.payload !== null && typeof action.payload === 'object') {
                    try {
                        store.dispatch({
                            type: '@@SYNC_STATE_REPLACE',
                            payload: action.payload.counter,
                            isSynced: true,
                            tabId: tabId
                        });
                    } catch (error) {
                        console.error('[SyncState] Error dispatching state update:', error);
                    }
                } else {
                    console.log('[SyncState] Skipping state update - invalid payload:', action.payload);
                }
            }
            else if (action.isSynced && action.tabId !== tabId && action.type !== REQUEST && action.type !== RESPONSE && !action.type.startsWith('@@')) {
                try {
                    store.dispatch(action);
                } catch (error) {
                    console.error('[SyncState] Error dispatching synced action:', error);
                }
            }
            else {
                console.log('[SyncState] Ignoring message:', {
                    reason: action.tabId === tabId ? 'same tab' : 'not synced or system action',
                    actionTabId: action.tabId,
                    currentTabId: tabId,
                    isSynced: action.isSynced,
                    actionType: action.type
                });
            }
        } catch (error) {
            console.error('[SyncState] Error in message handler:', error);
        }
    };

    setTimeout(() => {
        try {
            const requestAction = {
                type: REQUEST,
                syncId: uuidv4(),
                tabId: tabId,
                isSynced: true
            } as StateRequestAction;

            channel.postMessage(requestAction);

        } catch (error) {
            console.error('[SyncState] Error during initial state request:', error);
        }
    }, 100);
};


const syncStateReducer = <T>(reducer: (state: T | undefined, action: UnknownAction) => T) =>
    (state: T | undefined, action: SyncAction): T => {
        try {
            if (action.type === '@@SYNC_STATE_REPLACE' && action.payload !== undefined && action.payload !== null) {
                return action.payload;
            }

            const result = reducer(state, action);
            return result;
        } catch (error) {
            console.error('[SyncState] Error in syncStateReducer:', error);

            if (state !== undefined && state !== null) {
                return state;
            }
        }

        try {
            return reducer(undefined, action);
        } catch (fallbackError) {
            console.error('[SyncState] Fallback reducer also failed:', fallbackError);
            throw fallbackError;
        }
    }

export { createSyncStateMiddleware, initSyncStateListener, syncStateReducer };
