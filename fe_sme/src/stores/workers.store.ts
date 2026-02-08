import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { UserProfileInfo } from '@/interface/user';

interface State {
    importWorker: Worker | null;
    exportWorker: Worker | null;
}

const initialState: State = {
    importWorker: null,
    exportWorker: null,
};

const workerSlice = createSlice({
    name: 'workers',
    initialState,
    reducers: {
        registerImportWorker(state, action: PayloadAction<Worker>) {
            state.importWorker = action.payload;
        },
        registerExportWorker(state, action: PayloadAction<Worker>) {
            state.exportWorker = action.payload;
        },
    },
});

export const { registerImportWorker, registerExportWorker } = workerSlice.actions;

export default workerSlice.reducer;
