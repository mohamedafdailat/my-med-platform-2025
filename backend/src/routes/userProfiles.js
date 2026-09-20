import express from 'express';

const roles = new Set(['student', 'teacher', 'admin', 'user']);
const statuses = new Set(['unpaid', 'paid', 'free', 'active', 'inactive']);
const plans = new Set(['free', 'student', 'monthly', 'annual']);

export const createRequireAdmin = (auth) => async (req, res, next) => {
  try {
    const account = await auth.getUser(req.user.uid);
    if (account.disabled || account.customClaims?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès administrateur requis.' });
    }
    return next();
  } catch { return res.status(403).json({ error: 'Accès administrateur requis.' }); }
};

// Inject Firebase services so integration tests use only the local emulators.
export const createUserProfilesRouter = ({ auth, db, authenticate }) => {
  const router = express.Router();
  router.use(authenticate);

  const handle = (action) => async (req, res, next) => {
    try { await action(req, res); } catch (error) { next(error); }
  };

  // Recheck current claims: a stale ID token must not retain revoked privileges.
  const requireAdmin = createRequireAdmin(auth);

  const profileView = (id, data, account) => ({
    id,
    uid: id,
    fullName: data.fullName || data.displayName || account?.displayName || '',
    displayName: data.fullName || data.displayName || account?.displayName || '',
    email: account?.email || data.email || '',
    phoneNumber: data.phoneNumber || data.phone || '',
    semester: data.semester || '',
    role: account?.customClaims?.role || 'student',
    subscriptionStatus: data.subscriptionStatus || 'unpaid',
    subscription: data.subscription || {},
    createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt || account?.metadata.creationTime || null,
    disabled: account?.disabled || false,
    accountExists: Boolean(account),
  });

  const getAccount = async (id) => {
    try { return await auth.getUser(id); }
    catch (error) { if (error.code === 'auth/user-not-found') return null; throw error; }
  };

  router.get('/', requireAdmin, handle(async (req, res) => {
    const pageSize = 100;
    let query = db.collection('users').orderBy('__name__').limit(pageSize + 1);
    if (req.query.cursor) {
      if (typeof req.query.cursor !== 'string' || req.query.cursor.includes('/')) {
        return res.status(400).json({ error: 'Curseur invalide.' });
      }
      query = query.startAfter(req.query.cursor);
    }
    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, pageSize);
    const users = await Promise.all(docs.map(async (doc) => profileView(doc.id, doc.data(), await getAccount(doc.id))));
    return res.json({ users, nextCursor: snapshot.size > pageSize ? docs.at(-1).id : null });
  }));

  router.get('/:id', handle(async (req, res) => {
    if (req.params.id !== req.user.uid) {
      const requester = await auth.getUser(req.user.uid);
      if (requester.disabled || requester.customClaims?.role !== 'admin') {
        return res.status(403).json({ error: 'Accès à ce profil interdit.' });
      }
    }
    const [profile, account] = await Promise.all([db.collection('users').doc(req.params.id).get(), getAccount(req.params.id)]);
    if (!profile.exists && !account) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    return res.json(profileView(req.params.id, profile.data() || {}, account));
  }));

  router.patch('/:id', requireAdmin, handle(async (req, res) => {
    const payload = req.body;
    const fields = ['role', 'subscriptionStatus', 'subscription', 'disabled'];
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
        !Object.keys(payload).length || Object.keys(payload).some((key) => !fields.includes(key)) ||
        ('role' in payload && !roles.has(payload.role)) ||
        ('subscriptionStatus' in payload && !statuses.has(payload.subscriptionStatus)) ||
        ('disabled' in payload && typeof payload.disabled !== 'boolean') ||
        ('subscription' in payload && (!payload.subscription ||
          Object.keys(payload.subscription).some((key) => key !== 'type') || !plans.has(payload.subscription.type)))) {
      return res.status(400).json({ error: 'Modification de profil invalide.' });
    }
    if (req.params.id === req.user.uid && (payload.disabled === true || (payload.role && payload.role !== 'admin'))) {
      return res.status(409).json({ error: 'Vous ne pouvez pas désactiver votre compte ou retirer votre propre rôle admin.' });
    }
    const account = await getAccount(req.params.id);
    if (!account) return res.status(409).json({ error: 'Ce profil ne possède plus de compte de connexion. Une réconciliation est nécessaire.' });
    const profileRef = db.collection('users').doc(req.params.id);
    const current = (await profileRef.get()).data() || {};
    const updates = { updatedAt: new Date().toISOString() };
    if (payload.role) updates.role = payload.role;
    if (payload.subscriptionStatus) updates.subscriptionStatus = payload.subscriptionStatus;
    if (payload.subscription || payload.subscriptionStatus) {
      updates.subscription = {
        ...(current.subscription || {}),
        ...(payload.subscription || {}),
        ...(payload.subscriptionStatus ? { status: payload.subscriptionStatus } : {}),
      };
    }
    // Auth and Firestore cannot share a transaction. Restore Auth on a failed profile write.
    try {
      if (payload.role) await auth.setCustomUserClaims(account.uid, { ...(account.customClaims || {}), role: payload.role });
      if ('disabled' in payload) await auth.updateUser(account.uid, { disabled: payload.disabled });
      await profileRef.set(updates, { merge: true });
    } catch (error) {
      if (payload.role) await auth.setCustomUserClaims(account.uid, account.customClaims || {});
      if ('disabled' in payload) await auth.updateUser(account.uid, { disabled: account.disabled });
      throw error;
    }
    if (payload.disabled === true || (payload.role && payload.role !== account.customClaims?.role)) {
      await auth.revokeRefreshTokens(account.uid);
    }
    return res.json(profileView(account.uid, { ...current, ...updates }, await auth.getUser(account.uid)));
  }));

  router.use((error, req, res, next) => {
    console.error('User profile API failed:', error.code || error.name);
    res.status(500).json({ error: 'Impossible de traiter le profil. Veuillez réessayer.' });
  });
  return router;
};
