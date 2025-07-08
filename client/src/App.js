import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './redux/store';
import {
  setIncrement,
  setDecrement,
  setReset,
} from './redux/counterSlice';

const App = () => {
  const { count } = useSelector(state => state.counter);
  const dispatch = useDispatch();

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', margin: '10px', borderRadius: '5px' }}>
      {/* Current State Display */}
      <p><strong>Count:</strong> {count}</p>

      {/* Basic Operations */}
      <div style={{ border: '1px solid #ccc', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h3>Basic Operations</h3>
        <button onClick={() => dispatch(setIncrement())} style={{ margin: '5px' }}>
          Increment (+1)
        </button>
        <button onClick={() => dispatch(setDecrement())} style={{ margin: '5px' }}>
          Decrement (-1)
        </button>
        <button onClick={() => dispatch(setReset())} style={{ margin: '5px', background: '#ff6b6b', color: 'white' }}>
          Reset to 0
        </button>
      </div>
    </div>
  );
};

export default () => (
  <Provider store={store}>
    <App />
  </Provider>
);