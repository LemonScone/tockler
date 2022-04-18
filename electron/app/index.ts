// override path, to fix asar.unpacked paths
require('hazardous');
require('events').EventEmitter.defaultMaxListeners = 30;

import { backgroundJob } from './background-job';
import { backgroundService } from './background-service';
import { app, ipcMain, powerMonitor } from 'electron';
import { logManager } from './log-manager';
import AppManager from './app-manager';
import WindowManager, { sendToMainWindow } from './window-manager';
import { extensionsManager } from './extensions-manager';
import AppUpdater from './app-updater';
import config from './config';
import * as path from 'path';
import { Deeplink } from 'electron-deeplink';

const UrlParse = require('url-parse');

let logger = logManager.getLogger('AppIndex');
app.setAppUserModelId(process.execPath);
/*
if (config.isDev) {
    try {
        logger.info('Loading Reloader');
        require('electron-reloader')(module);
    } catch {}
}*/

/* Single Instance Check */

logger.debug('index.ts start !!!');

const isMas = process.mas === true;

//* 앱을 여러번 실행시켜도 하나의 창만 실행되도록 설정
const gotTheLock = app.requestSingleInstanceLock();

if (gotTheLock || isMas) {
    const protocol = 'tockler';
    const deeplink = new Deeplink({ app, mainWindow: WindowManager.mainWindow, protocol });

    //* 두번째 창이 호출된 경우
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        logger.debug('Make single instance');
        WindowManager.openMainWindow();
    });

    //* 버전 업데이트 확인
    AppUpdater.init();

    app.commandLine.appendSwitch('disable-renderer-backgrounding');

    require('electron-context-menu')({});

    ipcMain.on('close-app', function () {
        logger.info('Closing Tockler');
        app.quit();
    });

    app.on('will-quit', async () => {
        logger.debug('will-quit');
        await AppManager.destroy();
    });
    app.on('window-all-closed', function () {
        logger.debug('window-all-closed');
        // app.quit();
    });

    // User want's to open main window when reopened app. (But not open main window on application launch)

    app.on('activate', function () {
        logger.debug('Activate event');
        if (app.isReady()) {
            WindowManager.openMainWindow();
        } else {
            logger.debug('App is not ready in activate event');
        }
    });

    // NOTE 시작점
    app.on('ready', async () => {
        logger.debug('app ready start !!!');
        try {
            if (config.isDev) {
                await extensionsManager.init();
            }

            WindowManager.initMainWindowEvents();

            if (!config.isDev || config.trayEnabledInDev) {
                WindowManager.setTrayWindow();
            }

            await AppManager.init();

            backgroundJob.init();

            //* 시스템이 절전모드로 진입할 때 발생
            powerMonitor.on('suspend', function () {
                logger.debug('The system is going to sleep');
                backgroundService.onSleep();
            });

            //* 시스템의 절전 모드가 해제될 때 발생
            powerMonitor.on('resume', function () {
                logger.debug('The system is going to resume');
                backgroundService.onResume().then(
                    () => logger.debug('Resumed'),
                    (e) => logger.error('Error in onResume', e),
                );
            });
        } catch (error) {
            logger.error(`App errored in ready event: ${error.toString()}`, error);
        }
    });

    //* 딥링크로 앱이 열린 경우
    deeplink.on('received', (url) => {
        logger.debug(`Got app link (tockler://open or tockler://login), opening main window. Arrived from  ${url}`);
        const urlParsed = new UrlParse(url, false);

        if (urlParsed.host === 'login') {
            WindowManager.openMainWindow();
            sendToMainWindow('event-login-url', urlParsed.query);
            logger.debug('event-login-url sent', urlParsed.query);
            return;
        }

        WindowManager.openMainWindow();
    });
} else {
    logger.debug('Quiting instance.');
    app.quit();
}
