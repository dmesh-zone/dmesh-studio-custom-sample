import { AppContextType } from '../../dmesh-studio/frontend/src/contexts/AppContext';

function getTimeString() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

const demoPlugin = {
    onReload: (context: AppContextType) => {
        window.dispatchEvent(new CustomEvent('show-notification', {
            detail: {
                message: `onReload sample plugin executed [${getTimeString()}]`,
                duration: 2000
            }
        }));
    },
    onTimer: [
        {
            intervalMs: 10000,
            callback: (context: AppContextType) => {
                window.dispatchEvent(new CustomEvent('show-notification', {
                    detail: {
                        message: `onTimer custom plugin executed [${getTimeString()}]`,
                        duration: 2000
                    }
                }));
            }
        }
    ]
};

export default demoPlugin;
