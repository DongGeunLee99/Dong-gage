import type { IconProps } from '@/components/icons';
import {
  AlcoholIcon,
  BeautyIcon,
  CafeIcon,
  CarIcon,
  ChildcareIcon,
  ClothingIcon,
  EducationIcon,
  EtcIcon,
  EventsIcon,
  FinanceIcon,
  FitnessIcon,
  FixedIcon,
  FoodIcon,
  HealthIcon,
  HousingIcon,
  LeisureIcon,
  PetIcon,
  SavingsIcon,
  ShoppingIcon,
  SubscriptionIcon,
  TransportIcon,
  TravelIcon,
  TrendUpIcon,
  UtilitiesIcon,
} from '@/components/icons';
import { LedgerColors } from '@/constants/ledgerColors';

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
  { id: 'cafe', Icon: CafeIcon },
  { id: 'travel', Icon: TravelIcon },
  { id: 'education', Icon: EducationIcon },
  { id: 'pet', Icon: PetIcon },
  { id: 'beauty', Icon: BeautyIcon },
  { id: 'subscription', Icon: SubscriptionIcon },
  { id: 'savings', Icon: SavingsIcon },
  { id: 'utilities', Icon: UtilitiesIcon },
  { id: 'childcare', Icon: ChildcareIcon },
  { id: 'fitness', Icon: FitnessIcon },
  { id: 'clothing', Icon: ClothingIcon },
  { id: 'car', Icon: CarIcon },
  { id: 'alcohol', Icon: AlcoholIcon },
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
  { id: 'brown', hex: LedgerColors.cafe },
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
