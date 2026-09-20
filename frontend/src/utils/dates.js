export const toDate = (value) => {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate()
    : typeof value.seconds === 'number' ? new Date(value.seconds * 1000)
      : typeof value._seconds === 'number' ? new Date(value._seconds * 1000)
        : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
