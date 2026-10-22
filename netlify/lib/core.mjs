// Core logic for the Trans Island Logistics app.
// Pure functions that take the database object and change it. The API file
// (api.mjs) loads the database from Netlify Blobs, calls these, and saves it.

import crypto from 'node:crypto';
import { COST_KEYS, invBalance as calcBalance, partnerShare, invJobProfit, expenseFunding, round2 } from './calc.mjs';

export const DEFAULT_SETTINGS = {
  businessName: 'Trans Island Logistics SVG',
  phone: '+1 (784) 493-8441',
  whatsapp: '+44 7557 799046',
  email: 'Transislandtruckingsvg@outlook.com',
  address: 'Villa, Fountain Road\nSt Vincent & the Grenadines',
  bankName: 'Bank of St Vincent & the Grenadines (BOSVG)',
  accountName: 'Raydon Thomas',
  accountNumber: '6104060',
  paymentDays: 14,
  defaultPrice: 2200,
  invoiceNote: '',
  tagline: 'Connecting the Islands · Delivering the Grenadines',
  partners: [{ name: 'Kareem', share: 50 }, { name: 'Raydon', share: 50 }],
  gbpRate: 3.63,
  quoteDays: 30,
  monthlyTarget: 0,
  lockedThrough: '',
  // Vehicle register. The id is the name stored on every job, so it never changes; the rest is editable.
  vehicles: [
    { id: 'DAF Truck 1', nickname: 'White Knight', plate: '', make: 'DAF', model: '', year: '', vin: '', active: true },
    { id: 'DAF Truck 2', nickname: 'Big Blue', plate: '', make: 'DAF', model: '', year: '', vin: '', active: true }
  ],
  drivers: [],
  // The partner whose bank account receives customer payments and who transfers the other partner's share.
  accountHolder: 'Raydon',
  backupEmails: 'kareempatrice@icloud.com',
  driveShare: 'Prodigythomas@hotmail.co.uk',
  reportEmails: 'kareempatrice@icloud.com, Prodigythomas@hotmail.co.uk',
  // Standard prices per route: filled in automatically on invoices, quotes and bookings.
  routeRates: [
    { route: 'SVG → Mustique', price: 1750, garbagePrice: 0, driver: 150 },
    { route: 'SVG → Union Island', price: 2200, garbagePrice: 0, driver: 250 },
    { route: 'SVG → Mayreau', price: 2200, garbagePrice: 0, driver: 250 },
    { route: 'SVG → Palm Island', price: 1600, garbagePrice: 2100, driver: 150 },
    { route: 'SVG → PSV', price: 1700, garbagePrice: 2200, driver: 250 },
    { route: 'SVG → Bequia', price: 1500, garbagePrice: 0, driver: 150 }
  ]
};

export function emptyDb() {
  return {
    schema: 1,
    settings: { ...DEFAULT_SETTINGS },
    nextInvoiceNo: 1,
    users: [],
    clients: [],
    invoices: [],
    expenses: [],
    startup: [],
    quotes: [],
    nextQuoteNo: 1,
    reminders: [],
    capital: [],
    partnerTx: [],
    invites: [],
    incidents: [],
    driverPay: [],
    bookings: [],
    fuel: [],
    pushSubs: [],
    audit: []
  };
}

/** Older saved data may lack newer collections; fill them in. */
const OLD_VAT_NOTE = 'Trans Island Logistics SVG is not registered for VAT; no VAT is charged.';
export function normalise(db) {
  const e = emptyDb();
  for (const k of Object.keys(e)) if (db[k] === undefined) db[k] = e[k];
  db.settings = { ...DEFAULT_SETTINGS, ...db.settings };
  if (db.settings.invoiceNote === OLD_VAT_NOTE) db.settings.invoiceNote = '';
  if (!Array.isArray(db.settings.closedMonths)) {
    const lt = db.settings.lockedThrough, list = [];
    if (lt && /^\d{4}-\d{2}$/.test(lt)) {
      const dates = [].concat((db.invoices || []).flatMap(i => [i.issueDate].concat((i.lines || []).map(l => l.date))), (db.expenses || []).map(e => e.date)).filter(Boolean).sort();
      let m = (dates[0] || lt + '-01').slice(0, 7);
      while (m <= lt) { list.push(m); const [y, mo] = m.split('-').map(Number); m = mo === 12 ? (y + 1) + '-01' : y + '-' + String(mo + 1).padStart(2, '0'); }
    }
    db.settings.closedMonths = list; db.settings.closedInfo = db.settings.closedInfo || {};
  }
  return db;
}

export class AppError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// ---------- small helpers ----------
const ISO = /^\d{4}-\d{2}-\d{2}$/;
export const newId = (p = '') => p + crypto.randomBytes(6).toString('hex');
const nowIso = () => new Date().toISOString();
const str = (v, max = 500) => String(v == null ? '' : v).trim().slice(0, max);
const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; };
const date = (v, label) => { const s = str(v, 10); if (!ISO.test(s)) throw new AppError('Choose a valid ' + label + '.'); return s; };
export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + (Number(days) || 0))).toISOString().slice(0, 10);
}
function audit(db, user, action, ref) {
  db.audit.unshift({ at: nowIso(), by: user ? user.name : 'system', action, ref: ref || '' });
  if (db.audit.length > 1000) db.audit.length = 1000;
}
const stamp = (obj, user, isNew) => {
  if (isNew) { obj.createdBy = user.name; obj.createdAt = nowIso(); }
  obj.updatedBy = user.name; obj.updatedAt = nowIso();
};

// ---------- passwords and sessions ----------
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}
function passwordOk(user, password) {
  const { hash } = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.hash, 'hex'));
}
function checkNewPassword(p) {
  if (String(p || '').length < 10) throw new AppError('Use a password of at least 10 characters.');
}
const b64u = (buf) => Buffer.from(buf).toString('base64url');
export function makeToken(user, secret, days = 60, sid) {
  const body = b64u(JSON.stringify(Object.assign({ u: user.id, v: user.tokenVersion || 0, e: Date.now() + days * 86400000 }, sid ? { s: sid } : {})));
  const sig = b64u(crypto.createHmac('sha256', secret).update(body).digest());
  return body + '.' + sig;
}
/** Records a new signed-in device; keeps the latest 15. */
export function addSession(db, userId, device) {
  const u = db.users.find(x => x.id === userId); if (!u) return '';
  const id = newId('s');
  u.sessions = [{ id, device: String(device || 'Unknown device').slice(0, 80), at: new Date().toISOString() }].concat(u.sessions || []).slice(0, 15);
  db.audit.unshift({ at: new Date().toISOString(), by: u.name, what: 'Signed in on ' + String(device || 'a device').slice(0, 60), ref: '' });
  return id;
}
export function deviceName(ua) {
  ua = String(ua || '');
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Device';
  const br = /CriOS|Chrome\//.test(ua) && !/Edg/.test(ua) ? 'Chrome' : /Edg/.test(ua) ? 'Edge' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'browser';
  return os + ' · ' + br;
}
/** Single-use invitation, valid 72 hours. Only a hash of the code is stored. */
export function inviteByCode(db, code) {
  const h = crypto.createHash('sha256').update(String(code || '')).digest('hex');
  const inv = (db.invites || []).find(i => i.hash === h);
  if (!inv || inv.usedAt || Date.parse(inv.expires) < Date.now()) return null;
  return inv;
}
export function acceptInvite(db, { code, username, password }) {
  const inv = inviteByCode(db, code); if (!inv) throw new AppError('This invitation has expired or been used. Ask for a new one.', 400);
  const owner = db.users.find(u => u.role === 'owner'); if (!owner) throw new AppError('Setup is not complete.');
  actions.addUser(db, owner, { name: inv.name, username, password, role: inv.role });
  const u = db.users[db.users.length - 1]; u.mustChange = false; inv.usedAt = new Date().toISOString(); inv.userId = u.id;
  audit(db, u, 'Accepted invitation and set a password');
  return u;
}
export function readToken(db, token, secret) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) return null;
  const [body, sig] = token.split('.');
  const expect = b64u(crypto.createHmac('sha256', secret).update(body).digest());
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  let p; try { p = JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
  if (!p || Date.now() > p.e) return null;
  const user = db.users.find(u => u.id === p.u && u.active !== false);
  if (!user || (user.tokenVersion || 0) !== p.v) return null;
  if (p.s && !(user.sessions || []).some(x => x.id === p.s)) return null; // signed out remotely
  Object.defineProperty(user, '_sid', { value: p.s || '', enumerable: false, configurable: true, writable: true });
  return user;
}
export const publicUser = (u) => ({ id: u.id, name: u.name, username: u.username, role: u.role, active: u.active !== false, mustChange: !!u.mustChange, passkeys: (u.passkeys || []).length, prefs: u.prefs || {}, notify: u.notify || {}, lastLogin: u.lastLogin || '', sessions: (u.sessions || []).length, createdAt: u.createdAt || '' });

