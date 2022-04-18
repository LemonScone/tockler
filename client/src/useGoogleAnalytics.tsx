import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga';

export function useGoogleAnalytics() {
    //* useLocation : 현재 페이지의 주소의 정보를 가져옴
    //* hash : # 문자 뒤의 값
    //* pathname : 현재 주소 uri
    //* search : 쿼리스트링 (?를 포함)
    const location = useLocation();

    //* 페이지가 이동할 때마다(=uri가 바뀔 때마다) GA로 현재 URL와 view 정보를 전달하기 위해 useEffect 사용
    useEffect(() => {
        console.log('Setting page', location.pathname);
        //* location 값이 바뀔 때마다 지금의 location.pathname을 GA로 전송
        ReactGA.set({ path: location.pathname, search: location.search }); // Update the user's current page
        //* 사용자가 어떤 화면을 보고 있는지 추적
        ReactGA.pageview(location.pathname); // Record a pageview for the given page
    }, [location]);
}
