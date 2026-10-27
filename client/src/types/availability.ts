export type Slot = {
  startsAt: string;
  endsAt: string;
  time: string;
  special: boolean;
  forStudentId: number | null;
};

export type AvailabilityDay = {
  date: string;
  dayOfWeek: number;
  slots: Slot[];
};

export type Availability = {
  from: string;
  to: string;
  days: AvailabilityDay[];
};