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