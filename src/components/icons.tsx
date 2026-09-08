import type { FC } from 'react';
import { Circle, Line, Path, Rect, Svg, type SvgProps } from 'react-native-svg';

import RawAlcoholIcon from '../assets/categoryIcons/alcohol.svg';
import RawBeautyIcon from '../assets/categoryIcons/beauty.svg';
import RawCafeIcon from '../assets/categoryIcons/cafe.svg';
import RawCarIcon from '../assets/categoryIcons/car.svg';
import RawChildcareIcon from '../assets/categoryIcons/childcare.svg';
import RawClothingIcon from '../assets/categoryIcons/clothing.svg';
import RawEducationIcon from '../assets/categoryIcons/education.svg';
import RawEtcIcon from '../assets/categoryIcons/etc.svg';
import RawEventsIcon from '../assets/categoryIcons/events.svg';
import RawFinanceIcon from '../assets/categoryIcons/finance.svg';
import RawFitnessIcon from '../assets/categoryIcons/fitness.svg';
import RawFoodIcon from '../assets/categoryIcons/food.svg';
import RawHealthIcon from '../assets/categoryIcons/health.svg';
import RawHousingIcon from '../assets/categoryIcons/housing.svg';
import RawLeisureIcon from '../assets/categoryIcons/leisure.svg';
import RawPetIcon from '../assets/categoryIcons/pet.svg';
import RawSavingsIcon from '../assets/categoryIcons/savings.svg';
import RawShoppingIcon from '../assets/categoryIcons/shopping.svg';
import RawSubscriptionIcon from '../assets/categoryIcons/subscription.svg';
import RawTransportIcon from '../assets/categoryIcons/transport.svg';
import RawTravelIcon from '../assets/categoryIcons/travel.svg';
import RawUtilitiesIcon from '../assets/categoryIcons/utilities.svg';

export type IconProps = {
  size?: number;
  color?: string;
};

// 카테고리 아이콘 SVG(단색, currentColor)를 기존 size/color prop 인터페이스로 감싼다.
function svgIcon(Svg: FC<SvgProps>): (props: IconProps) => React.JSX.Element {
  return function WrappedSvgIcon({ size = 20, color = '#fff' }: IconProps) {
    return <Svg width={size} height={size} color={color} />;
  };
}

const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: '0 0 20 20',
});

export function ChevronLeftIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M12.5 4l-6 6 6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M7.5 4l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronUpIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M4 12.5l6-6 6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M4 7.5l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M10 4v12M4 10h12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function InboxIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M3 11.5l2.2-5.4A1.6 1.6 0 016.7 5h6.6a1.6 1.6 0 011.5 1.1L17 11.5v2.9A1.6 1.6 0 0115.4 16H4.6A1.6 1.6 0 013 14.4v-2.9z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M3 11.5h3.4l1 2h5.2l1-2H17" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    </Svg>
  );
}

export function CalendarTabIcon({ size, color = '#B4B0A7' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Rect x="3" y="4.5" width="14" height="12" rx="2.5" stroke={color} strokeWidth={1.7} />
      <Line x1="3" y1="8.5" x2="17" y2="8.5" stroke={color} strokeWidth={1.7} />
      <Line x1="7" y1="2.5" x2="7" y2="6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Line x1="13" y1="2.5" x2="13" y2="6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function ListTabIcon({ size, color = '#B4B0A7' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx="4" cy="6" r="1.1" fill={color} />
      <Line x1="8" y1="6" x2="17" y2="6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx="4" cy="10" r="1.1" fill={color} />
      <Line x1="8" y1="10" x2="17" y2="10" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx="4" cy="14" r="1.1" fill={color} />
      <Line x1="8" y1="14" x2="17" y2="14" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function ChartTabIcon({ size, color = '#B4B0A7' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Line x1="5" y1="15" x2="5" y2="11" stroke={color} strokeWidth={2.1} strokeLinecap="round" />
      <Line x1="10" y1="15" x2="10" y2="7" stroke={color} strokeWidth={2.1} strokeLinecap="round" />
      <Line x1="15" y1="15" x2="15" y2="4" stroke={color} strokeWidth={2.1} strokeLinecap="round" />
    </Svg>
  );
}

export function WalletTabIcon({ size, color = '#B4B0A7' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M3 6.5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="13.5" cy="10.5" r="1.1" fill={color} />
    </Svg>
  );
}

export const FoodIcon = svgIcon(RawFoodIcon);
export const TransportIcon = svgIcon(RawTransportIcon);
export const ShoppingIcon = svgIcon(RawShoppingIcon);

export function FixedIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M4 7h9l-2-2M16 13H7l2 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const EtcIcon = svgIcon(RawEtcIcon);

export function TrendUpIcon({ size, color = '#006300' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M4 8l4-4 3 3 5-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 4h4v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TargetIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.6} />
      <Circle cx="10" cy="10" r="3.5" stroke={color} strokeWidth={1.6} />
      <Circle cx="10" cy="10" r={0.9} fill={color} />
    </Svg>
  );
}

export function SparkleIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M10 3l1.7 5.3L17 10l-5.3 1.7L10 17l-1.7-5.3L3 10l5.3-1.7L10 3z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M5 5l10 10M15 5L5 15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** 브랜드 로고가 아니라, 사각형 마크 형태를 연상시키는 용도의 중립적인 아이콘. */
export function SquareMarkIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Rect x="4" y="4" width="12" height="12" rx="3" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function CheckIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M4.5 10.5l3.5 3.5 7.5-8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CopyIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Rect x="7" y="7" width="10" height="10" rx="2" stroke={color} strokeWidth={1.6} />
      <Path d="M13 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PencilIcon({ size, color = '#9B9790' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M4 16l1-4 9-9 3 3-9 9-4 1z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BackspaceIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M7 4h10v12H7l-4-6 4-6z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="10" y1="8" x2="14" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="14" y1="8" x2="10" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export const HousingIcon = svgIcon(RawHousingIcon);
export const HealthIcon = svgIcon(RawHealthIcon);
export const LeisureIcon = svgIcon(RawLeisureIcon);
export const EventsIcon = svgIcon(RawEventsIcon);
export const FinanceIcon = svgIcon(RawFinanceIcon);
export const CafeIcon = svgIcon(RawCafeIcon);
export const TravelIcon = svgIcon(RawTravelIcon);
export const EducationIcon = svgIcon(RawEducationIcon);
export const PetIcon = svgIcon(RawPetIcon);
export const BeautyIcon = svgIcon(RawBeautyIcon);
export const SubscriptionIcon = svgIcon(RawSubscriptionIcon);
export const SavingsIcon = svgIcon(RawSavingsIcon);
export const UtilitiesIcon = svgIcon(RawUtilitiesIcon);
export const ChildcareIcon = svgIcon(RawChildcareIcon);
export const FitnessIcon = svgIcon(RawFitnessIcon);
export const ClothingIcon = svgIcon(RawClothingIcon);
export const CarIcon = svgIcon(RawCarIcon);
export const AlcoholIcon = svgIcon(RawAlcoholIcon);

export function ChatIcon({ size, color = '#15130F' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M3 5.5A1.5 1.5 0 014.5 4h11A1.5 1.5 0 0117 5.5v6a1.5 1.5 0 01-1.5 1.5H9l-3.5 3v-3H4.5A1.5 1.5 0 013 11.5v-6z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="8.5" r={0.9} fill={color} />
      <Circle cx="10" cy="8.5" r={0.9} fill={color} />
      <Circle cx="13" cy="8.5" r={0.9} fill={color} />
    </Svg>
  );
}
