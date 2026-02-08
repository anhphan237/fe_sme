import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { UserProfileInfo } from '@/interface/user';

interface State {
    theme: 'light' | 'dark';
    loading: boolean;
    roles: string[];
    permissions: string[];
    userProfileInfo: UserProfileInfo;
    breadCrumbs: { [key: string]: string };
}

// const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
// const userTheme = localStorage.getItem('theme') as State['theme'];

const initialState: State = {
    // theme: userTheme || systemTheme,
    theme: 'light',
    loading: false,
    roles: [],
    permissions: [],
    userProfileInfo: {
        phoneNumberConfirmed: false,
        emailConfirmed: false,
        isLocked: false,
        roles: [],
        id: '',
        username: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        created: '',
        lastModified: '',
        code: '',
    },
    breadCrumbs: {},
};

const globalSlice = createSlice({
    name: 'global',
    initialState,
    reducers: {
        setGlobalState(state, action: PayloadAction<Partial<State>>) {
            Object.assign(state, action.payload);

            if (action.payload.theme) {
                const body = document.body;

                if (action.payload.theme === 'dark') {
                    if (!body.hasAttribute('theme-mode')) {
                        body.setAttribute('theme-mode', 'light'); // Always light mode
                    }
                } else {
                    if (body.hasAttribute('theme-mode')) {
                        body.removeAttribute('theme-mode');
                    }
                }
            }
        },
        setBreadCrumbs(state, action: PayloadAction<{ [key in string]: string }>) {
            const clonedState = { ...state };
            clonedState.breadCrumbs = {
                ...state.breadCrumbs,
                ...action.payload,
            };
            return clonedState;
        },
    },
});

export const { setGlobalState, setBreadCrumbs } = globalSlice.actions;

export default globalSlice.reducer;