export function setupOwner(db, { name, username, password }) {
  if (db.users.length) throw new AppError('The app is already set up. Sign in instead.');
  checkNewPassword(password);
  const u = { id: newId('u'), name: str(name, 40) || 'Kareem', username: str(username, 40).toLowerCase(), role: 'owner', active: true, tokenVersion: 0, ...hashPassword(password) };
  if (!/^[a-z0-9._-]{3,}$/.test(u.username)) throw new AppError('Choose a username of at least 3 letters or numbers.');
  db.users.push(u);
  audit(db, u, 'Set up the app', u.username);
  return u;
}

export function login(db, { username, password }) {
  const u = db.users.find(x => x.username === str(username, 40).toLowerCase() && x.active !== false);
  const fail = new AppError('Username or password not recognised.', 401);
  if (!u) throw fail;
  if (u.lockedUntil && Date.now() < u.lockedUntil) {
    throw new AppError('Too many wrong attempts. Try again in ' + Math.ceil((u.lockedUntil - Date.now()) / 60000) + ' minutes.', 429);
  }
  if (!passwordOk(u, password || '')) {
    u.failed = (u.failed || 0) + 1;
    if (u.failed >= 5) { u.lockedUntil = Date.now() + 15 * 60000; u.failed = 0; }
    return { ok: false, user: u, error: fail };
  }
  u.failed = 0; u.lockedUntil = 0; u.lastLogin = nowIso();
  return { ok: true, user: u };
}

// ---------- validation of records ----------
// Only the driver fee is required on a job (rule in force from this date; older jobs are left as recorded).
export const DRIVER_FEE_RULE_FROM = '2026-10-16';
function requireDriverFees(lines, existing) {
  const before = {}; (existing || []).forEach(l => { before[l.id] = l; });
  lines.forEach((l, i) => {
    const old = before[l.id];
    const applies = !old || l.date >= DRIVER_FEE_RULE_FROM;
    if (applies && !(l.costs.driver > 0)) throw new AppError('Enter the driver fee for ' + (lines.length > 1 ? 'job ' + (i + 1) : 'this job') + '. Every job has a driver fee.');
  });
}

function cleanLine(l, settings) {
  const qty = num(l.qty) || 1;
  const price = num(l.price);
  if (price <= 0) throw new AppError('Each line needs a price greater than zero.');
  return {
    id: str(l.id, 40) || newId('l'),
    date: date(l.date, 'job date'),
    title: str(l.title, 120) || 'Trucking',
    detail: str(l.detail, 300),
    truck: str(l.truck, 40) || 'DAF Truck 1',
    route: str(l.route, 80),
    category: str(l.category, 60) || 'Building Materials',
    load: str(l.load, 60),
    qty, price,
    costs: COST_KEYS.reduce((o, k) => { const v = num(l.costs && l.costs[k]); if (v < 0) throw new AppError('Costs cannot be negative.'); o[k] = v; return o; }, {}),
    costNote: str(l.costNote, 120),
    driverId: str(l.driverId, 40),
    garbage: !!l.garbage
  };
}

function upsertClient(db, c, user) {
  const name = str(c && c.name, 100);
  if (!name) throw new AppError('Enter the customer name.');
  let client = c.id ? db.clients.find(x => x.id === c.id) : db.clients.find(x => x.name.toLowerCase() === name.toLowerCase());
  const isNew = !client;
  if (!client) { client = { id: newId('c') }; db.clients.push(client); }
  client.name = name;
  if (c.phone !== undefined) client.phone = str(c.phone, 40);
  if (c.email !== undefined) client.email = str(c.email, 120);
  if (c.address !== undefined) client.address = str(c.address, 200);
  if (c.notes !== undefined) client.notes = str(c.notes, 500);
  stamp(client, user, isNew);
  return client;
}

