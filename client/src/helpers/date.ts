const TZ = "Asia/Jerusalem";
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("he-IL", {
    timeZone:TZ,
    weekday: "short",
    day: "numeric",
    month: "numeric",
  });
  export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("he-IL", {
    timeZone:TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
export const todayIso = () =>
  new Date().toLocaleDateString("en-CA",{timeZone: TZ});
export const yesterdayIso = () =>
  new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString("en-CA");
export const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
};

export const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export const isFuture = (iso: string) => new Date(iso).getTime() > Date.now();