import { APP_CONFIG } from '@/constants';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { getGlobalState } from '@/utils/getGlobal';

import type { OnboardingStep } from '@/interface/auth';
import type { ClientState, Locale } from '@/interface/user';

const ONBOARDING_STEP_KEY = 'ONBOARDING_STEP';

const initialState: ClientState = {
    ...getGlobalState(),
    noticeCount: 0,
    locale: (localStorage.getItem('locale')! || 'vi_VN') as Locale,
    logged: localStorage.getItem(APP_CONFIG.ACCESS_TOKEN) ? true : false,
    onboardingStep: (localStorage.getItem(ONBOARDING_STEP_KEY) as OnboardingStep) || null,
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
