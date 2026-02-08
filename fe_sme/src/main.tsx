import moment from 'moment';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App';
import { QueryProvider } from './QueryProvider';
import './index.css';
import store from './stores';
import './styles/index.less';

import '@xyflow/react/dist/style.css';

moment.updateLocale('en', {
    week: {
        dow: 1, // Monday is the first day of the week
    },
});

const container = document.getElementById('root');

if (container) {
    const root = createRoot(container);
    root.render(
        <QueryProvider>
            <Provider store={store}>
                <App />
            </Provider>
        </QueryProvider>,
    );
}
