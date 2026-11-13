// Apply the Tehran day boundary before formatting in the Jalali calendar.
const publicationDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatPublicationDate(value: string) {
  return publicationDate.format(new Date(value));
}
