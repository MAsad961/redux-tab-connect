import { configureStore } from '@reduxjs/toolkit';
import { createSyncStateMiddleware, initSyncStateListener, syncStateReducer } from 'redux-tab-connect';

import counterReducer from './counterSlice';
import { getStrategy } from '../config/syncStrategies';

// Different configuration strategies:
const basicCounterStrategy = getStrategy('basicCounter');
const noSyncStrategy = getStrategy('noSync');
const syncEverythingStrategy = getStrategy('syncEverything');

const config = basicCounterStrategy;
// const config = noSyncStrategy;
// const config = syncEverythingStrategy;

// For single channel setup
const wrappedReducer = syncStateReducer(counterReducer);
const middleware = createSyncStateMiddleware(config);

const store = configureStore({
    reducer: {
        counter: wrappedReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(middleware),
});

initSyncStateListener(store, config.channelName);


export default store;