import { useCallback } from 'react';

import Button from 'components/button';
import Icon from 'components/icon';
import Text from 'components/text';
import useChangebleState from 'hooks/useChangebleState';
import useThrottledCallback from 'hooks/useThrottledCallback';

type Props = {
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
  open?: boolean;
  disabled?: boolean;
  onToggle?: (open: boolean) => void;
  after?: React.ReactNode;
};

const Accordion: React.FC<Props> = ({ open, onToggle, title, subtitle, className, children, disabled, after }) => {
  const [visible, setVisible] = useChangebleState(open);

  const handleClick = useCallback(() => {
    if (!disabled) {
      const newVisible = !visible;
      onToggle?.(newVisible);
      setVisible(newVisible);
    }
  }, [disabled, visible, setVisible, onToggle]);

  const handleClickThrottled = useThrottledCallback(handleClick);

  return (
    <div className="flex flex-col w-full">
      <Button onClick={handleClickThrottled} className={className} disabled={disabled}>
        <div className="flex flex-col w-full">
          <div className="flex items-center w-full">
            <div className="flex-1 text-left">{typeof title === 'string' ? <Text>{title}</Text> : title}</div>
            {!disabled && <Icon className="mx-2" name={visible ? 'expand_less' : 'expand_more'} />}
            {after && <div className="ml-auto pl-4 flex items-center">{after}</div>}
          </div>
          {!visible && subtitle && <Text className="mt-2">{subtitle}</Text>}
        </div>
      </Button>
      {visible && children}
    </div>
  );
};

export default Accordion;