// ---------- actions ----------
export const actions = {
  deleteClient(db, user, { clientId }) {
    adminOnly(user);
    const c = db.clients.find(x => x.id === clientId);
    if (!c) throw new AppError('That customer no longer exists.');
    const inv = db.invoices.filter(i => i.clientId === clientId).length, q = (db.quotes || []).filter(x => x.clientId === clientId).length;
    if (inv || q) throw new AppError(c.name + ' has ' + [inv ? inv + (inv === 1 ? ' invoice' : ' invoices') : '', q ? q + (q === 1 ? ' quote' : ' quotes') : ''].filter(Boolean).join(' and ') + '. Delete or move those first.');
    db.clients = db.clients.filter(x => x.id !== clientId);
    audit(db, user, 'Deleted customer ' + c.name);
    return {};
  },

  saveClient(db, user, { client }) {
    const c = upsertClient(db, client || {}, user);
    audit(db, user, 'Saved customer', c.name);
    return { id: c.id };
  },

  saveInvoice(db, user, { invoice }) {
    if (!invoice) throw new AppError('Nothing to save.');
    const lines = (invoice.lines || []).map(l => cleanLine(l, db.settings));
    if (!lines.length) throw new AppError('Add at least one line to the invoice.');
    const client = upsertClient(db, invoice.client || {}, user);
    const issueDate = date(invoice.issueDate, 'invoice date');
    const dueDate = invoice.dueDate ? date(invoice.dueDate, 'due date') : addDays(issueDate, db.settings.paymentDays);
    assertOpen(db, [issueDate].concat(lines.map(l => l.date)));
    const prior = invoice.id ? (db.invoices.find(x => x.id === invoice.id) || {}).lines : null;
    requireDriverFees(lines, prior);
    let inv;
    if (invoice.id) {
      inv = db.invoices.find(x => x.id === invoice.id);
      if (!inv) throw new AppError('That invoice no longer exists.');
      if (inv.void) throw new AppError('A cancelled invoice cannot be edited.');
      assertOpen(db, invDates(inv));
    } else {
      let no = db.nextInvoiceNo;
      if (invoice.no !== undefined && invoice.no !== null && String(invoice.no).trim() !== '') {
        // Owner only: record a past invoice under its original number.
        adminOnly(user);
        no = parseInt(String(invoice.no).replace(/\D/g, ''), 10);
        if (!(no > 0)) throw new AppError('Enter a valid invoice number.');
        if (db.invoices.some(x => x.no === no)) throw new AppError('Invoice #' + String(no).padStart(3, '0') + ' already exists.');
      }
      inv = { id: newId('i'), no, payments: [], sent: [], void: null };
      db.invoices.push(inv);
      if (no >= db.nextInvoiceNo) db.nextInvoiceNo = no + 1;
    }
    Object.assign(inv, { clientId: client.id, issueDate, dueDate, lines, notes: str(invoice.notes, 500), internalNotes: str(invoice.internalNotes, 1000) });
    stamp(inv, user, !invoice.id);
    if (invoice.bookingId) {
      const b = db.bookings.find(x => x.id === invoice.bookingId);
      if (b) { b.status = 'Invoiced'; b.invoiceId = inv.id; stamp(b, user, false); }
    }
    audit(db, user, invoice.id ? 'Edited invoice' : 'Created invoice', '#' + inv.no);
    return { id: inv.id, no: inv.no };
  },

  addPayment(db, user, { invoiceId, payment }) {
    const inv = findInvoice(db, invoiceId);
    const amount = num(payment && payment.amount);
    if (amount <= 0) throw new AppError('Enter the amount received.');
    if (inv.void) throw new AppError('This invoice is cancelled.');
    const due = calcBalance(inv);
    if (due <= 0.009) throw new AppError('This invoice is already paid.');
    if (Math.abs(amount - due) > 0.009) throw new AppError('Payments clear the full balance of EC$' + due.toFixed(2) + '. Part-payments are not used.');
    const p = { id: newId('p'), date: date(payment.date, 'payment date'), amount, method: str(payment.method, 40) || 'Cash', note: str(payment.note, 200), by: user.name, at: nowIso() };
    assertOpen(db, [p.date]);
    inv.payments.push(p);
    stamp(inv, user, false);
    audit(db, user, 'Recorded payment EC$' + amount.toFixed(2), '#' + inv.no);
    return { id: p.id };
  },

  deletePayment(db, user, { invoiceId, paymentId }) {
    const inv = findInvoice(db, invoiceId);
    const p = inv.payments.find(x => x.id === paymentId);
    if (!p) throw new AppError('Payment not found.');
    assertOpen(db, [p.date]);
    inv.payments = inv.payments.filter(x => x.id !== paymentId);
    stamp(inv, user, false);
    audit(db, user, 'Removed payment EC$' + p.amount.toFixed(2), '#' + inv.no);
    return {};
  },

  voidInvoice(db, user, { invoiceId, reason }) {
    const inv = findInvoice(db, invoiceId);
    if (!str(reason)) throw new AppError('Give a reason for cancelling.');
    assertOpen(db, invDates(inv));
    inv.void = { at: nowIso(), by: user.name, reason: str(reason, 200) };
    stamp(inv, user, false);
    audit(db, user, 'Cancelled invoice: ' + str(reason, 200), '#' + inv.no);
    return {};
  },

  markSent(db, user, { invoiceId, via }) {
    const inv = findInvoice(db, invoiceId);
    inv.sent.push({ at: nowIso(), by: user.name, via: str(via, 40) || 'Shared' });
    return {};
  },

  saveExpense(db, user, { expense }) {
    const e = expense || {};
    const amount = num(e.amount);
    if (amount <= 0) throw new AppError('Enter an amount greater than zero.');
    const rec = {
      daysOff: Math.max(0, Math.min(365, Math.round(num(e.daysOff)))),
      date: date(e.date, 'date'),
      truck: str(e.truck, 40) || 'Both trucks',
      category: str(e.category, 60) || 'Other',
      description: str(e.description, 200),
      amount,
      method: str(e.method, 40),
      paidBy: str(e.paidBy, 40),
      notes: str(e.notes, 500),
      workshop: str(e.workshop, 80), jobType: str(e.jobType, 60), parts: num(e.parts), labour: num(e.labour), other: num(e.other), odometer: Math.max(0, Math.round(num(e.odometer))), downtimeHours: Math.max(0, Math.min(9000, num(e.downtimeHours)))
    };
    // Off-the-road dates: hours and days are worked out here so every screen and report agrees
    const okDt = v => /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(String(v || ''));
    rec.offFrom = okDt(e.offFrom) ? String(e.offFrom) : ''; rec.offTo = rec.offFrom && okDt(e.offTo) ? String(e.offTo) : '';
    if (rec.offFrom) {
      const t = v => Date.parse(v.length === 10 ? v + 'T00:00' : v);
      if (rec.offTo) {
        const h = (t(rec.offTo) - t(rec.offFrom)) / 3600000;
        if (!(h >= 0)) throw new AppError('Back on the road must be after the truck went off the road.');
        if (h > 24 * 366) throw new AppError('That is more than a year off the road. Check the dates.');
        rec.downtimeHours = Math.round(h); rec.daysOff = Math.ceil(h / 24);
      } else { rec.downtimeHours = 0; rec.daysOff = 0; }
    }
    if (!rec.description) throw new AppError('Describe the expense.');
    assertOpen(db, [rec.date]);
    let x;
    if (e.id) { x = db.expenses.find(z => z.id === e.id); if (!x) throw new AppError('That expense no longer exists.'); if (x.void) throw new AppError('A cancelled expense cannot be edited.'); assertOpen(db, [x.date]); }
    else { x = { id: newId('e'), void: null }; db.expenses.push(x); }
    Object.assign(x, rec);
    stamp(x, user, !e.id);
    audit(db, user, (e.id ? 'Edited' : 'Added') + ' expense EC$' + amount.toFixed(2), rec.description);
    return { id: x.id };
  },

  voidExpense(db, user, { id, reason }) {
    const x = db.expenses.find(z => z.id === id);
    if (!x) throw new AppError('That expense no longer exists.');
    if (!str(reason)) throw new AppError('Give a reason for cancelling.');
    assertOpen(db, [x.date]);
    x.void = { at: nowIso(), by: user.name, reason: str(reason, 200) };
    stamp(x, user, false);
    audit(db, user, 'Cancelled expense: ' + str(reason, 200), x.description);
    return {};
  },

  saveStartup(db, user, { item }) {
    const e = item || {};
    const amount = num(e.amount);
    if (amount <= 0) throw new AppError('Enter the amount in EC$.');
    const rec = {
      date: e.date ? date(e.date, 'date') : '',
      truck: str(e.truck, 40) || 'DAF Truck 1',
      category: str(e.category, 60) || 'Other',
      description: str(e.description, 200),
      amount,
      original: str(e.original, 60),
      paidBy: str(e.paidBy, 40),
      notes: str(e.notes, 1500)
    };
    if (!rec.description) rec.description = rec.category;
    let x;
    if (e.id) { x = db.startup.find(z => z.id === e.id); if (!x) throw new AppError('That item no longer exists.'); }
    else { x = { id: newId('s') }; db.startup.push(x); }
    Object.assign(x, rec);
    stamp(x, user, !e.id);
    audit(db, user, (e.id ? 'Edited' : 'Added') + ' start-up cost EC$' + amount.toFixed(2), rec.description);
    return { id: x.id };
  },

  deleteStartup(db, user, { id }) {
    const x = db.startup.find(z => z.id === id);
    if (!x) throw new AppError('That item no longer exists.');
    db.startup = db.startup.filter(z => z.id !== id);
    audit(db, user, 'Deleted start-up cost EC$' + x.amount.toFixed(2), x.description);
    return {};
  },

  saveSettings(db, user, { settings }) {
    adminOnly(user);
    const s = settings || {};
    const out = { ...db.settings };
    ['businessName', 'phone', 'whatsapp', 'email', 'address', 'bankName', 'accountName', 'accountNumber', 'invoiceNote', 'tagline']
      .forEach(k => { if (s[k] !== undefined) out[k] = str(s[k], 300); });
    if (s.paymentDays !== undefined) out.paymentDays = Math.max(0, Math.min(120, parseInt(s.paymentDays, 10) || 0));
    if (s.defaultPrice !== undefined) out.defaultPrice = num(s.defaultPrice);
    if (s.gbpRate !== undefined) out.gbpRate = num(s.gbpRate) || out.gbpRate;
    if (s.monthlyTarget !== undefined) out.monthlyTarget = Math.max(0, num(s.monthlyTarget));
    if (Array.isArray(s.vehicles)) {
      const known = {}; (db.settings.vehicles || []).forEach(v => { known[v.id] = v; });
      const list = s.vehicles.map(v => ({ id: str(v.id, 40), nickname: str(v.nickname, 40), plate: str(v.plate, 20), make: str(v.make, 30), model: str(v.model, 40),
        year: str(v.year, 4), vin: str(v.vin, 40), active: v.active !== false })).filter(v => v.id);
      Object.keys(known).forEach(id => { if (!list.some(v => v.id === id)) list.push(Object.assign({}, known[id], { active: false })); }); // never lose a vehicle that jobs refer to
      if (new Set(list.map(v => v.id)).size !== list.length) throw new AppError('Two vehicles have the same name.');
      out.vehicles = list;
    }
    if (Array.isArray(s.drivers)) {
      out.drivers = s.drivers.map(d => ({ id: str(d.id, 40) || newId('d'), name: str(d.name, 60), phone: str(d.phone, 40), active: d.active !== false })).filter(d => d.name);
    }
    if (s.accountHolder !== undefined && user.role !== 'admin') out.accountHolder = str(s.accountHolder, 40);
    if (s.quarterlyReports !== undefined) out.quarterlyReports = !!s.quarterlyReports;
    if (Array.isArray(s.alertDays)) out.alertDays = s.alertDays.map(n => parseInt(n, 10)).filter(n => n > 0 && n <= 365).slice(0, 6).sort((a, b) => b - a);
    if (s.overdueReminderDays !== undefined) out.overdueReminderDays = Math.max(0, Math.min(90, parseInt(s.overdueReminderDays, 10) || 0));
    ['docShowLogo', 'docShowBank', 'docShowTerms', 'backupAlerts'].forEach(k => { if (s[k] !== undefined) out[k] = !!s[k]; });
    if (s.website !== undefined) out.website = str(s.website, 120);
    if (Array.isArray(s.expenseCategories)) out.expenseCategories = s.expenseCategories.map(x => str(x, 40)).filter(Boolean).slice(0, 40);
    if (s.annualReports !== undefined) out.annualReports = !!s.annualReports;
    if (s.weeklyEmail !== undefined) out.weeklyEmail = !!s.weeklyEmail;
    if (s.monthlyEmail !== undefined) out.monthlyEmail = !!s.monthlyEmail;

    const emails = v => str(v, 400).split(/[,;\s]+/).filter(Boolean);
    ['backupEmails', 'reportEmails', 'driveShare'].forEach(k => {
      if (s[k] === undefined) return;
      const list = emails(s[k]);
      if (list.some(x => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))) throw new AppError('Check the email addresses: one of them is not valid.');
      out[k] = list.join(', ');
    });
    if (Array.isArray(s.routeRates)) out.routeRates = s.routeRates.map(r => ({ route: str(r.route, 80), price: num(r.price), garbagePrice: num(r.garbagePrice), driver: num(r.driver), fuel: num(r.fuel), boat: num(r.boat), material: num(r.material), loading: num(r.loading) })).filter(r => r.route && (r.price || r.driver));
    if (s.quoteDays !== undefined) out.quoteDays = Math.max(1, Math.min(180, parseInt(s.quoteDays, 10) || 30));
    if (Array.isArray(s.partners) && user.role !== 'admin') {
      const p = s.partners.map(x => ({ name: str(x.name, 40), share: num(x.share) })).filter(x => x.name);
      const total = p.reduce((t, x) => t + x.share, 0);
      if (Math.abs(total - 100) > 0.01) throw new AppError('Partner shares must add up to 100%.');
      out.partners = p;
    }
    if (s.nextInvoiceNo !== undefined) {
      const n = parseInt(s.nextInvoiceNo, 10);
      const max = db.invoices.reduce((m, i) => Math.max(m, i.no || 0), 0);
      if (!(n > max)) throw new AppError('The next invoice number must be higher than ' + max + '.');
      db.nextInvoiceNo = n;
    }
    db.settings = out;
    audit(db, user, 'Changed business settings');
    return {};
  },

  addUser(db, user, { name, username, password, role }) {
    fullOnly(user);
    username = str(username, 40).toLowerCase();
    if (!/^[a-z0-9._-]{3,}$/.test(username)) throw new AppError('Choose a username of at least 3 letters or numbers.');
    if (db.users.some(u => u.username === username)) throw new AppError('That username is already taken.');
    checkNewPassword(password);
    const u = { id: newId('u'), name: str(name, 40) || username, username, role: ['admin', 'driver', 'other'].includes(role) ? role : 'member', active: true, mustChange: true, tokenVersion: 0, ...hashPassword(password) };
    db.users.push(u);
    audit(db, user, 'Gave access to ' + u.name, username);
    return {};
  },

  resetPassword(db, user, { userId, password }) {
    fullOnly(user);
    const u = db.users.find(x => x.id === userId);
    if (!u) throw new AppError('User not found.');
    if (u.role === 'owner' && user.role !== 'owner') throw new AppError('Only the account owner can reset their own password.');
    checkNewPassword(password);
    Object.assign(u, hashPassword(password), { mustChange: u.id !== user.id, tokenVersion: (u.tokenVersion || 0) + 1, failed: 0, lockedUntil: 0 });
    audit(db, user, 'Reset password for ' + u.name);
    return {};
  },

  setUserRole(db, user, { userId, role }) {
    fullOnly(user);
    const u = db.users.find(x => x.id === userId);
    if (!u) throw new AppError('User not found.');
    if (u.role === 'owner') throw new AppError('The account owner\'s role cannot be changed.');
    u.role = ['admin', 'driver', 'other'].includes(role) ? role : 'member';
    u.tokenVersion = (u.tokenVersion || 0) + 1;
    audit(db, user, 'Changed ' + u.name + ' to ' + ({ admin: 'admin', driver: 'driver', other: 'other', member: 'partner' }[u.role]) + ' access');
    return {};
  },

  setUserActive(db, user, { userId, active }) {
    fullOnly(user);
    const u = db.users.find(x => x.id === userId);
    if (!u) throw new AppError('User not found.');
    if (u.role === 'owner') throw new AppError('The account owner cannot be suspended or removed.');
    u.active = !!active;
    u.tokenVersion = (u.tokenVersion || 0) + 1; // signs them out everywhere
    audit(db, user, (active ? 'Restored' : 'Removed') + ' access for ' + u.name);
    return {};
  },

  changePassword(db, user, { current, password }) {
    const u = db.users.find(x => x.id === user.id);
    if (!passwordOk(u, current || '')) throw new AppError('Your current password is not right.');
    checkNewPassword(password);
    Object.assign(u, hashPassword(password), { mustChange: false });
    audit(db, user, 'Changed own password');
    return {};
  },


  // Owner only: permanently remove an invoice (for test or mistaken invoices).
  deleteInvoice(db, user, { invoiceId, confirm }) {
    adminOnly(user);
    const inv = db.invoices.find(x => x.id === invoiceId);
    if (!inv) throw new AppError('That invoice no longer exists.');
    if (parseInt(String(confirm || '').replace(/\D/g, ''), 10) !== inv.no) throw new AppError('Type the invoice number exactly to confirm.');
    if ((inv.payments || []).length) throw new AppError('This invoice has payments recorded. Remove the payments first, then delete it.');
    assertOpen(db, invDates(inv));
    db.invoices = db.invoices.filter(x => x.id !== invoiceId);
    // Unlink anything that pointed at it.
    db.bookings.forEach(b => { if (b.invoiceId === invoiceId) { b.invoiceId = null; b.status = 'Done'; } });
    db.quotes.forEach(q => { if (q.invoiceId === invoiceId) { q.invoiceId = null; q.status = 'Open'; } });
    // If it was the latest number, give that number back.
    const maxLeft = db.invoices.reduce((m, i) => Math.max(m, i.no || 0), 0);
    if (!db.invoices.length) db.nextInvoiceNo = Math.min(db.nextInvoiceNo, inv.no);
    else if (inv.no >= maxLeft && db.nextInvoiceNo > maxLeft + 1) db.nextInvoiceNo = maxLeft + 1;
    audit(db, user, 'Permanently deleted invoice #' + String(inv.no).padStart(3, '0') + ' (' + ((db.clients.find(c => c.id === inv.clientId) || {}).name || 'unknown customer') + ')', '#' + inv.no);
    return { no: inv.no, nextInvoiceNo: db.nextInvoiceNo, fileIds: (inv.attachments || []).map(a => a.id) };
  },

  // ---- merge two customer records that are the same customer (owner) ----
  mergeClients(db, user, { fromId, intoId }) {
    adminOnly(user);
    const from = db.clients.find(c => c.id === fromId), into = db.clients.find(c => c.id === intoId);
    if (!from || !into) throw new AppError('Choose both customers.');
    if (from.id === into.id) throw new AppError('Choose two different customers.');
    let inv = 0, q = 0, bk = 0;
    db.invoices.forEach(i => { if (i.clientId === from.id) { i.clientId = into.id; inv++; } });
    (db.quotes || []).forEach(x => { if (x.clientId === from.id) { x.clientId = into.id; q++; } });
    (db.bookings || []).forEach(b => { if ((b.client || '').trim().toLowerCase() === from.name.trim().toLowerCase()) { b.client = into.name; bk++; } });
    ['phone', 'email', 'address', 'whatsapp'].forEach(k => { if (!into[k] && from[k]) into[k] = from[k]; });
    if (from.notes && from.notes !== into.notes) into.notes = [into.notes, from.notes].filter(Boolean).join('\n');
    db.clients = db.clients.filter(c => c.id !== from.id);
    audit(db, user, 'Merged customer "' + from.name + '" into "' + into.name + '" (' + inv + ' invoices, ' + q + ' quotes, ' + bk + ' bookings)');
    return { invoices: inv, quotes: q, bookings: bk };
  },

  // ---- month-end: close or reopen one month at a time (owner) ----
  closeMonth(db, user, { month }) {
    adminOnly(user);
    const m = str(month, 7);
    if (!YM.test(m)) throw new AppError('Choose the month.');
    if (m >= new Date(Date.now() - 4 * 3600000).toISOString().slice(0, 7)) throw new AppError('Only months that have finished can be closed.');
    if (isClosed(db, m)) return {};
    db.settings.closedMonths = closedMonths(db).concat([m]).sort();
    db.settings.closedInfo = Object.assign({}, db.settings.closedInfo, { [m]: { closedBy: user.name, closedAt: nowIso() } });
    audit(db, user, 'Closed ' + monthName(m));
    return {};
  },
  reopenMonth(db, user, { month, reason }) {
    adminOnly(user);
    const m = str(month, 7), why = str(reason, 200);
    if (!isClosed(db, m)) return {};
    if (!why) throw new AppError('Say why the month is being reopened. It is kept in the Activity Log.');
    db.settings.closedMonths = closedMonths(db).filter(x => x !== m);
    const info = Object.assign({}, (db.settings.closedInfo || {})[m], { reopenedBy: user.name, reopenedAt: nowIso(), reason: why });
    db.settings.closedInfo = Object.assign({}, db.settings.closedInfo, { [m]: info });
    audit(db, user, 'Reopened ' + monthName(m) + ': ' + why);
    return {};
  },

  // ---- invitations (owner) ----
  createInvite(db, user, { name, role, code }) {
    fullOnly(user);
    const n = str(name, 60); if (!n) throw new AppError('Enter the person\'s name.');
    if (!['member', 'admin', 'driver', 'other'].includes(role)) throw new AppError('Choose a role.');
    if (!/^[a-f0-9]{48}$/.test(String(code || ''))) throw new AppError('Invitation code missing.');
    const inv = { id: newId('iv'), hash: crypto.createHash('sha256').update(code).digest('hex'), name: n, role, expires: new Date(Date.now() + 72 * 3600000).toISOString(), createdBy: user.name, at: nowIso() };
    db.invites.push(inv); audit(db, user, 'Invited ' + n + ' (' + role + ')');
    return { id: inv.id, expires: inv.expires };
  },
  cancelInvite(db, user, { id }) { fullOnly(user); const i = db.invites.find(x => x.id === id); if (!i) throw new AppError('Invitation not found.'); i.usedAt = i.usedAt || 'cancelled'; audit(db, user, 'Cancelled invitation for ' + i.name); return {}; },
  // ---- sessions: see and sign out devices ----
  revokeSession(db, user, { id, others, current }) {
    const u = db.users.find(x => x.id === user.id);
    const before = (u.sessions || []).length;
    if (!others && id === current) throw new AppError('Use Sign Out to sign out of this device.');
    u.sessions = (u.sessions || []).filter(x => others ? x.id === current : x.id !== id);
    if (others && !current) throw new AppError('Sign out and back in once on this device first, so it can stay signed in.');
    audit(db, u, others ? 'Signed out other devices' : 'Signed out a device');
    return { removed: before - u.sessions.length };
  },
  // ---- per-person notification preferences ----
  saveNotify(db, user, { notify }) {
    const n = notify || {}, u = db.users.find(x => x.id === user.id), out = {};
    ['collections', 'bookings', 'maintenance', 'reports', 'security', 'summary'].forEach(k => { out[k] = n[k] !== false; });
    out.summaryFreq = ['weekly', 'monthly', 'both'].includes(n.summaryFreq) ? n.summaryFreq : 'weekly';
    u.notify = out; return {};
  },
  // ---- vehicle incidents and breakdowns ----
  saveIncident(db, user, { incident }) {
    const x0 = incident || {};
    const rec = { truck: str(x0.truck, 40), date: date(x0.date, 'date'), type: str(x0.type, 40) || 'Breakdown', location: str(x0.location, 80), description: str(x0.description, 400),
      estimate: num(x0.estimate), status: ['Open', 'Awaiting repair', 'Resolved'].includes(x0.status) ? x0.status : 'Open',
      offFrom: x0.offFrom && ISO.test(x0.offFrom) ? x0.offFrom : '', offTo: x0.offTo && ISO.test(x0.offTo) ? x0.offTo : '' };
    if (!(db.settings.vehicles || []).some(v => v.id === rec.truck)) throw new AppError('Choose the vehicle.');
    if (!rec.description) throw new AppError('Describe what happened.');
    if (rec.offFrom && rec.offTo && rec.offTo < rec.offFrom) throw new AppError('The truck cannot be back before it went off the road.');
    let x;
    if (x0.id) { x = db.incidents.find(z => z.id === x0.id); if (!x) throw new AppError('That incident no longer exists.'); }
    else { x = { id: newId('in') }; db.incidents.push(x); }
    Object.assign(x, rec); stamp(x, user, !x0.id);
    audit(db, user, (x0.id ? 'Updated ' : 'Recorded ') + rec.type.toLowerCase() + ' on ' + rec.truck, rec.date);
    return { id: x.id };
  },
  deleteIncident(db, user, { id }) { adminOnly(user); const x = db.incidents.find(z => z.id === id); if (!x) throw new AppError('That incident no longer exists.'); db.incidents = db.incidents.filter(z => z.id !== id); audit(db, user, 'Deleted incident on ' + x.truck); return {}; },

  // ---- each person's own display preferences (Home layout, theme, density) ----
  savePrefs(db, user, { prefs }) {
    const p = prefs || {}, u = db.users.find(x => x.id === user.id);
    const list = (v, max) => Array.isArray(v) ? v.map(x => str(x, 20)).filter(Boolean).slice(0, max) : undefined;
    const out = Object.assign({}, u.prefs || {});
    if (list(p.homeOrder, 40)) out.homeOrder = list(p.homeOrder, 40);
    if (list(p.homeOff, 40)) out.homeOff = list(p.homeOff, 40);
    if (list(p.quick, 20)) out.quick = list(p.quick, 20);
    if (p.hideAmounts !== undefined) out.hideAmounts = !!p.hideAmounts;
    if (p.reduceMotion !== undefined) out.reduceMotion = !!p.reduceMotion;
    if (['comfortable', 'compact'].includes(p.density)) out.density = p.density;
    if (['auto', 'light', 'dark'].includes(p.theme)) out.theme = p.theme;
    u.prefs = out;
    return {};
  },

  // ---- cash flow forecast assumptions (partners); the opening balance must be confirmed by a person ----
  saveForecast(db, user, { forecast }) {
    const f = forecast || {}, old = db.settings.forecast || {};
    const pick = (k, d, max) => f[k] === undefined ? (old[k] !== undefined ? old[k] : d) : Math.max(0, Math.min(max, parseInt(f[k], 10) || 0));
    const out = { baseDelay: pick('baseDelay', 0, 120), cautiousDelay: pick('cautiousDelay', 14, 120), optimisticRecovery: pick('optimisticRecovery', 50, 100),
      partnerTransfers: f.partnerTransfers === undefined ? old.partnerTransfers !== false : f.partnerTransfers !== false, runningCosts: f.runningCosts === undefined ? old.runningCosts !== false : f.runningCosts !== false };
    if (f.openingBalance === null || f.openingBalance === '' || f.openingBalance === undefined) Object.assign(out, { openingBalance: null, openingDate: '', confirmedBy: '' });
    else {
      out.openingBalance = num(f.openingBalance);
      const same = old.openingBalance === out.openingBalance;
      out.openingDate = same && old.openingDate ? old.openingDate : new Date().toISOString().slice(0, 10);
      out.confirmedBy = same && old.confirmedBy ? old.confirmedBy : user.name;
    }
    db.settings.forecast = out;
    audit(db, user, 'Updated cash flow forecast settings' + (out.openingBalance != null && old.openingBalance !== out.openingBalance ? ' (opening balance EC$' + out.openingBalance.toFixed(2) + ')' : ''));
    return {};
  },

  // ---- how a paid invoice's money was used: shared, partly used for business costs, or kept ----
  setInvoiceFunds(db, user, { invoiceId, mode, links }) {
    const inv = db.invoices.find(i => i.id === invoiceId);
    if (!inv || inv.void) throw new AppError('That invoice no longer exists.');
    if (calcBalance(inv) > 0.009) throw new AppError('Record the customer payment first.');
    const m = ['full', 'part', 'all'].includes(mode) ? mode : 'full';
    const clean = m === 'full' ? [] : (Array.isArray(links) ? links : []).map(l => ({ expenseId: str(l.expenseId, 40), amount: round2(num(l.amount)) })).filter(l => l.amount > 0);
    const seen = new Set();
    clean.forEach(l => {
      const e = db.expenses.find(x => x.id === l.expenseId && !x.void);
      if (!e) throw new AppError('A linked expense no longer exists.');
      if (seen.has(e.id)) throw new AppError('An expense is linked twice.'); seen.add(e.id);
      const other = expenseFunding(db, e.id, inv.id).total;
      if (l.amount > round2(e.amount - other) + 0.005) throw new AppError(e.description + ': only EC$' + Math.max(0, e.amount - other).toFixed(2) + ' of it is left to be paid from an invoice.');
    });
    const total = round2(clean.reduce((t, l) => t + l.amount, 0)), profit = invJobProfit(inv);
    if (total > Math.max(0, profit) + 0.005) throw new AppError('The linked amounts (EC$' + total.toFixed(2) + ') are more than this invoice\'s job profit (EC$' + profit.toFixed(2) + ').');
    inv.useOfFunds = { mode: m, links: clean, by: user.name, at: nowIso() };
    audit(db, user, m === 'full' ? 'Set invoice money to be shared as normal' : m === 'all' ? 'Kept invoice money for business costs' : 'Linked EC$' + total.toFixed(2) + ' of business costs to the invoice', '#' + String(inv.no).padStart(3, '0'));
    return {};
  },

  // ---- partner transactions: transfers and settlements between the partners (never business expenses) ----
  savePartnerTx(db, user, { tx }) {
    const t = tx || {};
    const names = (db.settings.partners || []).map(p => p.name);
    const rec = { date: date(t.date, 'date'), from: str(t.from, 40), to: str(t.to, 40), amount: num(t.amount),
      type: ['Profit share', 'Expense settlement', 'Other'].includes(t.type) ? t.type : 'Other',
      invoiceId: str(t.invoiceId, 40), method: str(t.method, 40) || 'Bank transfer', reference: str(t.reference, 80), note: str(t.note, 300) };
    if (rec.amount <= 0) throw new AppError('Enter the amount transferred.');
    if (!names.includes(rec.from) || !names.includes(rec.to) || rec.from === rec.to) throw new AppError('Choose who paid and who received it.');
    if (rec.invoiceId) {
      const inv = db.invoices.find(i => i.id === rec.invoiceId);
      if (!inv) throw new AppError('That invoice no longer exists.');
      if (calcBalance(inv) > 0.009) throw new AppError('Record the customer payment first; the transfer follows once the invoice is paid.');
    }
    let x;
    if (t.id) { x = db.partnerTx.find(z => z.id === t.id); if (!x) throw new AppError('That transaction no longer exists.'); }
    else { x = { id: newId('pt') }; db.partnerTx.push(x); }
    Object.assign(x, rec); stamp(x, user, !t.id);
    audit(db, user, (t.id ? 'Edited' : 'Recorded') + ' partner transfer EC$' + rec.amount.toFixed(2) + ' from ' + rec.from + ' to ' + rec.to, rec.invoiceId ? '#' + ((db.invoices.find(i => i.id === rec.invoiceId) || {}).no || '') : '');
    return { id: x.id };
  },

  deletePartnerTx(db, user, { id }) {
    adminOnly(user);
    const x = db.partnerTx.find(z => z.id === id);
    if (!x) throw new AppError('That transaction no longer exists.');
    db.partnerTx = db.partnerTx.filter(z => z.id !== id);
    audit(db, user, 'Deleted partner transfer EC$' + x.amount.toFixed(2) + ' (' + x.date + ')');
    return {};
  },

  // ---- driver pay: what was paid to each driver (owed = their driver fees on jobs, less these payments) ----
  saveDriverPay(db, user, { pay }) {
    const p = pay || {};
    const drv = (db.settings.drivers || []).find(d => d.id === p.driverId);
    if (!drv) throw new AppError('Choose the driver.');
    const rec = { driverId: drv.id, date: date(p.date, 'date'), amount: num(p.amount), method: str(p.method, 40) || 'Cash', paidBy: str(p.paidBy, 40), note: str(p.note, 300) };
    if (rec.amount <= 0) throw new AppError('Enter the amount paid.');
    let x;
    if (p.id) { x = db.driverPay.find(z => z.id === p.id); if (!x) throw new AppError('That payment no longer exists.'); }
    else { x = { id: newId('dp') }; db.driverPay.push(x); }
    Object.assign(x, rec); stamp(x, user, !p.id);
    audit(db, user, (p.id ? 'Edited' : 'Recorded') + ' driver payment EC$' + rec.amount.toFixed(2) + ' to ' + drv.name);
    return { id: x.id };
  },

  deleteDriverPay(db, user, { id }) {
    adminOnly(user);
    const x = db.driverPay.find(z => z.id === id);
    if (!x) throw new AppError('That payment no longer exists.');
    db.driverPay = db.driverPay.filter(z => z.id !== id);
    audit(db, user, 'Deleted driver payment EC$' + x.amount.toFixed(2));
    return {};
  },

  // ---- quotes ----
  saveQuote(db, user, { quote }) {
    if (!quote) throw new AppError('Nothing to save.');
    const lines = (quote.lines || []).map(l => cleanLine(l, db.settings));
    if (!lines.length) throw new AppError('Add at least one line to the quote.');
    requireDriverFees(lines, quote.id ? (db.quotes.find(x => x.id === quote.id) || {}).lines : null);
    const client = upsertClient(db, quote.client || {}, user);
    const issueDate = date(quote.issueDate, 'quote date');
    const validUntil = quote.validUntil ? date(quote.validUntil, 'valid-until date') : addDays(issueDate, db.settings.quoteDays || 30);
    let q;
    if (quote.id) {
      q = db.quotes.find(x => x.id === quote.id);
      if (!q) throw new AppError('That quote no longer exists.');
      if (q.status === 'Accepted') throw new AppError('This quote has already become an invoice.');
    } else {
      q = { id: newId('q'), no: db.nextQuoteNo++, status: 'Open', sent: [] };
      db.quotes.push(q);
    }
    Object.assign(q, { clientId: client.id, issueDate, validUntil, lines, notes: str(quote.notes, 500), internalNotes: str(quote.internalNotes, 1000) });
    stamp(q, user, !quote.id);
    audit(db, user, quote.id ? 'Edited quote' : 'Created quote', 'Q' + q.no);
    return { id: q.id, no: q.no };
  },

  setQuoteStatus(db, user, { quoteId, status }) {
    const q = db.quotes.find(x => x.id === quoteId);
    if (!q) throw new AppError('That quote no longer exists.');
    if (!['Open', 'Declined'].includes(status)) throw new AppError('Unknown status.');
    if (q.status === 'Accepted') throw new AppError('This quote has already become an invoice.');
    q.status = status; stamp(q, user, false);
    audit(db, user, 'Marked quote ' + status.toLowerCase(), 'Q' + q.no);
    return {};
  },

  deleteQuote(db, user, { quoteId }) {
    const q = db.quotes.find(x => x.id === quoteId);
    if (!q) throw new AppError('That quote no longer exists.');
    if (q.status === 'Accepted') throw new AppError('This quote has become an invoice and is kept for the record.');
    db.quotes = db.quotes.filter(x => x.id !== quoteId);
    audit(db, user, 'Deleted quote', 'Q' + q.no);
    return {};
  },

  convertQuote(db, user, { quoteId, jobDate }) {
    const q = db.quotes.find(x => x.id === quoteId);
    if (!q) throw new AppError('That quote no longer exists.');
    if (q.status === 'Accepted') throw new AppError('This quote has already become an invoice.');
    const d = jobDate ? date(jobDate, 'job date') : new Date().toISOString().slice(0, 10);
    assertOpen(db, [d]);
    q.lines.forEach(l => {
      if ((l.costs || {}).driver > 0) return;
      const rate = (db.settings.routeRates || []).find(r => r.route === l.route);
      if (rate && rate.driver > 0) { l.costs = Object.assign({}, l.costs, { driver: rate.driver }); return; }
      throw new AppError('Add the driver fee to this quote (Edit quote) before turning it into an invoice.');
    });
    const inv = { id: newId('i'), no: db.nextInvoiceNo++, clientId: q.clientId, issueDate: d, dueDate: addDays(d, db.settings.paymentDays),
      lines: q.lines.map(l => ({ ...l, id: newId('l'), date: d })), notes: q.notes, internalNotes: (q.internalNotes ? q.internalNotes + ' | ' : '') + 'From quote Q' + q.no,
      payments: [], sent: [], void: null, fromQuote: q.id };
    stamp(inv, user, true);
    db.invoices.push(inv);
    q.status = 'Accepted'; q.invoiceId = inv.id; stamp(q, user, false);
    audit(db, user, 'Turned quote Q' + q.no + ' into invoice', '#' + inv.no);
    return { id: inv.id, no: inv.no };
  },

  markQuoteSent(db, user, { quoteId, via }) {
    const q = db.quotes.find(x => x.id === quoteId);
    if (!q) throw new AppError('That quote no longer exists.');
    q.sent.push({ at: nowIso(), by: user.name, via: str(via, 40) || 'Shared' });
    return {};
  },

  // ---- truck reminders ----
  saveReminder(db, user, { reminder }) {
    const r = reminder || {};
    const rec = { truck: str(r.truck, 40) || 'DAF Truck 1', type: str(r.type, 60) || 'Other', due: r.due ? date(r.due, 'due date') : '',
      dueKm: Math.max(0, Math.round(num(r.dueKm))), everyKm: Math.max(0, Math.round(num(r.everyKm))),
      repeatMonths: Math.max(0, Math.min(60, parseInt(r.repeatMonths, 10) || 0)), note: str(r.note, 300), expectedCost: num(r.expectedCost) };
    if (!rec.due && !rec.dueKm) throw new AppError('Give a due date, a due mileage, or both.');
    let x;
    if (r.id) { x = db.reminders.find(z => z.id === r.id); if (!x) throw new AppError('That reminder no longer exists.'); }
    else { x = { id: newId('r'), history: [] }; db.reminders.push(x); }
    Object.assign(x, rec);
    stamp(x, user, !r.id);
    audit(db, user, (r.id ? 'Edited' : 'Added') + ' reminder: ' + rec.type, rec.truck);
    return { id: x.id };
  },

  completeReminder(db, user, { id, doneDate, cost, method, odometer }) {
    const x = db.reminders.find(z => z.id === id);
    if (!x) throw new AppError('That reminder no longer exists.');
    const done = doneDate ? date(doneDate, 'date done') : new Date().toISOString().slice(0, 10);
    if (num(cost) > 0) assertOpen(db, [done]);
    x.history = x.history || [];
    x.history.unshift({ due: x.due, dueKm: x.dueKm, done, odometer: Math.round(num(odometer)) || 0, by: user.name, cost: num(cost) });
    let expenseId = null;
    if (num(cost) > 0) {
      const e = { id: newId('e'), date: done, truck: x.truck, category: /insur/i.test(x.type) ? 'Insurance' : /licen|tax|inspect/i.test(x.type) ? 'Licensing' : 'Maintenance',
        description: x.type + (x.note ? ' - ' + x.note : ''), amount: num(cost), method: str(method, 40) || 'Cash', paidBy: '', notes: 'From reminder', void: null };
      stamp(e, user, true); db.expenses.push(e); expenseId = e.id;
    }
    const odo = Math.round(num(odometer)) || latestOdometer(db, x.truck);
    if (x.repeatMonths || x.everyKm) {
      if (x.repeatMonths && x.due) {
        const [y, m, d] = x.due.split('-').map(Number);
        x.due = new Date(Date.UTC(y, m - 1 + x.repeatMonths, d)).toISOString().slice(0, 10);
      }
      if (x.everyKm) x.dueKm = (odo || x.dueKm || 0) + x.everyKm;
    } else {
      db.reminders = db.reminders.filter(z => z.id !== id);
    }
    audit(db, user, 'Completed ' + x.type, x.truck);
    return { expenseId };
  },

  deleteReminder(db, user, { id }) {
    const x = db.reminders.find(z => z.id === id);
    if (!x) throw new AppError('That reminder no longer exists.');
    db.reminders = db.reminders.filter(z => z.id !== id);
    audit(db, user, 'Deleted reminder: ' + x.type, x.truck);
    return {};
  },

  // ---- partner capital records ----
  saveCapital(db, user, { entry }) {
    const e = entry || {};
    const amount = num(e.amount);
    if (amount <= 0) throw new AppError('Enter the EC$ value.');
    const rec = { partner: str(e.partner, 40), type: e.type === 'drawing' ? 'drawing' : 'contribution', truck: str(e.truck, 40), item: str(e.item, 120),
      original: str(e.original, 60), gbp: num(e.gbp), amount, date: e.date ? date(e.date, 'date') : '', notes: str(e.notes, 1500) };
    if (!rec.partner) throw new AppError('Choose the partner.');
    if (!rec.item) rec.item = rec.type === 'drawing' ? 'Profit paid out' : 'Contribution';
    let x;
    if (e.id) { x = db.capital.find(z => z.id === e.id); if (!x) throw new AppError('That record no longer exists.'); }
    else { x = { id: newId('k') }; db.capital.push(x); }
    Object.assign(x, rec);
    stamp(x, user, !e.id);
    audit(db, user, (e.id ? 'Edited ' : 'Added ') + rec.type + ' for ' + rec.partner, 'EC$' + amount.toFixed(2));
    return { id: x.id };
  },

  deleteCapital(db, user, { id }) {
    const x = db.capital.find(z => z.id === id);
    if (!x) throw new AppError('That record no longer exists.');
    db.capital = db.capital.filter(z => z.id !== id);
    audit(db, user, 'Deleted ' + x.type + ' for ' + x.partner, x.item);
    return {};
  },

  // ---- attachment records (file contents live in a separate store) ----
  addAttachment(db, user, { target, file }) {
    if (user.role === 'driver' && !['booking', 'fuel', 'incident'].includes(target && target.kind)) throw new AppError('Your access does not include that.', 403);
    const rec = findTarget(db, target);
    rec.attachments = rec.attachments || [];
    if (rec.attachments.length >= (target.kind === 'vehicle' ? 60 : 10)) throw new AppError('No more room for files on this record.');
    rec.attachments.push({ id: str(file.id, 60), name: str(file.name, 120), type: str(file.type, 60), size: Number(file.size) || 0, at: nowIso(), by: user.name,
      docType: str(file.docType, 40), expires: file.expires && ISO.test(file.expires) ? file.expires : '' });
    audit(db, user, 'Attached ' + str(file.name, 120), target.kind);
    return {};
  },

  removeAttachment(db, user, { target, fileId }) {
    const rec = findTarget(db, target);
    rec.attachments = (rec.attachments || []).filter(a => a.id !== fileId);
    audit(db, user, 'Removed attachment', target.kind);
    return {};
  },


  // ---- bookings (jobs planned ahead) ----
  saveBooking(db, user, { booking }) {
    const b = booking || {};
    const driver = user.role === 'driver';
    const rec = {
      date: date(b.date, 'job date'), time: str(b.time, 10), truck: str(b.truck, 40) || 'DAF Truck 1', route: str(b.route, 80),
      client: str(b.client, 100), phone: str(b.phone, 40), load: str(b.load, 80), title: str(b.title, 120), sailing: str(b.sailing, 120),
      notes: str(b.notes, 1000), driverId: str(b.driverId, 40)
    };
    if (!rec.client) throw new AppError('Enter the customer.');
    let x;
    if (b.id) {
      x = db.bookings.find(z => z.id === b.id);
      if (!x) throw new AppError('That booking no longer exists.');
      if (x.status === 'Invoiced') throw new AppError('This job has been invoiced; edit the invoice instead.');
    } else {
      x = { id: newId('b'), status: b.status === 'Done' ? 'Done' : b.status === 'Tentative' ? 'Tentative' : 'Booked', reportedBy: '' };
      db.bookings.push(x);
      if (x.status === 'Done') { x.doneAt = nowIso(); x.reportedBy = user.name; }
    }
    if (!driver) { rec.price = num(b.price); rec.qty = num(b.qty) || 1; rec.category = str(b.category, 60) || 'Building Materials';
      rec.costs = COST_KEYS.reduce((o, k) => { o[k] = num(b.costs && b.costs[k]); return o; }, {}); rec.driverId = str(b.driverId, 40); }
    else if (b.costs) { rec.costs = Object.assign({}, x.costs || {}, { fuel: num(b.costs.fuel), boat: num(b.costs.boat) }); }
    Object.assign(x, rec);
    stamp(x, user, !b.id);
    if (b.id && ['Tentative', 'Booked'].includes(b.status) && ['Tentative', 'Booked'].includes(x.status) && user.role !== 'driver') x.status = b.status;
    audit(db, user, (b.id ? 'Edited booking' : (x.status === 'Done' ? 'Reported job' : 'Booked job')) + ' for ' + rec.client, rec.date);
    return { id: x.id };
  },

  setBookingStatus(db, user, { id, status, note }) {
    const x = db.bookings.find(z => z.id === id);
    if (!x) throw new AppError('That booking no longer exists.');
    if (x.status === 'Invoiced') throw new AppError('This job has already been invoiced.');
    if (!['Tentative', 'Booked', 'Done', 'Cancelled'].includes(status)) throw new AppError('Unknown status.');
    if (user.role === 'driver' && status === 'Cancelled') throw new AppError('Ask the office to cancel a booking.');
    x.status = status;
    if (status === 'Done') { x.doneAt = nowIso(); x.reportedBy = user.name; }
    if (note) x.notes = (x.notes ? x.notes + '\n' : '') + user.name + ': ' + str(note, 500);
    stamp(x, user, false);
    audit(db, user, 'Marked booking ' + status.toLowerCase(), x.client);
    return {};
  },

  deleteBooking(db, user, { id }) {
    const x = db.bookings.find(z => z.id === id);
    if (!x) throw new AppError('That booking no longer exists.');
    if (x.status === 'Invoiced') throw new AppError('This job has been invoiced and is kept for the record.');
    db.bookings = db.bookings.filter(z => z.id !== id);
    audit(db, user, 'Deleted booking', x.client);
    return {};
  },

  // ---- fuel and mileage ----
  saveFuel(db, user, { entry }) {
    const e = entry || {};
    const litres = num(e.litres), cost = num(e.cost), odometer = Math.round(num(e.odometer));
    if (litres <= 0) throw new AppError('Enter the litres.');
    if (odometer <= 0) throw new AppError('Enter the odometer reading.');
    const rec = { date: date(e.date, 'date'), truck: str(e.truck, 40) || 'DAF Truck 1', litres, cost, odometer, full: e.full !== false, station: str(e.station, 80), notes: str(e.notes, 300), driverId: str(e.driverId, 40) };
    if (litres > 1500) throw new AppError('That is more litres than a truck tank holds. Check the figure.');
    const prev = db.fuel.filter(f => f.truck === rec.truck && f.id !== e.id && f.date <= rec.date).sort((a, b) => a.odometer - b.odometer).pop();
    if (prev && odometer < prev.odometer) throw new AppError('That odometer reading is lower than the last one for this truck (' + prev.odometer + ').');
    let x;
    if (e.id) { x = db.fuel.find(z => z.id === e.id); if (!x) throw new AppError('That entry no longer exists.'); }
    else { x = { id: newId('fu') }; db.fuel.push(x); }
    Object.assign(x, rec);
    stamp(x, user, !e.id);
    if (!e.id && e.asExpense && cost > 0 && user.role !== 'driver') {
      assertOpen(db, [rec.date]);
      const ex = { id: newId('e'), date: rec.date, truck: rec.truck, category: 'Fuel', description: litres + ' L fuel' + (rec.station ? ' at ' + rec.station : ''), amount: cost, method: 'Cash', paidBy: '', notes: 'From fuel log', void: null };
      stamp(ex, user, true); db.expenses.push(ex); x.expenseId = ex.id;
    }
    audit(db, user, (e.id ? 'Edited' : 'Logged') + ' fuel ' + litres + ' L', rec.truck);
    return { id: x.id };
  },

  deleteFuel(db, user, { id }) {
    const x = db.fuel.find(z => z.id === id);
    if (!x) throw new AppError('That entry no longer exists.');
    if (user.role === 'driver' && x.createdBy !== user.name) throw new AppError('Ask the office to remove this entry.');
    db.fuel = db.fuel.filter(z => z.id !== id);
    audit(db, user, 'Deleted fuel entry', x.truck);
    return {};
  },

  // ---- phone notifications ----
  savePushSub(db, user, { sub, prefs }) {
    if (!sub || !sub.endpoint || !sub.keys) throw new AppError('Notifications could not be set up on this device.');
    db.pushSubs = db.pushSubs.filter(p => p.endpoint !== sub.endpoint);
    db.pushSubs.push({ userId: user.id, endpoint: str(sub.endpoint, 1000), keys: { p256dh: str(sub.keys.p256dh, 200), auth: str(sub.keys.auth, 100) },
      prefs: Object.assign({ overdue: true, reminders: true, weekly: true, bookings: true }, prefs || {}), at: nowIso() });
    return {};
  },

  updatePushPrefs(db, user, { endpoint, prefs }) {
    const p = db.pushSubs.find(x => x.endpoint === endpoint && x.userId === user.id);
    if (!p) throw new AppError('Notifications are not switched on for this device.');
    p.prefs = Object.assign(p.prefs || {}, prefs || {});
    return {};
  },

  removePushSub(db, user, { endpoint }) {
    db.pushSubs = db.pushSubs.filter(p => !(p.endpoint === endpoint && p.userId === user.id));
    return {};
  },

  importData(db, user, { payload, replace }) {
    fullOnly(user);
    const p = payload || {};
    const hasData = db.invoices.length || db.expenses.length || db.startup.length;
    if (hasData && !replace) throw new AppError('The app already holds records. Tick "Replace existing records" to import anyway.');
    const clients = [], invoices = [], expenses = [], startup = [];
    const clientByName = {};
    (p.invoices || []).forEach(src => {
      const name = str(src.client, 100) || 'Unknown customer';
      let c = clientByName[name.toLowerCase()];
      if (!c) { c = { id: newId('c'), name, phone: '', email: '', address: '', notes: '', createdBy: user.name, createdAt: nowIso() }; clientByName[name.toLowerCase()] = c; clients.push(c); }
      const lines = (src.lines || []).map(l => cleanLine(l, db.settings));
      if (!lines.length) return;
      const issueDate = date(src.issueDate, 'invoice date');
      invoices.push({
        id: newId('i'), no: parseInt(src.no, 10) || 0, clientId: c.id, issueDate,
        dueDate: addDays(issueDate, db.settings.paymentDays), lines, notes: str(src.notes, 500), internalNotes: str(src.internalNotes, 1000),
        payments: (src.payments || []).map(x => ({ id: newId('p'), date: date(x.date, 'payment date'), amount: num(x.amount), method: str(x.method, 40), note: str(x.note, 200), by: 'Import', at: nowIso() })),
        sent: [], void: null, createdBy: 'Import', createdAt: nowIso(), updatedBy: 'Import', updatedAt: nowIso()
      });
    });
    (p.expenses || []).forEach(e => {
      const amount = num(e.amount); if (amount <= 0) return;
      expenses.push({ id: newId('e'), date: date(e.date, 'date'), truck: str(e.truck, 40), category: str(e.category, 60), description: str(e.description, 200) || str(e.category, 60), amount, method: str(e.method, 40), paidBy: '', notes: str(e.notes, 500), void: null, createdBy: 'Import', createdAt: nowIso() });
    });
    (p.startup || []).forEach(s => {
      const amount = num(s.amount); if (amount <= 0) return;
      startup.push({ id: newId('s'), date: '', truck: str(s.truck, 40), category: str(s.category, 60), description: str(s.description, 200) || str(s.category, 60), amount, original: str(s.original, 60), paidBy: str(s.paidBy, 40), notes: str(s.notes, 1500), createdBy: 'Import', createdAt: nowIso() });
    });
    const capital = [];
    (p.capital || []).forEach(k => {
      const amount = num(k.amount); if (amount <= 0) return;
      capital.push({ id: newId('k'), partner: str(k.partner, 40), type: 'contribution', truck: str(k.truck, 40), item: str(k.item, 120), original: str(k.original, 60),
        gbp: num(k.gbp), amount, date: '', notes: str(k.notes, 1500), createdBy: 'Import', createdAt: nowIso() });
    });
    if (!invoices.length && !expenses.length) throw new AppError('No records were found in that file.');
    db.clients = clients; db.invoices = invoices; db.expenses = expenses; db.startup = startup;
    if (capital.length) db.capital = capital;
    if (num(p.gbpRate) > 0) db.settings.gbpRate = num(p.gbpRate);
    db.nextInvoiceNo = Math.max(db.nextInvoiceNo, invoices.reduce((m, i) => Math.max(m, i.no), 0) + 1);
    audit(db, user, 'Imported workbook: ' + invoices.length + ' invoices, ' + expenses.length + ' expenses, ' + startup.length + ' start-up items');
    return { invoices: invoices.length, expenses: expenses.length, startup: startup.length, clients: clients.length, capital: capital.length };
  }
};

