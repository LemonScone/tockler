'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');

const log = require('electron-log');
const Sentry = require('@sentry/electron');

//* electron 저장소 생성
const config = new Store();

console.log('preloadStuff.js start !!!');
if (process.env.NODE_ENV === 'production') {
    //* 클라이언트 에러 로그 트래킹 (https://Sentry.io 에서 발급받은 DSN키가 필요함)
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: version,
        beforeSend(event) {
            //* 에러가 발생하면 Sentry로 넘기기 전에 따로 처리
            // Check if it is an exception, if so, show the report dialog
            if (event.exception) {
                Sentry.showReportDialog();
            }
            return event;
        },
    });
}

//* log.transports.console : Just prints a log message to application console (main process) or to DevTools console (renderer process).
const origConsole = log.transports.console;

const isError = function (e) {
    return e && e.stack && e.message;
};

const cachedErrors = {};

const sentryTransportConsole = (msgObj) => {
    const { level, data, date } = msgObj;
    const [message, ...rest] = data;

    if (!cachedErrors[message]) {
        cachedErrors[message] = true;

        Sentry.withScope((scope) => {
            scope.setExtra('data', rest);
            scope.setExtra('date', msgObj.date.toLocaleTimeString());
            scope.setLevel(level);
            if (isError(message)) {
                Sentry.captureException(message);
            } else if (level === 'debug') {
                // ignore debug for now
            } else {
                Sentry.captureMessage(message);
            }
        });
    }

    origConsole(msgObj);
};

log.transports.console = sentryTransportConsole;

const isProd = false;
log.transports.console.level = isProd ? 'warn' : 'debug';

const IS_LOGGING_ENABLED = 'isLoggingEnabled';
let isLoggingEnabled = config.get(IS_LOGGING_ENABLED);

if (isLoggingEnabled) {
    log.transports.file.level = 'debug';
} else {
    log.transports.file.level = false;
}

const listeners = {};

//* renderer에서 사용할 API 설정
//* BrowserWindow 인스턴스를 생성할 때 contextIsolation: true 설정하면 컨텍스트가 분리되므로 웹에서 main으로 접근할 수가 없음
//* renderer에서는 window.configGet, window.onIpc와 같이 불러와서 사용
contextBridge.exposeInMainWorld('electronBridge', {
    configGet: (key) => {
        return config.get(key);
    },
    configSet: (key, value) => {
        return config.set(key, value);
    },
    logger: log,
    platform: process.platform,
    isMas: process.mas === true,

    invokeIpc: async (actionName, payload) => {
        return await ipcRenderer.invoke(actionName, payload);
    },
    sendIpc: (key, ...args) => {
        //* main process 호출
        log.debug('Send message with key: ' + key, args);
        ipcRenderer.send(key, ...args);
    },
    onIpc: (key, fn) => {
        const saferFn = (event, ...args) => fn(...args);
        // Deliberately strip event as it includes `sender`
        log.debug('Add listener with key: ' + key);
        //* main process의 회신 처리
        ipcRenderer.on(key, saferFn);
        listeners[key] = saferFn;
    },
    removeListenerIpc: (key) => {
        log.debug('Remove listener with key: ' + key);
        const fn = listeners[key];
        ipcRenderer.removeListener(key, fn);
        delete listeners[key];
    },
});

window.Sentry = Sentry;
