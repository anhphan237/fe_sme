import type { ClientState, Locale } from '@/interface/user';
import type { PayloadAction } from '@reduxjs/toolkit';

import { createSlice } from '@reduxjs/toolkit';

import { APP_CONFIG } from '@/constants';
import { getGlobalState } from '@/utils/getGlobal';

const initialState: ClientState = {
    ...getGlobalState(),
    noticeCount: 0,
    locale: (localStorage.getItem('locale')! || 'vi_VN') as Locale,
    logged: localStorage.getItem(APP_CONFIG.ACCESS_TOKEN) ? true : false,
    menuList: [],
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<Partial<ClientState>>) {
            Object.assign(state, action.payload);
        },
    },
});

export const { setUser } = userSlice.actions;

export default userSlice.reducer;