// ---- closed months: once a month is closed, nothing dated in it can change ----
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YM = /^\d{4}-\d{2}$/;
export const monthName = ym => MONTHS[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4);
export function closedMonths(db) { return ((db.settings && db.settings.closedMonths) || []).filter(m => YM.test(m)); }
export const isClosed = (db, ym) => closedMonths(db).includes(ym);
/** Kept for anything older that asks for a single cut-off: the latest closed month's last day. */
export function lockEnd(db) {
  const c = closedMonths(db).sort(); if (!c.length) return '';
  const [y, mo] = c[c.length - 1].split('-').map(Number);
  return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
}
function assertOpen(db, dates) {
  const hit = (dates || []).filter(Boolean).map(d => String(d).slice(0, 7)).find(m => isClosed(db, m));
  if (hit) throw new AppError(monthName(hit) + ' is closed, so records dated in it can no longer be changed. Reopen the month under Manage, Month-End if a correction is needed.');
}
const invDates = inv => [inv.issueDate].concat((inv.lines || []).map(l => l.date));

function findInvoice(db, id) {
  const inv = db.invoices.find(x => x.id === id);
  if (!inv) throw new AppError('That invoice no longer exists.');
  if (inv.void) throw new AppError('That invoice has been cancelled.');
  return inv;
}
function findTarget(db, t) {
  if (t && t.kind === 'vehicle') { const v = (db.settings.vehicles || []).find(x => x.id === t.id); if (!v) throw new AppError('That vehicle no longer exists.'); return v; }
  const list = { invoice: db.invoices, expense: db.expenses, quote: db.quotes, booking: db.bookings, fuel: db.fuel, incident: db.incidents }[t && t.kind];
  const rec = list && list.find(x => x.id === t.id);
  if (!rec) throw new AppError('That record no longer exists.');
  return rec;
}
export function latestOdometer(db, truck) {
  return (db.fuel || []).filter(f => f.truck === truck).reduce((m, f) => Math.max(m, f.odometer || 0), 0);
}
export const OTHER_ACTIONS = ['savePrefs', 'saveNotify', 'revokeSession', 'changePassword', 'savePushSub', 'updatePushPrefs', 'removePushSub'];
export const DRIVER_ACTIONS = ['savePrefs', 'saveNotify', 'revokeSession', 'saveIncident', 'addAttachment', 'saveBooking', 'setBookingStatus', 'saveFuel', 'deleteFuel', 'changePassword', 'savePushSub', 'updatePushPrefs', 'removePushSub', 'markSent'];
function ownerOnly(user) { if (user.role !== 'owner') throw new AppError('Only the account owner can do that.', 403); }
/** Partners: everything except overall control (team access, restoring a backup, importing). */
function adminOnly(user) { if (!['owner', 'member', 'admin'].includes(user.role)) throw new AppError('Your access does not include that.', 403); }
/** Overall control (team access, ownership shares, importing): the owner and partners, not admins. */
function fullOnly(user) { if (user.role !== 'owner' && user.role !== 'member') throw new AppError('Only a partner can do that.', 403); }

