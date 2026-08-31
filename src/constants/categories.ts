import type { IconProps } from '@/components/icons';
import {
  EtcIcon,
  EventsIcon,
  FinanceIcon,
  FixedIcon,
  FoodIcon,
  HealthIcon,
  HousingIcon,
  LeisureIcon,
  ShoppingIcon,
  TransportIcon,
  TrendUpIcon,
} from '@/components/icons';
import { LedgerColors } from '@/constants/ledger-colors';

export type IconComponent = (props: IconProps) => React.JSX.Element;

export type CategoryMeta = {
  name: string;
  color: string;
  Icon: IconComponent;
};

export type Category = {
  key: string;
  name: string;
  colorId: string;
  iconId: string;
  subcategories: string[];
};

export const ICON_OPTIONS: { id: string; Icon: IconComponent }[] = [
  { id: 'food', Icon: FoodIcon },
  { id: 'transport', Icon: TransportIcon },
  { id: 'shopping', Icon: ShoppingIcon },
  { id: 'fixed', Icon: FixedIcon },
  { id: 'etc', Icon: EtcIcon },
  { id: 'housing', Icon: HousingIcon },
  { id: 'health', Icon: HealthIcon },
  { id: 'leisure', Icon: LeisureIcon },
  { id: 'events', Icon: EventsIcon },
  { id: 'finance', Icon: FinanceIcon },
];

export const COLOR_OPTIONS: { id: string; hex: string }[] = [
  { id: 'orange', hex: LedgerColors.food },
  { id: 'aqua', hex: LedgerColors.transport },
  { id: 'magenta', hex: LedgerColors.shopping },
  { id: 'violet', hex: LedgerColors.fixed },
  { id: 'yellow', hex: LedgerColors.etc },
  { id: 'blue', hex: LedgerColors.housing },
  { id: 'teal', hex: LedgerColors.health },
  { id: 'purple', hex: LedgerColors.leisure },
  { id: 'olive', hex: LedgerColors.events },
  { id: 'navy', hex: LedgerColors.finance },
];

export function getIconComponent(iconId: string): IconComponent {
  return ICON_OPTIONS.find((o) => o.id === iconId)?.Icon ?? EtcIcon;
}

export function getColorHex(colorId: string): string {
  return COLOR_OPTIONS.find((o) => o.id === colorId)?.hex ?? LedgerColors.mutedLight;
}

export const INCOME_CATEGORY_KEY = 'income';

export const INCOME_META: CategoryMeta = { name: '수입', color: LedgerColors.income, Icon: TrendUpIcon };

export const UNCATEGORIZED_META: CategoryMeta = { name: '미분류', color: LedgerColors.mutedLight, Icon: EtcIcon };
