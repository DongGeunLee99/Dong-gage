import { Circle, Line, Path, Rect, Svg } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
};

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

export function FoodIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M6 3v6M8 3v3a1 1 0 01-2 0V3M7 9v8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 3s-2 1-2 4 2 3 2 3v6" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TransportIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M4 12V8a2 2 0 012-2h8a2 2 0 012 2v4" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 12h14v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="6.5" cy="15.5" r="1.1" fill={color} />
      <Circle cx="13.5" cy="15.5" r="1.1" fill={color} />
    </Svg>
  );
}

export function ShoppingIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M5 7h10l-1 9a1 1 0 01-1 1H7a1 1 0 01-1-1L5 7z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 7V5a2 2 0 014 0v2" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FixedIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M4 7h9l-2-2M16 13H7l2 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function EtcIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.7} />
      <Circle cx="7" cy="10" r={0.9} fill={color} />
      <Circle cx="10" cy="10" r={0.9} fill={color} />
      <Circle cx="13" cy="10" r={0.9} fill={color} />
    </Svg>
  );
}

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

export function HousingIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M3 10l7-6 7 6" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 9v7a1 1 0 001 1h8a1 1 0 001-1V9" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="17" x2="9" y2="13" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function HealthIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.7} />
      <Path d="M10 6.5v7M6.5 10h7" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function LeisureIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M8 14V5l7-2v9" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="6" cy="14" r="2" stroke={color} strokeWidth={1.7} />
      <Circle cx="13" cy="12" r="2" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function EventsIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M4 8h12v8a1 1 0 01-1 1H5a1 1 0 01-1-1V8z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h14v2a1 1 0 01-1 1H4a1 1 0 01-1-1V6z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="10" y1="6" x2="10" y2="17" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function FinanceIcon({ size, color = '#fff' }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx="8" cy="12" r="5" stroke={color} strokeWidth={1.7} />
      <Circle cx="12.5" cy="8" r="5" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

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
