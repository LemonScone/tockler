import React, { useEffect, useCallback } from 'react';
import { Route, Switch } from 'react-router-dom';
import { RootProvider } from './RootContext';
import { NotFound } from './routes/404';
import { MainAppPage } from './routes/MainAppPage';
import { TrayAppPage } from './routes/TrayAppPage';
import moment from 'moment';
import 'moment/min/locales';
import { EventEmitter } from './services/EventEmitter';
import { Logger } from './logger';
import { ChartThemeProvider } from './routes/ChartThemeProvider';
import { useGoogleAnalytics } from './useGoogleAnalytics';
import { useColorMode } from '@chakra-ui/react';
import { TrayPage } from './routes/TrayPage';

moment.locale('en-gb');

export function MainRouter() {
    useGoogleAnalytics();
    const { setColorMode } = useColorMode();

    //? toggleColorMode를 사용하면 안되는지?
    //? light/dark 테마가 바뀔때마다 호출
    const changeActiveTheme = useCallback(
        themeName => {
            setColorMode(themeName);
        },
        [setColorMode],
    );

    useEffect(() => {
        EventEmitter.on('activeThemeChanged', changeActiveTheme);

        return () => {
            Logger.debug('Clearing eventEmitter');
            EventEmitter.off('activeThemeChanged', changeActiveTheme);
        };
    }, [changeActiveTheme]); // eslint-disable-line react-hooks/exhaustive-deps

    //? ChartThemeProvider
    //? RootProvider
    //* Switch : 여러 Route를 감싸서 그 중 일치하는 라우터 하나만 렌더링 (react-router-dom v.6부터는 Routes로 바뀜)
    return (
        <ChartThemeProvider>
            <RootProvider>
                <Switch>
                    <Route path="/" exact component={MainAppPage} />
                    <Route path="/app" component={MainAppPage} />
                    <Route path="/trayApp" component={TrayAppPage} />
                    <Route path="/trayPage" component={TrayPage} />
                    <Route path="*" component={NotFound} />
                </Switch>
            </RootProvider>
        </ChartThemeProvider>
    );
}
