import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import checker from 'vite-plugin-checker';
// import imp from 'vite-plugin-imp';
import svgrPlugin from 'vite-plugin-svgr';

// import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    return {
        resolve: {
            alias: {
                '@': path.join(__dirname, 'src'),
                '@core': path.join(__dirname, 'src/core'),
                '@pages': path.join(__dirname, 'src/pages'),
                '@components': path.join(__dirname, 'src/components'),
                '@stores': path.join(__dirname, 'src/stores'),
                '@hooks': path.join(__dirname, 'src/hooks'),
                '@utils': path.join(__dirname, 'src/utils'),
                '@config': path.join(__dirname, 'src/config'),
                '@assets': path.join(__dirname, 'src/assets'),
                '@routes': path.join(__dirname, 'src/routes'),
                '@constants': path.join(__dirname, 'src/constants'),
                '@interface': path.join(__dirname, 'src/interface'),
                '@workers': path.join(__dirname, 'src/workers'),
                '@signalR': path.join(__dirname, 'src/signalR'),
            },
        },
        server: {
            port: 8889,
            open: env.VITE_MODE === 'development',
            proxy: {
                '/api': {
                    target: `http://localhost:${env.PORT}/api`,
                    // changeOrigin: true,
                    rewrite: path => path.replace(/^\/api/, ''),
                },
            },
        },
        plugins: [
            splitVendorChunkPlugin(),
            react({
                jsxImportSource: '@emotion/react',
            }),
            svgrPlugin({
                svgrOptions: {
                    icon: true,
                    // ...svgr options (https://react-svgr.com/docs/options/)
                },
            }),
            checker({
                typescript: true,
            }),
            // imp({
            //     libList: [
            //         {
            //             libName: 'antd',
            //             style: name => name !== 'theme' && `antd/es/${name}/style`,
            //         },
            //         // {
            //         //     libName: 'antd',
            //         //     libDirectory: 'es',
            //         //     style: () => 'time-picker/style',
            //         //     camel2DashComponentName: false,
            //         // },
            //     ],
            // }),
            // visualizer({
            //     template: 'sunburst', // or sunburst
            //     open: true,
            // }) as PluginOption,
        ],
        build: {
            cssCodeSplit: false,
            chunkSizeWarningLimit: 1200,
        },
        css: {
            preprocessorOptions: {
                less: {
                    modifyVars: {
                        hack: `true; @import (reference) "${path.resolve(__dirname, 'src/styles/index.less')}";`,
                    },
                    javascriptEnabled: true,
                },
            },
        },
    };
});
