export interface WagerKeypadControlProps {
  value: string;
  maxBalance: number;
  minBet: number;
  onChange: (val: string) => void;
  onSubmit?: () => void;
}
