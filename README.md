# redux-tab-connect

> 🔄 A lightweight Redux middleware to sync state across browser tabs using BroadcastChannel API

[![npm version](https://badge.fury.io/js/redux-tab-connect.svg)](https://badge.fury.io/js/redux-tab-connect)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Seamlessly synchronize your Redux state across multiple browser tabs in real-time. Perfect for creating consistent user experiences in multi-tab applications.

## ✨ Features

- 🚀 **Real-time sync** across multiple browser tabs
- 🎯 **Selective syncing** with whitelist support  
- 📡 **Multiple sync strategies** for different use cases
- 🛡️ **TypeScript support** with full type definitions
- 🔧 **Zero config** - works out of the box
- ⚡ **Lightweight** - minimal performance impact
- 🔄 **Auto state recovery** for new tabs
- 🛠️ **Error handling** with graceful degradation

## 📦 Installation

### Using npm
```bash
npm install redux-tab-connect
```

### Using yarn
```bash
yarn add redux-tab-connect
```

### Using pnpm
```bash
pnpm add redux-tab-connect
```

> **✅ Package Manager Support:** This package is fully compatible with all major package managers (npm, yarn, pnpm). It uses standard CommonJS and ES modules without any package-manager-specific dependencies.

## 🚀 Quick Start (3 Steps)

### 1. Setup Redux Store

```javascript
// store.js
import { configureStore } from '@reduxjs/toolkit';
import { createSyncStateMiddleware, initSyncStateListener, syncStateReducer } from 'redux-tab-connect';
import counterReducer from './counterSlice';

// Wrap your reducer
const wrappedReducer = syncStateReducer(counterReducer);

// Create sync middleware  
const middleware = createSyncStateMiddleware({
    channelName: 'my-app-sync',
    whitelist: ['counter/setIncrement', 'counter/setDecrement', 'counter/setReset']
});

// Configure store
const store = configureStore({
    reducer: {
        counter: wrappedReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(middleware),
});

// Initialize sync listener
initSyncStateListener(store, 'my-app-sync');

export default store;
```

### 2. Create Your Slice

```javascript
// counterSlice.js
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
    name: 'counter',
    initialState: {
        count: 0,
    },
    reducers: {
        setIncrement: (state) => {
            state.count += 1;
        },
        setDecrement: (state) => {
            state.count -= 1;
        },
        setReset: (state) => {
            state.count = 0;
        },
    }
});

export const { setIncrement, setDecrement, setReset } = counterSlice.actions;
export default counterSlice.reducer;
```

### 3. Use in React Component

```javascript
// App.js
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './redux/store';
import { setIncrement, setDecrement, setReset } from './redux/counterSlice';

const App = () => {
    const { count } = useSelector(state => state.counter);
    const dispatch = useDispatch();

    return (
        <div style={{ padding: '20px' }}>
            <h2>Count: {count}</h2>
            
            <button onClick={() => dispatch(setIncrement())}>
                Increment (+1)
            </button>
            <button onClick={() => dispatch(setDecrement())}>
                Decrement (-1)
            </button>
            <button onClick={() => dispatch(setReset())}>
                Reset to 0
            </button>
            
            <p>✨ Open this app in multiple tabs to see real-time sync!</p>
        </div>
    );
};

export default () => (
    <Provider store={store}>
        <App />
    </Provider>
);
```

**That's it!** 🎉 Open your app in multiple tabs and watch the state sync automatically!

## ⚙️ Sync Strategies

### Strategy 1: Basic Counter Sync (Recommended for Testing)
```javascript
const basicCounterStrategy = {
    channelName: 'basic-counter',
    whitelist: ['counter/setIncrement', 'counter/setDecrement']
};
```

### Strategy 2: Sync Everything (Good for Development)
```javascript
const syncEverythingStrategy = {
    channelName: 'sync-all'
    // No whitelist = sync all actions
};
```

### Strategy 3: No Sync (Local Only)
```javascript
const noSyncStrategy = {
    channelName: 'no-sync',
    whitelist: [] // Empty whitelist = nothing syncs
};
```

### Dynamic Strategy Selection
```javascript
// syncStrategies.js
export const strategies = {
    basicCounter: {
        channelName: 'basic-counter',
        whitelist: ['counter/setIncrement', 'counter/setDecrement']
    },
    syncEverything: {
        channelName: 'sync-all'
    },
    noSync: {
        channelName: 'no-sync',
        whitelist: []
    }
};

export const getStrategy = (strategyName) => {
    return strategies[strategyName] || strategies.basicCounter;
};

// In your store.js
import { getStrategy } from './config/syncStrategies';

const config = getStrategy('basicCounter'); // Easy switching!
```

## 🎯 Real-World Examples

### E-commerce Shopping Cart
```javascript
const ecommerceConfig = {
    channelName: 'ecommerce-sync',
    whitelist: [
        'cart/addItem',
        'cart/removeItem', 
        'cart/updateQuantity',
        'user/login',
        'user/logout'
    ]
};
```

### Multi-tab Dashboard
```javascript
const dashboardConfig = {
    channelName: 'dashboard-sync',
    whitelist: [
        'filters/apply',
        'widgets/add',
        'widgets/remove',
        'settings/update'
    ]
};
```

### Chat Application
```javascript
const chatConfig = {
    channelName: 'chat-sync',
    whitelist: [
        'messages/receive',
        'users/statusUpdate',
        'notifications/add'
    ]
};
```

## 📚 API Reference

### `createSyncStateMiddleware(config?)`

Creates Redux middleware for syncing actions across tabs.

```typescript
interface SyncStateConfig {
    channelName?: string;    // Custom channel name
    whitelist?: string[];    // Action types to sync
}
```

**Parameters:**
- `config` (optional): Configuration object
  - `channelName`: Custom broadcast channel name (default: 'REDUX_STATE_SYNCING')
  - `whitelist`: Array of action types to sync. If undefined, syncs all actions. If empty array, syncs nothing.

### `initSyncStateListener(store, channelName?)`

Initializes the broadcast channel listener for receiving actions from other tabs.

**Parameters:**
- `store`: Redux store instance
- `channelName`: Optional channel name (must match middleware config)

### `syncStateReducer(reducer)`

Higher-order reducer that wraps your existing reducer to handle state synchronization.

**Parameters:**
- `reducer`: Your original reducer function

**Returns:** Enhanced reducer with sync capabilities

## 🔧 Advanced Configuration

### Environment-based Setup
```javascript
const getConfig = () => {
    if (process.env.NODE_ENV === 'development') {
        return { channelName: 'dev-sync' }; // Sync everything in dev
    }
    
    return {
        channelName: 'prod-sync',
        whitelist: ['user/login', 'cart/update'] // Only essential actions in prod
    };
};
```

### Multiple Channels for Large Apps
```javascript
// User authentication channel
const userConfig = {
    channelName: 'user-sync',
    whitelist: ['user/login', 'user/logout', 'user/updateProfile']
};

// Shopping cart channel  
const cartConfig = {
    channelName: 'cart-sync',
    whitelist: ['cart/addItem', 'cart/removeItem', 'cart/updateQuantity']
};

const store = configureStore({
    reducer: {
        user: syncStateReducer(userReducer),
        cart: syncStateReducer(cartReducer),
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(createSyncStateMiddleware(userConfig))
            .concat(createSyncStateMiddleware(cartConfig)),
});

// Initialize both listeners
initSyncStateListener(store, userConfig.channelName);
initSyncStateListener(store, cartConfig.channelName);
```

## 🎨 Use Cases

### ✅ Perfect For:
- **Shopping carts** - Keep items synced across tabs
- **User authentication** - Login/logout in all tabs simultaneously
- **Theme preferences** - Dark/light mode sync
- **Form drafts** - Auto-save progress across tabs
- **Dashboard filters** - Maintain consistent view state
- **Real-time notifications** - Show updates in all tabs
- **Multi-step workflows** - Continue where you left off

### ❌ Not Recommended For:
- **Large datasets** (>1MB) - Use server-side sync instead
- **High-frequency updates** (>100/sec) - May impact performance  
- **Sensitive data** - Consider security implications
- **Tab-specific UI state** - Modal open/close, scroll positions

## 🐛 Troubleshooting

### Actions not syncing between tabs?

1. **Check channel names match:**
   ```javascript
   const channelName = 'my-app-sync';
   createSyncStateMiddleware({ channelName });
   initSyncStateListener(store, channelName);
   ```

2. **Verify action types in whitelist:**
   ```javascript
   // ✅ Correct - include slice name
   whitelist: ['counter/setIncrement']
   
   // ❌ Wrong - missing slice name  
   whitelist: ['setIncrement']
   ```

3. **Check browser console for errors**

### Performance issues?

**Use selective sync:**
```javascript
// Instead of syncing everything
createSyncStateMiddleware()

// Sync only what you need
createSyncStateMiddleware({
    whitelist: ['user/login', 'cart/update']
})
```

### Browser compatibility?
- ✅ Chrome 54+
- ✅ Firefox 38+  
- ✅ Safari 10+
- ✅ Edge 79+
- ❌ Internet Explorer (not supported)

## 🔒 Security Considerations

- Data is shared locally between tabs of the same origin only
- No data leaves the user's browser
- Consider what state you sync (avoid sensitive data)
- Use HTTPS in production for additional security

## 📈 Performance Tips

1. **Use whitelists** to sync only necessary actions
2. **Separate channels** for different features  
3. **Avoid syncing** high-frequency actions (animations, scroll events)
4. **Test with multiple tabs** to ensure smooth performance

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

```bash
# Clone the repository
git clone https://github.com/your-username/redux-tab-connect.git

# Install dependencies
npm install

# Build the package
npm run build

# Test with the example client
cd client && npm start
```

## 📄 License

MIT © [Asad](https://github.com/your-username)

## 🙏 Support

If this package helped you:
- ⭐ Star it on [GitHub](https://github.com/your-username/redux-tab-connect)
- 🐛 Report issues or bugs
- 💡 Suggest new features
- 📝 Help improve documentation

---

**Made with ❤️ for the Redux community**

*Need help? [Open an issue](https://github.com/your-username/redux-tab-connect/issues)*
