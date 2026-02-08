/** @type {import('tailwindcss').Config} */
const { localise } = require('./localisation.tailwind.plugin');
module.exports = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                colorPrimary: '#3684DB',
                colorLink: '#3684DB',
                colorSuccess: '#4CAF50',
                colorWarning: '#FFC107',
                colorError: '#FF6F61',
                colorTextHeading: '#031930',
                colorText: '#223A59',
                colorTextSecondary: '#758BA5',
                borderRadiusLG: '4px',
                borderRadiusSM: '8px',
                borderRadiusXS: '12px',
                colorBorder: '#B3D6F9',
                colorBorderBg: '#D1DDED',
                colorBgLayout: '#FFFFFF',
                colorBgBase: '#FFFFFF',
                colorBgContainer: '#FFFFFF',
            },
            screens: {
                xs: { raw: '(max-width: 575px)' },
            },
        },
    },
    plugins: [localise()],
};
