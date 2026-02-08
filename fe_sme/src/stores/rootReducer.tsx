import { combineReducers } from '@reduxjs/toolkit';

import globalReducer from './global.store';
import userReducer from './user.store';
import workerSlice from './workers.store';

const rootReducer = combineReducers({
    user: userReducer,
    global: globalReducer,
    worker: workerSlice
});

export default rootReducer;
