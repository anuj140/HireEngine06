import { useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = ReactRouterDom.useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
