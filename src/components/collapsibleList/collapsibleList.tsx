import React, { Children, useCallback, useMemo } from 'react';

import Button from 'components/button';
import useChangebleState from 'hooks/useChangebleState';

type Props = {
  maxVisible?: number;
  className?: string;
  children: React.ReactNode;
};

const CollapsibleList: React.FC<Props> = ({ maxVisible = 4, className, children }) => {
  const [expanded, setExpanded] = useChangebleState(false);
  const childArray = useMemo(() => Children.toArray(children), [children]);
  const totalCount = childArray.length;
  const needsCollapse = totalCount > maxVisible;

  const visibleChildren = useMemo(() => {
    if (!needsCollapse || expanded) {
      return childArray;
    }
    return childArray.slice(0, maxVisible);
  }, [childArray, needsCollapse, expanded, maxVisible]);

  const handleToggle = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  const hiddenCount = totalCount - maxVisible;

  return (
    <div className={className}>
      {visibleChildren}
      {needsCollapse && (
        <Button icon={expanded ? 'expand_less' : 'expand_more'} onClick={handleToggle} className="mt-1 text-gray-400 text-sm">
          {expanded ? 'Свернуть' : `Показать ещё (${hiddenCount})`}
        </Button>
      )}
    </div>
  );
};

export default CollapsibleList;
