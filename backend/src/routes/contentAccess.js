export const isSemester = (value) => typeof value === 'string' && /^(?:[1-9]|1[0-2])$/.test(value);
export const isContentSemester = (value) => value === 'all' || isSemester(value);

// Read trusted Auth claims and the current profile on every request. A student's
// selected level is never taken from request bodies or stale token claims.
export const getContentAccess = async ({ auth, db, uid }) => {
  const [account, profile] = await Promise.all([
    auth.getUser(uid),
    db.collection('users').doc(uid).get(),
  ]);
  if (account.disabled) {
    const error = new Error('Account disabled');
    error.status = 403;
    throw error;
  }
  const semester = profile.data()?.semester;
  return {
    uid,
    administrator: account.customClaims?.role === 'admin',
    unlimitedAccess: account.customClaims?.unlimitedAccess === true,
    semester: isSemester(semester) ? semester : null,
  };
};

export const canReadSemester = (data, access) => access.administrator || access.unlimitedAccess || (
  isContentSemester(data.semester) && (
    data.semester === 'all' || data.semester === access.semester
  )
);

export const canReadPersonalContent = (data, ownerField, access) => access.administrator || (
  data.visibility === 'private' && data[ownerField] === access.uid
) || (data.visibility === 'shared' && canReadSemester(data, access));
