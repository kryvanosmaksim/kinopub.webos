import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Spotlight from '@enact/spotlight';
import cx from 'classnames';
import map from 'lodash/map';

import Link from 'components/link';
import { PATHS, generatePath } from 'routes';

type MenuItem = {
  name: string;
  icon: string;
  href: string;
};

const menuItems: (MenuItem | null)[][] = [
  [
    {
      name: 'Главная',
      icon: 'home',
      href: PATHS.Home,
    },
    {
      name: 'Поиск',
      icon: 'search',
      href: PATHS.Search,
    },
    {
      name: 'Я смотрю',
      icon: 'notifications_active',
      href: generatePath(PATHS.Watching),
    },
    {
      name: 'Закладки',
      icon: 'bookmark',
      href: PATHS.Bookmarks,
    },
    {
      name: 'История',
      icon: 'history',
      href: PATHS.History,
    },
    {
      name: 'Подборки',
      icon: 'list',
      href: generatePath(PATHS.Collections),
    },
  ].filter(Boolean),
  [
    {
      name: 'Новинки',
      icon: 'new_releases',
      href: generatePath(PATHS.Releases),
    },
    {
      name: 'Фильмы',
      icon: 'movie',
      href: generatePath(PATHS.Category, { categoryType: 'movie' }),
    },
    {
      name: 'Сериалы',
      icon: 'tv',
      href: generatePath(PATHS.Category, { categoryType: 'serial' }),
    },
    {
      name: 'Мультфильмы',
      icon: 'toys',
      href: generatePath(PATHS.Genre, { genreType: '23' }),
    },
    {
      name: 'Аниме',
      icon: 'auto_awesome',
      href: generatePath(PATHS.Genre, { genreType: '25' }),
    },
    {
      name: 'Концерты',
      icon: 'library_music',
      href: generatePath(PATHS.Category, { categoryType: 'concert' }),
    },
    {
      name: 'Докуфильмы',
      icon: 'archive',
      href: generatePath(PATHS.Category, { categoryType: 'documovie' }),
    },
    {
      name: 'Докусериалы',
      icon: 'description',
      href: generatePath(PATHS.Category, { categoryType: 'docuserial' }),
    },
    {
      name: 'ТВ Шоу',
      icon: 'live_tv',
      href: generatePath(PATHS.Category, { categoryType: 'tvshow' }),
    },
    {
      name: 'Спорт',
      icon: 'sports_soccer',
      href: generatePath(PATHS.Channels),
    },
  ].filter(Boolean),
  [
    process.env.REACT_APP_HIDE_DONATE_MENU === 'true'
      ? null
      : {
          name: 'Донат',
          icon: 'favorite',
          href: PATHS.Donate,
        },
    {
      name: 'Спидтест',
      icon: 'speed',
      href: PATHS.Speed,
    },
    {
      name: 'Настройки',
      icon: 'settings',
      href: PATHS.Settings,
    },
  ].filter(Boolean),
];

type Props = {
  className?: string;
};

const Menu: React.FC<Props> = ({ className, ...props }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);

  const handleFocus = useCallback(() => {
    if (!Spotlight.getPointerMode()) {
      setCollapsed(false);
    }
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLElement>) => {
    // Only collapse if focus is leaving the nav entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setCollapsed(true);
    }
  }, []);

  return (
    <nav
      className={cx(
        'h-screen flex flex-col justify-between overflow-y-auto flex-shrink-0 transition-all duration-300',
        collapsed ? 'w-14' : 'w-52',
        className,
      )}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {map(menuItems, (list, idx) => (
        <ul key={idx}>
          {map(list, (item: MenuItem) => (
            <li key={item.href}>
              <Link href={item.href} icon={item.icon} iconOnly={collapsed} active={location.pathname.startsWith(item.href)}>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      ))}
    </nav>
  );
};

export default Menu;
