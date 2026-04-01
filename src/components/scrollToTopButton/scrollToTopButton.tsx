import { useCallback } from 'react';
import cx from 'classnames';

import Button from 'components/button';

type Props = {
  visible: boolean;
  onClick: () => void;
};

const ScrollToTopButton: React.FC<Props> = ({ visible, onClick }) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <div
      className={cx(
        'fixed bottom-8 right-8 z-101 transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      <Button
        icon="arrow_upward"
        iconOnly
        onClick={handleClick}
        spotlightDisabled
        className="bg-black bg-opacity-70 rounded-full p-4 text-white shadow-xl hover:text-red-500 hover:bg-gray-800 transition-colors"
      />
    </div>
  );
};

export default ScrollToTopButton;
