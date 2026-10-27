import request from "./api";
import type { Availability } from "../types/availability";

export const getAvailability = (from: string, to: string) =>
  request<Availability>("/availability", { query: { from, to } });