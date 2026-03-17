import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import cx from 'classnames';

import ScrollToTopButton from 'components/scrollToTopButton';
import useInViewport from 'hooks/useInViewport';
import useUniqueId from 'hooks/useUniqueId';

export const ScrollableContext = createContext<{ id?: string }>({});

type Props = {
  onScrollToEnd?: () => void;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

const Scrollable: React.FC<Props> = ({ children, className, onScrollToEnd, ...props }) => {
  const footerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const id = useUniqueId('scrollable');
  const value = useMemo(
    () => ({
      id,
    }),
    [id],
  );

  useInViewport(footerRef, { onEnterViewport: onScrollToEnd });

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 300);
    }
  }, []);

  const handleScrollToTop = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className={cx('overflow-y-auto h-full', className)} {...props} id={id} ref={scrollRef} onScroll={handleScroll}>
      <ScrollableContext.Provider value={value}>{children}</ScrollableContext.Provider>
      {onScrollToEnd && <div className="h-40" ref={footerRef} />}
      <ScrollToTopButton visible={showScrollTop} onClick={handleScrollToTop} />
    </div>
  );
};

export default Scrollable;
