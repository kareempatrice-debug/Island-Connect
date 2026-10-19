export const TRIP_KIND_LABEL: Record<string, string> = {
  taxi: "Taxi", airport: "Airport transfer", group: "Minivan or group", boat: "Boat or water taxi", haulage: "Trucking and haulage", freight: "Freight",
};
export const TRIP_STATUS_LABEL: Record<string, string> = {
  open: "Waiting for quotes", booked: "Booked", completed: "Completed", cancelled: "Cancelled", expired: "Expired",
};
export const fmtXcd = (n: number | string) => `EC$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtWhen = (t: string | null, tz = "America/Grenada") =>
  t ? new Date(t).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz }) : "As soon as possible";
