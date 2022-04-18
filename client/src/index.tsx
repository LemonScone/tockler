import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';
import { MainRouter } from './MainRouter';
import { StoreProvider } from 'easy-peasy';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { mainStore } from './store/mainStore';
import '@fontsource/inter';
import { theme } from './theme/theme';
import ReactGA from 'react-ga';

const isDev = process.env.NODE_ENV !== 'production';

//const trackingId: string = process.env.REACT_APP_TRACKING_ID || '';
const trackingId = 'UA-131411801-1';

//* 구글 애널리틱스 설정
//* 개발 환경일때에만 debug 설정 - 콘솔에 로그 출력됨
ReactGA.initialize(trackingId, { debug: isDev });

// ? GA가 제공해주는 정보 이외에 확인하고 싶은 속성 추가
// ? GA 사이트에서 확인이 가능하나 언제 어디서 쓰는지 모르겠음..
ReactGA.set({
    appVersion: process.env.REACT_APP_VERSION,
    anonymizeIp: true,
    checkProtocolTask: null,
    checkStorageTask: null,
    historyImportTask: null,
});

//? chakra-ui(https://chakra-ui.com/docs/styled-system/features/color-mode#adding-the-colormodescript)
//! To use ColorModeScript on a site with strict Content-Security-Policy, you can use the nonce prop that will be passed to the <script> tag.
(window as any).CSPSettings = {
    nonce: 'nonce',
};

if (isDev) {
    console.info('Development!');
    // * why-did-you-render : 불필요한 리렌더링을 하는 컴포넌트를 추적하여 로그를 던져줌 (로그만 던져줌, 해결해주지는 않음)
    // * 추적할 컴포넌트는 컴포넌트의 whyDidYouRender 속성을 true로 주면 된다 (ex. TrayAppPageTemp.whyDidYouRender = true;);
    // ! The library should NEVER be used in production because it slows down React
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React);
}

//* ColorModeScript : light/dark 모드 지원, initialColorMode는 초기 테마값 전달
//* StoreProvider : 상태 관리 저장소를 전역에서 쓰기 위해 감싸줘야함
//* ChakraProvider : chakra-ui를 전역에서 쓰기 위해서 감싸줘야함, theme는 사용자 정의 테마값 전달
//* Router : HashRouter 사용
//* MainRouter : 앱에서 사용하는 라우팅 집합소 컴포넌트
ReactDOM.render(
    <>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <StoreProvider store={mainStore}>
            <ChakraProvider theme={theme}>
                <Router>
                    <MainRouter />
                </Router>
            </ChakraProvider>
        </StoreProvider>
    </>,
    document.getElementById('root') as HTMLElement,
);
