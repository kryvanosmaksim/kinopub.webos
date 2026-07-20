import cx from 'classnames';

import Spottable from 'components/spottable';

type Props = {
  className?: string;
  wrapperClassName?: string;
  source?: string;
  caption?: string;
} & React.HTMLAttributes<HTMLDivElement>;

const ImageItem: React.FC<Props> = ({ className, wrapperClassName, source, caption, children, ...props }) => {
  return (
    <Spottable {...props} className={cx('rounded-xl w-1/5 cursor-pointer', wrapperClassName)}>
      <div className={cx('h-40 m-1 flex flex-col relative rounded-xl overflow-hidden border border-white border-opacity-20', className)}>
        <img loading="lazy" className="w-full h-full object-cover bg-gray-800" src={source} alt={caption} />
        {children}
      </div>
      {caption && (
        <div className="px-2">
          <p className="text-gray-200 text-sm text-center overflow-hidden overflow-ellipsis whitespace-nowrap">{caption}</p>
        </div>
      )}
    </Spottable>
  );
};

export default ImageItem;