/** What the app receives: everything except password data. */
export function clientView(db, user) {
  if (user.role === 'driver') {
    const s = db.settings;
    return {
      me: publicUser(user),
      settings: { businessName: s.businessName, phone: s.phone, partners: [], defaultPrice: 0, paymentDays: s.paymentDays, vehicles: s.vehicles, drivers: (s.drivers || []).map(d => ({ id: d.id, name: d.name })) },
      clients: db.clients.map(c => ({ id: c.id, name: c.name, phone: c.phone || '' })),
      bookings: db.bookings.map(b => { const { price, qty, costs, category, ...rest } = b; return Object.assign(rest, { costs: costs ? { fuel: costs.fuel || 0, boat: costs.boat || 0 } : {} }); }),
      fuel: db.fuel, reminders: db.reminders, incidents: db.incidents, mySessions: (db.users.find(u => u.id === user.id).sessions || []).map(x => ({ id: x.id, device: x.device, at: x.at, current: x.id === user._sid })),
      invoices: [], expenses: [], startup: [], quotes: [], capital: [], users: [], audit: [],
      nextInvoiceNo: 0, nextQuoteNo: 0, pushCount: db.pushSubs.filter(p => p.userId === user.id).length
    };
  }
  return {
    bookings: db.bookings,
    fuel: db.fuel,
    pushCount: db.pushSubs.filter(p => p.userId === user.id).length,
    me: publicUser(user),
    settings: db.settings,
    nextInvoiceNo: db.nextInvoiceNo,
    clients: db.clients,
    invoices: db.invoices,
    expenses: db.expenses,
    startup: db.startup,
    quotes: db.quotes,
    nextQuoteNo: db.nextQuoteNo,
    reminders: db.reminders,
    capital: db.capital,
    partnerTx: db.partnerTx,
    driverPay: db.driverPay,
    incidents: db.incidents,
    invites: (user.role === 'owner' || user.role === 'member') ? db.invites.filter(i => !i.usedAt && Date.parse(i.expires) > Date.now()).map(i => ({ id: i.id, name: i.name, role: i.role, expires: i.expires, createdBy: i.createdBy })) : [],
    mySessions: (db.users.find(u => u.id === user.id).sessions || []).map(x => ({ id: x.id, device: x.device, at: x.at, current: x.id === user._sid })),
    users: (user.role === 'owner' || user.role === 'member') ? db.users.map(publicUser) : [],
    audit: db.audit.slice(0, 200)
  };
}
