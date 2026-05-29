// Минимальный набор иконок (Lucide-style 1.75 stroke). Тонкие, моноцветные,
// 20px по умолчанию. Никаких внешних зависимостей.

import React from 'react';

const wrap = (path, viewBox = '0 0 24 24') => (props) => {
  const { size = 20, color = 'currentColor', ...rest } = props || {};
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none"
         stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
         {...rest}>
      {path}
    </svg>
  );
};

export const IconSearch       = wrap(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconCart         = wrap(<><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6" /></>);
export const IconHome         = wrap(<path d="m3 11 9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9Z" />);
export const IconCalendar     = wrap(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
export const IconMessage      = wrap(<path d="M21 12a8 8 0 0 1-11.2 7.3L4 21l1.7-5.7A8 8 0 1 1 21 12Z" />);
export const IconMapPin       = wrap(<><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></>);
export const IconSettings     = wrap(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>);
export const IconChevronRight = wrap(<path d="m9 6 6 6-6 6" />);
export const IconChevronLeft  = wrap(<path d="m15 6-6 6 6 6" />);
export const IconStar         = wrap(<path d="m12 2 3.1 6.4 7 1-5.1 5 1.2 7L12 18l-6.3 3.4 1.2-7-5.1-5 7-1L12 2Z" />);
export const IconX            = wrap(<path d="M18 6 6 18M6 6l12 12" />);
export const IconCheck        = wrap(<path d="M20 6 9 17l-5-5" />);
export const IconPlus         = wrap(<path d="M12 5v14M5 12h14" />);
export const IconPhone        = wrap(<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z" />);
export const IconImage        = wrap(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="1.5" /><path d="m21 15-5-5L5 21" /></>);
export const IconClock        = wrap(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconShare        = wrap(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>);
export const IconDownload     = wrap(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></>);
export const IconEdit         = wrap(<><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" /></>);
export const IconArrowRight   = wrap(<path d="M5 12h14M13 5l7 7-7 7" />);
export const IconDots         = wrap(<><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>);
