require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { Pool } = require('pg');
const Minio = require('minio');
const { calculateInvoice } = require('./domain');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bucket = process.env.MINIO_BUCKET || 'quan-ly-phong-tro';
const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER,
  secretKey: process.env.MINIO_ROOT_PASSWORD
});
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');

app.disable('x-powered-by');
app.use(express.json({ limit: '100mb' }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }));

const swagger = {
  openapi: '3.0.3',
  info: { title: 'Quáº£n lÃ½ phÃ²ng trá» API', version: '1.0.0', description: 'REST API quáº£n lÃ½ phÃ²ng, khÃ¡ch thuÃª, há»£p Ä‘á»“ng, hÃ³a Ä‘Æ¡n, thanh toÃ¡n vÃ  tá»‡p.' },
  servers: [{ url: '/api' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': { get: { security: [], summary: 'Kiá»ƒm tra tráº¡ng thÃ¡i API', responses: { 200: { description: 'API Ä‘ang hoáº¡t Ä‘á»™ng' } } } },
    '/auth/login': { post: { security: [], summary: 'ÄÄƒng nháº­p', responses: { 200: { description: 'JWT vÃ  há»“ sÆ¡ ngÆ°á»i dÃ¹ng' }, 401: { description: 'ThÃ´ng tin Ä‘Äƒng nháº­p khÃ´ng Ä‘Ãºng' } } } },
    '/dashboard': { get: { summary: 'Thá»‘ng kÃª dashboard', responses: { 200: { description: 'Sá»‘ liá»‡u tá»« PostgreSQL' } } } },
    '/rooms': { get: { summary: 'Danh sÃ¡ch phÃ²ng', responses: { 200: { description: 'Danh sÃ¡ch phÃ²ng' } } }, post: { summary: 'Táº¡o phÃ²ng', responses: { 201: { description: 'ÄÃ£ táº¡o' }, 400: { description: 'Dá»¯ liá»‡u sai' } } } },
    '/rooms/{id}': { put: { summary: 'Cáº­p nháº­t phÃ²ng', responses: { 204: { description: 'No Content' }, 404: { description: 'KhÃ´ng tÃ¬m tháº¥y' }, 409: { description: 'CÃ²n há»£p Ä‘á»“ng hiá»‡u lá»±c' } } }, delete: { summary: 'XÃ³a phÃ²ng', responses: { 204: { description: 'ÄÃ£ xÃ³a' }, 409: { description: 'CÃ²n liÃªn káº¿t nghiá»‡p vá»¥' } } } },
    '/tenants': { get: { summary: 'Danh sÃ¡ch khÃ¡ch thuÃª', responses: { 200: { description: 'Danh sÃ¡ch' } } }, post: { summary: 'Táº¡o khÃ¡ch thuÃª', responses: { 201: { description: 'ÄÃ£ táº¡o' }, 400: { description: 'Dá»¯ liá»‡u sai' }, 409: { description: 'VÆ°á»£t sá»©c chá»©a' } } } },
    '/tenants/{id}': { put: { summary: 'Cáº­p nháº­t khÃ¡ch thuÃª', responses: { 204: { description: 'No Content' } } }, delete: { summary: 'XÃ³a khÃ¡ch thuÃª', responses: { 204: { description: 'ÄÃ£ xÃ³a' }, 409: { description: 'CÃ²n lá»‹ch sá»­ há»£p Ä‘á»“ng' } } } },
    '/contracts': { get: { summary: 'Danh sÃ¡ch há»£p Ä‘á»“ng', responses: { 200: { description: 'Danh sÃ¡ch' } } }, post: { summary: 'Táº¡o há»£p Ä‘á»“ng', responses: { 201: { description: 'ÄÃ£ táº¡o' }, 400: { description: 'Dá»¯ liá»‡u sai' } } } },
    '/contracts/{id}': { put: { summary: 'Cáº­p nháº­t há»£p Ä‘á»“ng', responses: { 204: { description: 'No Content' } } }, delete: { summary: 'XÃ³a há»£p Ä‘á»“ng Ä‘Ã£ káº¿t thÃºc', responses: { 204: { description: 'ÄÃ£ xÃ³a' } } } },
    '/invoices': { get: { summary: 'Danh sÃ¡ch hÃ³a Ä‘Æ¡n', responses: { 200: { description: 'Danh sÃ¡ch' } } }, post: { summary: 'Táº¡o hÃ³a Ä‘Æ¡n vÃ  tÃ­nh tiá»n', responses: { 201: { description: 'ÄÃ£ táº¡o' }, 400: { description: 'Chá»‰ sá»‘ hoáº·c khoáº£n tiá»n sai' } } } },
    '/invoices/{id}': { put: { summary: 'Cáº­p nháº­t hÃ³a Ä‘Æ¡n', responses: { 204: { description: 'No Content' } } }, delete: { summary: 'XÃ³a hÃ³a Ä‘Æ¡n chÆ°a cÃ³ thanh toÃ¡n', responses: { 204: { description: 'ÄÃ£ xÃ³a' }, 409: { description: 'CÃ³ lá»‹ch sá»­ thanh toÃ¡n' } } } },
    '/payments': { get: { summary: 'Lá»‹ch sá»­ thanh toÃ¡n', responses: { 200: { description: 'Danh sÃ¡ch' } } }, post: { summary: 'Ghi nháº­n khoáº£n thu', responses: { 201: { description: 'ÄÃ£ ghi nháº­n' }, 400: { description: 'Sá»‘ tiá»n khÃ´ng há»£p lá»‡' } } } },
    '/files': { get: { summary: 'Danh sÃ¡ch tá»‡p theo Ä‘á»‘i tÆ°á»£ng', responses: { 200: { description: 'Danh sÃ¡ch metadata' } } }, post: { summary: 'Upload áº£nh hoáº·c PDF', responses: { 201: { description: 'Metadata vÃ  URL tá»‡p' }, 400: { description: 'Tá»‡p khÃ´ng há»£p lá»‡' } } } },
    '/files/{id}/content': { get: { security: [], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'token', in: 'query', required: true, schema: { type: 'string' } }], summary: 'Xem tá»‡p', responses: { 200: { description: 'Ná»™i dung tá»‡p' },  401: { description: 'Invalid or expired file token' }, 404: { description: 'KhÃ´ng tÃ¬m tháº¥y' } } } },
    '/settings': { put: { summary: 'Update settings', responses: { 204: { description: 'No Content' }, 403: { description: 'Administrator only' } } } },
    '/backup': { get: { summary: 'Xuáº¥t JSON vÃ  tá»‡p Ä‘Ã­nh kÃ¨m', responses: { 200: { description: 'Snapshot' }, 403: { description: 'Chá»‰ quáº£n trá»‹ viÃªn' } } }, post: { summary: 'Phá»¥c há»“i snapshot', responses: { 200: { description: 'ÄÃ£ phá»¥c há»“i' }, 400: { description: 'Snapshot sai cáº¥u trÃºc' } } } }
  }
};
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swagger));
app.get('/api/openapi.json', (_req, res) => res.json(swagger));
app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    let objectStorage = 'ok';
    try { await minio.bucketExists(bucket); } catch { objectStorage = 'unavailable'; }
    const status = objectStorage === 'ok' ? 200 : 503;
    res.status(status).json({ status: status === 200 ? 'ok' : 'unavailable', database: 'ok', objectStorage });
  } catch (err) { next(err); }
});

function auth(req, res, next) {
  if (req.method === 'GET' && /^\/files\/[^/]+\/content$/.test(req.path) && req.query.token) {
    try {
      const claims = jwt.verify(String(req.query.token), JWT_SECRET);
      const fileId = req.path.split('/')[2];
      if (claims.purpose !== 'file-content' || claims.fileId !== fileId) throw new Error('invalid file token');
      req.fileAccess = claims;
      return next();
    } catch { return res.status(401).json({ error: 'LiÃªn káº¿t tá»‡p Ä‘Ã£ háº¿t háº¡n hoáº·c khÃ´ng há»£p lá»‡.' }); }
  }
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try {
    if (!token) throw new Error('missing');
    const payload = jwt.verify(token, JWT_SECRET);
    pool.query('SELECT active,role FROM users WHERE id=$1',[payload.sub]).then(({rows})=>{
      if(!rows[0]?.active)return res.status(401).json({error:'TÃ i khoáº£n khÃ´ng hoáº¡t Ä‘á»™ng.'});
      payload.role=rows[0].role;
      req.user=payload;
      next();
    }).catch(next);
  } catch { res.status(401).json({ error: 'Vui lÃ²ng Ä‘Äƒng nháº­p.' }); }
}
function administrator(req, res, next) {
  if (req.user?.role !== 'administrator') return res.status(403).json({ error: 'Báº¡n khÃ´ng cÃ³ quyá»n thá»±c hiá»‡n thao tÃ¡c nÃ y.' });
  next();
}
function asyncRoute(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }
const camel = (row) => {
  const out = {};
  for (const [key, value] of Object.entries(row)) out[key.replace(/_([a-z])/g, (_m, c) => c.toUpperCase())] = value;
  return out;
};
const jsonFields = new Set(['amenities', 'images']);
const roomFields = ['id','name','floor','price','deposit','maxTenants','area','status','currentElectric','currentWater','amenities','note','images'];
const tenantFields = ['id','fullName','phone','idCard','hometown','birthDate','vehiclePlate','roomId','startDate','deposit','isRepresentative','note','status'];
const invoiceFields = ['id','roomId','roomName','month','createdDate','dueDate','paidDate','status','paymentMethod','roomPrice','oldElectric','newElectric','electricUsage','electricPrice','electricTotal','oldWater','newWater','waterUsage','waterPrice','waterTotal','internetPrice','trashPrice','otherFee','otherFeeReason','discount','totalAmount','note'];
const contractFields = ['id','roomId','tenantId','startDate','endDate','rent','deposit','terms','status','contractFileId'];
const mappings = {
  rooms: { table:'rooms', fields:roomFields, json:jsonFields, body:(b) => [b.id,b.name,b.floor ?? 1,b.price ?? 0,b.deposit ?? 0,b.maxTenants ?? 1,b.area ?? 0,b.status ?? 'available',b.currentElectric ?? 0,b.currentWater ?? 0,JSON.stringify(b.amenities || []),b.note || '',JSON.stringify((b.images || []).filter(x => !/^data:/.test(x.url || '')))] },
  tenants: { table:'tenants', fields:tenantFields, json:new Set(), body:(b) => [b.id,b.fullName,b.phone,b.idCard || '',b.hometown || '',b.birthDate || null,b.vehiclePlate || '',b.roomId || null,b.startDate || null,b.deposit || 0,!!b.isRepresentative,b.note || '',b.status || 'active'] },
  invoices: { table:'invoices', fields:invoiceFields, json:new Set(), body:(b) => [b.id,b.roomId,b.roomName,b.month,b.createdDate || null,b.dueDate || null,b.paidDate || null,b.status || 'unpaid',b.paymentMethod || 'Chuyá»ƒn khoáº£n',b.roomPrice || 0,b.oldElectric ?? 0,b.newElectric ?? 0,b.electricUsage ?? 0,b.electricPrice || 0,b.electricTotal || 0,b.oldWater ?? 0,b.newWater ?? 0,b.waterUsage ?? 0,b.waterPrice || 0,b.waterTotal || 0,b.internetPrice || 0,b.trashPrice || 0,b.otherFee || 0,b.otherFeeReason || '',b.discount || 0,b.totalAmount || 0,b.note || ''] },
  contracts: { table:'contracts', fields:contractFields, json:new Set(), body:(b) => [b.id,b.roomId,b.tenantId,b.startDate,b.endDate || null,b.rent,b.deposit || 0,b.terms || '',b.status || 'active',b.contractFileId || null] }
};
const columns = { rooms:'id,name,floor,price,deposit,max_tenants,area,status,current_electric,current_water,amenities,note,images', tenants:'id,full_name,phone,id_card,hometown,birth_date,vehicle_plate,room_id,start_date,deposit,is_representative,note,status', invoices:'id,room_id,room_name,month,created_date,due_date,paid_date,status,payment_method,room_price,old_electric,new_electric,electric_usage,electric_price,electric_total,old_water,new_water,water_usage,water_price,water_total,internet_price,trash_price,other_fee,other_fee_reason,discount,total_amount,note', contracts:'id,room_id,tenant_id,start_date,end_date,rent,deposit,terms,status,contract_file_id' };

function fileAccessUrl(fileId, download = false) {
  const token = jwt.sign({ purpose: 'file-content', fileId: String(fileId), download }, JWT_SECRET, { expiresIn: '10m' });
  return `/api/files/${encodeURIComponent(fileId)}/content?token=${encodeURIComponent(token)}`;
}

app.post('/api/auth/login', asyncRoute(async (req,res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ error:'Vui lÃ²ng nháº­p email vÃ  máº­t kháº©u.' });
  const { rows } = await pool.query('SELECT id,name,email,password_hash,role,active FROM users WHERE email=$1', [email]);
  const user = rows[0];
  if (!user || !user.active || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({ error:'Email hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºng.' });
  const token = jwt.sign({ sub:user.id, name:user.name, email:user.email, role:user.role }, JWT_SECRET, { expiresIn:process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ token, user:{ id:user.id,name:user.name,email:user.email,role:user.role } });
}));
app.get('/api/auth/me', auth, asyncRoute(async (req,res) => {
  const { rows } = await pool.query('SELECT id,name,email,role,active FROM users WHERE id=$1', [req.user.sub]);
  if (!rows[0]?.active) return res.status(401).json({ error:'TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a.' });
  res.json({ user:camel(rows[0]) });
}));
app.get('/api/users', auth, administrator, asyncRoute(async (_req,res) => {
  const { rows } = await pool.query('SELECT id,name,email,role,active,created_at FROM users ORDER BY created_at');
  res.json(rows.map(camel));
}));
app.post('/api/users', auth, administrator, asyncRoute(async (req,res) => {
  const {name,email,password,role='staff'}=req.body;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||'')) || !password || !['administrator','staff'].includes(role) || password.length < 10) return res.status(400).json({error:'TÃªn, email, vai trÃ² há»£p lá»‡ vÃ  máº­t kháº©u tá»‘i thiá»ƒu 10 kÃ½ tá»± lÃ  báº¯t buá»™c.'});
  const hash=await bcrypt.hash(password,12);
  const {rows}=await pool.query('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,active,created_at',[name,String(email).toLowerCase(),hash,role]);
  res.status(201).json(camel(rows[0]));
}));
app.patch('/api/users/:id', auth, administrator, asyncRoute(async (req,res)=>{
  const {name,email,role,active,password}=req.body||{};
  if(role!==undefined&&!['administrator','staff'].includes(role))return res.status(400).json({error:'Vai trÃ² khÃ´ng há»£p lá»‡.'});
  if(email!==undefined&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)))return res.status(400).json({error:'Email khÃ´ng há»£p lá»‡.'});
  if(password!==undefined&&password.length<10)return res.status(400).json({error:'Máº­t kháº©u má»›i pháº£i cÃ³ Ã­t nháº¥t 10 kÃ½ tá»±.'});
  if(req.params.id===req.user.sub&&active===false)return res.status(400).json({error:'KhÃ´ng thá»ƒ tá»± khÃ³a tÃ i khoáº£n Ä‘ang Ä‘Äƒng nháº­p.'});
  const hash=password?await bcrypt.hash(password,12):null;
  const {rows}=await pool.query('UPDATE users SET name=COALESCE($2,name),email=COALESCE($3,email),role=COALESCE($4,role),active=COALESCE($5,active),password_hash=COALESCE($6,password_hash) WHERE id=$1 RETURNING id,name,email,role,active,created_at',[req.params.id,name||null,email?String(email).toLowerCase():null,role||null,active===undefined?null:!!active,hash]);
  if(!rows[0])return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n.'});
  res.json(camel(rows[0]));
}));

app.use('/api', (req,res,next) => {
  if (req.method === 'GET' && /^\/(?:server\.js|compose\.yaml|Dockerfile|package\.json|\.env)$/.test(req.path)) {
    return res.status(404).json({ error: 'Not found.' });
  }
  next();
});
app.use('/api', auth);
app.get('/api/dashboard', asyncRoute(async (req,res) => {
  const month=String(req.query.month||new Date().toISOString().slice(0,7));
  if(!/^\d{4}-\d{2}$/.test(month))return res.status(400).json({error:'ThÃ¡ng khÃ´ng há»£p lá»‡.'});
  const [rooms, billing, due] = await Promise.all([
    pool.query("SELECT count(*)::int total, count(*) FILTER(WHERE status='occupied')::int occupied, count(*) FILTER(WHERE status='available')::int available, count(*) FILTER(WHERE status='maintenance')::int maintenance, (SELECT count(*)::int FROM tenants WHERE status='active') active_tenants FROM rooms"),
    pool.query("SELECT COALESCE(sum(i.total_amount),0)::bigint expected, COALESCE(sum(CASE WHEN i.status='paid' THEN i.total_amount ELSE LEAST(i.total_amount,COALESCE(p.total,0)) END),0)::bigint collected, COALESCE(sum(GREATEST(i.total_amount-CASE WHEN i.status='paid' THEN i.total_amount ELSE LEAST(i.total_amount,COALESCE(p.total,0)) END,0)),0)::bigint debt FROM invoices i LEFT JOIN LATERAL (SELECT sum(amount)::bigint total FROM payments WHERE invoice_id=i.id) p ON TRUE WHERE i.month=$1",[month]),
    pool.query("SELECT id,room_id AS \"roomId\",room_name AS \"roomName\",month,due_date AS \"dueDate\",total_amount AS \"totalAmount\",status FROM invoices WHERE status<>'paid' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 ORDER BY due_date LIMIT 20")
  ]);
  const r=rooms.rows[0], b=billing.rows[0];
  res.json({ ...r, month, activeTenantsCount:r.active_tenants, occupancyRate:r.total ? Math.round(r.occupied*100/r.total) : 0, expectedRevenue:Number(b.expected), collectedRevenue:Number(b.collected), debtRevenue:Number(b.debt), upcomingInvoices:due.rows });
}));
app.get('/api/settings', asyncRoute(async (_req,res) => { const {rows}=await pool.query('SELECT data FROM app_settings WHERE id=1'); res.json(rows[0]?.data || {}); }));
app.put('/api/settings', administrator, asyncRoute(async (req,res) => { const {rows}=await pool.query('UPDATE app_settings SET data=$1,updated_at=now() WHERE id=1 RETURNING data',[JSON.stringify(req.body || {})]); res.status(204).end(); }));

app.post('/api/contracts', asyncRoute(async (req,res) => {
  const b={...(req.body||{})}; b.status=b.status||'active';
  if(!b.id||!b.roomId||!b.tenantId||!b.startDate||!Number.isSafeInteger(Number(b.rent))||Number(b.rent)<0) return res.status(400).json({error:'MÃ£, phÃ²ng, khÃ¡ch thuÃª, ngÃ y báº¯t Ä‘áº§u vÃ  giÃ¡ thuÃª há»£p lá»‡ lÃ  báº¯t buá»™c.'});
  if(!['active','ended','expired'].includes(b.status))return res.status(400).json({error:'Tráº¡ng thÃ¡i há»£p Ä‘á»“ng khÃ´ng há»£p lá»‡.'});
  if(b.endDate && b.endDate<b.startDate) return res.status(400).json({error:'NgÃ y káº¿t thÃºc khÃ´ng Ä‘Æ°á»£c trÆ°á»›c ngÃ y báº¯t Ä‘áº§u.'});
  if(!Array.isArray(b.handoverFileIds||[]))return res.status(400).json({error:'Danh sÃ¡ch áº£nh bÃ n giao khÃ´ng há»£p lá»‡.'});
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const room=await client.query('SELECT id,max_tenants,status FROM rooms WHERE id=$1 FOR UPDATE',[b.roomId]);
    if(!room.rowCount) {await client.query('ROLLBACK');return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y phÃ²ng.'});}
    const tenant=await client.query('SELECT id,room_id,status FROM tenants WHERE id=$1 FOR UPDATE',[b.tenantId]);
    if(!tenant.rowCount) {await client.query('ROLLBACK');return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y khÃ¡ch thuÃª.'});}
    if(b.contractFileId){const file=await client.query("SELECT 1 FROM file_metadata WHERE id=$1 AND entity_type='contract' AND entity_id=$2 AND mime_type='application/pdf'",[b.contractFileId,b.id]);if(!file.rowCount){await client.query('ROLLBACK');return res.status(400).json({error:'PDF há»£p Ä‘á»“ng chÆ°a Ä‘Æ°á»£c táº£i lÃªn há»£p lá»‡.'});}}
    if((b.handoverFileIds||[]).length){const files=await client.query("SELECT count(*)::int n FROM file_metadata WHERE id=ANY($1::uuid[]) AND entity_type='checkin' AND entity_id=$2",[b.handoverFileIds,b.id]);if(files.rows[0].n!==b.handoverFileIds.length){await client.query('ROLLBACK');return res.status(400).json({error:'áº¢nh bÃ n giao khÃ´ng há»£p lá»‡.'});}}
    if(b.status==='active') {
      if(room.rows[0].status==='maintenance') {await client.query('ROLLBACK');return res.status(409).json({error:'KhÃ´ng thá»ƒ táº¡o há»£p Ä‘á»“ng cho phÃ²ng Ä‘ang báº£o trÃ¬.'});}
      const existingContract=await client.query("SELECT 1 FROM contracts WHERE tenant_id=$1 AND status='active' LIMIT 1",[b.tenantId]);
      if(existingContract.rowCount) {await client.query('ROLLBACK');return res.status(409).json({error:'KhÃ¡ch thuÃª Ä‘Ã£ cÃ³ há»£p Ä‘á»“ng cÃ²n hiá»‡u lá»±c.'});}
      if(tenant.rows[0].status!=='active' || tenant.rows[0].room_id!==b.roomId) {
        const capacity=await client.query("SELECT count(*)::int n FROM tenants WHERE room_id=$1 AND status='active'",[b.roomId]);
        const alreadyThere=tenant.rows[0].status==='active'&&tenant.rows[0].room_id===b.roomId;
        if(!alreadyThere && capacity.rows[0].n>=room.rows[0].max_tenants) {await client.query('ROLLBACK');return res.status(409).json({error:'PhÃ²ng Ä‘Ã£ Ä‘á»§ sá»©c chá»©a.'});}
      }
    }
    const params=mappings.contracts.body(b);
    const {rows}=await client.query(`INSERT INTO contracts(${columns.contracts}) VALUES(${params.map((_,i)=>`$${i+1}`).join(',')}) RETURNING ${columns.contracts}`,params);
    if(b.status==='active') {
      await client.query("UPDATE tenants SET room_id=$2,status='active',start_date=$3,deposit=$4,updated_at=now() WHERE id=$1",[b.tenantId,b.roomId,b.startDate,b.deposit||0]);
      await client.query("UPDATE rooms SET status='occupied',updated_at=now() WHERE id=$1",[b.roomId]);
      await client.query("INSERT INTO handover_records(room_id,contract_id,event_type,note,state,recorded_by) VALUES($1,$2,'checkin',$3,$4,$5)",[b.roomId,b.id,b.terms||'',JSON.stringify({tenantId:b.tenantId,deposit:Number(b.deposit||0),fileIds:b.handoverFileIds||[]}),req.user.sub]);
    }
    await client.query('COMMIT');res.status(201).json(camel(rows[0]));
  } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
}));
app.put('/api/contracts/:id', asyncRoute(async (req,res) => {
  const body={...(req.body||{}),id:req.params.id};
  if(!['active','ended','expired'].includes(body.status)||!body.roomId||!body.tenantId||!body.startDate||!Number.isSafeInteger(Number(body.rent))||Number(body.rent)<0||(body.endDate&&body.endDate<body.startDate))return res.status(400).json({error:'ThÃ´ng tin há»£p Ä‘á»“ng khÃ´ng há»£p lá»‡.'});
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const previous=await client.query('SELECT * FROM contracts WHERE id=$1 FOR UPDATE',[body.id]);
    if(!previous.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y há»£p Ä‘á»“ng.'});}
    if(body.status==='active'){
      const room=await client.query('SELECT status,max_tenants FROM rooms WHERE id=$1 FOR UPDATE',[body.roomId]);
      const tenant=await client.query('SELECT room_id,status FROM tenants WHERE id=$1 FOR UPDATE',[body.tenantId]);
      if(!room.rowCount||!tenant.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y phÃ²ng hoáº·c khÃ¡ch thuÃª.'});}
      if(room.rows[0].status==='maintenance'){await client.query('ROLLBACK');return res.status(409).json({error:'PhÃ²ng Ä‘ang báº£o trÃ¬.'});}
      const other=await client.query("SELECT 1 FROM contracts WHERE tenant_id=$1 AND id<>$2 AND status='active' LIMIT 1",[body.tenantId,body.id]);
      if(other.rowCount){await client.query('ROLLBACK');return res.status(409).json({error:'KhÃ¡ch thuÃª Ä‘Ã£ cÃ³ há»£p Ä‘á»“ng hiá»‡u lá»±c khÃ¡c.'});}
      if(tenant.rows[0].room_id!==body.roomId){const capacity=await client.query("SELECT count(*)::int n FROM tenants WHERE room_id=$1 AND status='active'",[body.roomId]);if(capacity.rows[0].n>=room.rows[0].max_tenants){await client.query('ROLLBACK');return res.status(409).json({error:'PhÃ²ng Ä‘Ã£ Ä‘á»§ sá»©c chá»©a.'});}}
    }
    const params=mappings.contracts.body(body); const sets=columns.contracts.split(',').slice(1).map((c,i)=>`${c}=$${i+1}`);
    const {rows}=await client.query(`UPDATE contracts SET ${sets.join(',')},updated_at=now() WHERE id=$${params.length} RETURNING ${columns.contracts}`,[...params.slice(1),params[0]]);
    if(body.status==='active'){
      await client.query("UPDATE tenants SET room_id=$2,status='active',start_date=$3,deposit=$4,updated_at=now() WHERE id=$1",[body.tenantId,body.roomId,body.startDate,body.deposit||0]);
      await client.query("UPDATE rooms SET status='occupied',updated_at=now() WHERE id=$1",[body.roomId]);
    }else{
      await client.query("UPDATE tenants SET status='left',updated_at=now() WHERE id=$1 AND NOT EXISTS(SELECT 1 FROM contracts WHERE tenant_id=$1 AND status='active')",[body.tenantId]);
      const active=await client.query("SELECT 1 FROM contracts WHERE room_id=$1 AND status='active' LIMIT 1",[previous.rows[0].room_id]);
      if(!active.rowCount)await client.query("UPDATE rooms SET status='available',updated_at=now() WHERE id=$1 AND status='occupied'",[previous.rows[0].room_id]);
    }
    await client.query('COMMIT');res.status(204).end();
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}));

app.post('/api/checkout', asyncRoute(async (req,res) => {
  const {id,roomId,tenantIds=[],depositTotal,deduction=0,deductionReason='',note='',fileIds=[]}=req.body||{};
  if(!roomId||!Array.isArray(tenantIds)||!Number.isSafeInteger(Number(depositTotal))||!Number.isSafeInteger(Number(deduction))||Number(deduction)<0) return res.status(400).json({error:'Dá»¯ liá»‡u tráº£ phÃ²ng khÃ´ng há»£p lá»‡.'});
  if(!Array.isArray(fileIds))return res.status(400).json({error:'Danh sÃ¡ch áº£nh tráº£ phÃ²ng khÃ´ng há»£p lá»‡.'});
  const refundAmount=Math.max(0,Number(depositTotal)-Number(deduction));
  const client=await pool.connect();
  try{await client.query('BEGIN');
    const room=await client.query('SELECT id FROM rooms WHERE id=$1 FOR UPDATE',[roomId]);
    if(!room.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y phÃ²ng.'});}
    if(fileIds.length){const files=await client.query("SELECT count(*)::int n FROM file_metadata WHERE id=ANY($1::uuid[]) AND entity_type='checkout' AND entity_id=$2",[fileIds,id]);if(files.rows[0].n!==fileIds.length){await client.query('ROLLBACK');return res.status(400).json({error:'áº¢nh tráº£ phÃ²ng khÃ´ng há»£p lá»‡.'});}}
    const result=await client.query('INSERT INTO checkout_history(id,room_id,tenant_ids,deposit_total,deduction,deduction_reason,refund_amount,note,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[id,roomId,JSON.stringify(tenantIds),depositTotal,deduction,deductionReason,refundAmount,note,req.user.sub]);
    await client.query("UPDATE tenants SET status='left',updated_at=now() WHERE room_id=$1 AND status='active'",[roomId]);
    await client.query("UPDATE contracts SET status='ended',updated_at=now() WHERE room_id=$1 AND status='active'",[roomId]);
    await client.query("INSERT INTO handover_records(room_id,event_type,note,state,recorded_by) VALUES($1,'checkout',$2,$3,$4)",[roomId,deductionReason,JSON.stringify({tenantIds,depositTotal:Number(depositTotal),deduction:Number(deduction),refundAmount,fileIds}),req.user.sub]);
    await client.query("UPDATE rooms SET status='available',updated_at=now() WHERE id=$1",[roomId]);
    await client.query('COMMIT');res.status(201).json(camel(result.rows[0]));
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}));
app.get('/api/checkouts', asyncRoute(async (req,res)=>{
  const {rows}=await pool.query("SELECT h.*,COALESCE(json_agg(json_build_object('id',f.id,'original_name',f.original_name,'caption',f.caption,'object_key',f.object_key)) FILTER(WHERE f.id IS NOT NULL),'[]'::json) images FROM checkout_history h LEFT JOIN file_metadata f ON f.entity_type='checkout' AND f.entity_id=h.id::text GROUP BY h.id ORDER BY h.checked_out_at DESC");
  const result=[];
  for(const row of rows){const entry=camel(row);entry.images=(row.images||[]).map(image=>({...camel(image),url:fileAccessUrl(image.id)}));result.push(entry);}
  res.json(result);
}));
app.get('/api/handovers', asyncRoute(async (req,res)=>{const {rows}=await pool.query('SELECT * FROM handover_records WHERE ($1::text IS NULL OR room_id=$1) ORDER BY occurred_at DESC',[req.query.roomId||null]);res.json(rows.map(camel));}));
app.delete('/api/data', administrator, asyncRoute(async (_req,res)=>{
  const keys=(await pool.query('SELECT object_key FROM file_metadata')).rows.map(r=>r.object_key);
  const client=await pool.connect();
  try{await client.query('BEGIN');await client.query('DELETE FROM payments');await client.query('DELETE FROM checkout_history');await client.query('DELETE FROM handover_records');await client.query('DELETE FROM contracts');await client.query('DELETE FROM invoices');await client.query('DELETE FROM tenants');await client.query('DELETE FROM rooms');await client.query('DELETE FROM file_metadata');await client.query('COMMIT');}
  catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  for(const key of keys){try{await minio.removeObject(bucket,key);}catch(error){console.error('MinIO cleanup:',error.message);}}
  res.status(204).end();
}));

for (const [resource, cfg] of Object.entries(mappings)) {
  app.get(`/api/${resource}`, asyncRoute(async (req,res) => {
    const filters=[]; const values=[];
    if (resource==='invoices' && req.query.month) { values.push(req.query.month); filters.push(`month=$${values.length}`); }
    if (resource==='contracts' && req.query.roomId) { values.push(req.query.roomId); filters.push(`room_id=$${values.length}`); }
    if (resource==='contracts' && req.query.tenantId) { values.push(req.query.tenantId); filters.push(`tenant_id=$${values.length}`); }
    const query=`SELECT ${columns[resource]} FROM ${cfg.table}${filters.length?' WHERE '+filters.join(' AND '):''} ORDER BY created_at DESC`;
    const {rows}=await pool.query(query,values);
    const result=rows.map(camel);
    if(resource==='rooms') for(const room of result) {
      const fileIds=(room.images||[]).map(image=>image.fileId).filter(id=>/^[0-9a-f-]{36}$/i.test(id||''));
      if(fileIds.length){const files=await pool.query('SELECT id,object_key,original_name FROM file_metadata WHERE id=ANY($1::uuid[])', [fileIds]);const byId=new Map(files.rows.map(file=>[file.id,file]));
        room.images=(room.images||[]).map(image=>{const file=byId.get(image.fileId);return file?{...image,url:fileAccessUrl(file.id)}:image;});}
    }
    if(resource==='contracts') for(const contract of result) {
      if(contract.contractFileId){
        const file=await pool.query('SELECT id FROM file_metadata WHERE id=$1',[contract.contractFileId]);
        if(file.rows[0])contract.contractFileUrl=fileAccessUrl(file.rows[0].id,true);
      }
      const evidence=await pool.query("SELECT id,original_name,caption,object_key FROM file_metadata WHERE entity_type='checkin' AND entity_id=$1 ORDER BY uploaded_at",[contract.id]);
      contract.checkinFiles=evidence.rows.map(file=>({...camel(file),url:fileAccessUrl(file.id)}));
    }
    res.json(result);
  }));
  app.post(`/api/${resource}`, asyncRoute(async (req,res) => {
    const body=req.body || {};
    const required=resource==='rooms'?['id','name']:resource==='tenants'?['id','fullName','phone']:resource==='invoices'?['id','roomId','month']:['id','roomId','tenantId','startDate','rent'];
    if (required.some(k=>body[k]===undefined || body[k]==='')) return res.status(400).json({error:`Thiáº¿u trÆ°á»ng báº¯t buá»™c: ${required.filter(k=>body[k]===undefined||body[k]==='').join(', ')}`});
    if (resource==='rooms' && !['available','occupied','maintenance'].includes(body.status || 'available')) return res.status(400).json({error:'Tráº¡ng thÃ¡i phÃ²ng khÃ´ng há»£p lá»‡.'});
    if (resource==='tenants' && body.status!=='left') {
      const room=await pool.query('SELECT status,max_tenants FROM rooms WHERE id=$1',[body.roomId]);
      if(!room.rowCount)return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y phÃ²ng Ä‘Æ°á»£c chá»n.'});
      if(room.rows[0].status==='maintenance')return res.status(409).json({error:'KhÃ´ng thá»ƒ xáº¿p khÃ¡ch vÃ o phÃ²ng Ä‘ang báº£o trÃ¬.'});
      const capacity=await pool.query("SELECT count(*)::int n FROM tenants WHERE room_id=$1 AND status='active'",[body.roomId]);
      if(capacity.rows[0].n>=room.rows[0].max_tenants)return res.status(409).json({error:'PhÃ²ng Ä‘Ã£ Ä‘á»§ sá»©c chá»©a.'});
    }
    if (resource==='invoices') {
      try { Object.assign(body, calculateInvoice(body)); }
      catch(error) { return res.status(400).json({error:error.message}); }
      body.status='unpaid';
      body.paidDate=null;
    }
    const params=cfg.body(body);
    const placeholders=params.map((_,i)=>`$${i+1}`).join(',');
    const {rows}=await pool.query(`INSERT INTO ${cfg.table}(${columns[resource]}) VALUES(${placeholders}) RETURNING ${columns[resource]}`,params);
    if (resource==='tenants' && body.status!=='left') await pool.query("UPDATE rooms SET status='occupied',updated_at=now() WHERE id=$1 AND status='available'",[body.roomId]);
    res.status(201).json(camel(rows[0]));
  }));
  app.put(`/api/${resource}/:id`, asyncRoute(async (req,res) => {
    const body={...(req.body||{}),id:req.params.id};
    if(resource==='rooms' && body.status!=='occupied') {
      const active=await pool.query("SELECT 1 FROM contracts WHERE room_id=$1 AND status='active' LIMIT 1",[body.id]);
      if(active.rowCount)return res.status(409).json({error:'PhÃ²ng Ä‘ang cÃ³ há»£p Ä‘á»“ng hiá»‡u lá»±c, khÃ´ng thá»ƒ Ä‘á»•i sang tráº¡ng thÃ¡i khÃ¡c.'});
    }
    if(resource==='tenants' && body.status!=='left') {
      const old=await pool.query('SELECT room_id FROM tenants WHERE id=$1',[body.id]);
      const room=await pool.query('SELECT status,max_tenants FROM rooms WHERE id=$1',[body.roomId]);
      if(!room.rowCount)return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y phÃ²ng Ä‘Æ°á»£c chá»n.'});
      if(old.rows[0]?.room_id!==body.roomId && room.rows[0].status==='maintenance')return res.status(409).json({error:'KhÃ´ng thá»ƒ xáº¿p khÃ¡ch vÃ o phÃ²ng Ä‘ang báº£o trÃ¬.'});
      if(old.rows[0]?.room_id!==body.roomId){
        const activeContract=await pool.query("SELECT 1 FROM contracts WHERE tenant_id=$1 AND status='active' LIMIT 1",[body.id]);
        if(activeContract.rowCount)return res.status(409).json({error:'HÃ£y káº¿t thÃºc há»£p Ä‘á»“ng trÆ°á»›c khi chuyá»ƒn khÃ¡ch sang phÃ²ng khÃ¡c.'});
        const capacity=await pool.query("SELECT count(*)::int n FROM tenants WHERE room_id=$1 AND status='active'",[body.roomId]);
        if(capacity.rows[0].n>=room.rows[0].max_tenants)return res.status(409).json({error:'PhÃ²ng Ä‘Ã£ Ä‘á»§ sá»©c chá»©a.'});
      }
    }
    if (resource==='invoices') {
      const stored=await pool.query('SELECT room_id,month FROM invoices WHERE id=$1',[body.id]);
      if(stored.rows[0] && (stored.rows[0].room_id!==body.roomId || stored.rows[0].month!==body.month))return res.status(409).json({error:'KhÃ´ng thá»ƒ chuyá»ƒn hÃ³a Ä‘Æ¡n sang phÃ²ng hoáº·c ká»³ khÃ¡c.'});
      try { Object.assign(body, calculateInvoice(body)); }
      catch(error) { return res.status(400).json({error:error.message}); }
      const paid=await pool.query('SELECT COALESCE(sum(amount),0)::bigint total FROM payments WHERE invoice_id=$1',[body.id]);
      const paidAmount=Number(paid.rows[0].total);
      body.status=paidAmount===0?'unpaid':paidAmount===Number(body.totalAmount)?'paid':'partial';
      body.paidDate=body.status==='paid'?(body.paidDate||new Date().toISOString().slice(0,10)):null;
      if(Number(paid.rows[0].total)>0 && Number(body.totalAmount)<Number(paid.rows[0].total))return res.status(409).json({error:'Sá»‘ tiá»n hÃ³a Ä‘Æ¡n khÃ´ng thá»ƒ tháº¥p hÆ¡n khoáº£n Ä‘Ã£ thu.'});
      if(Number(paid.rows[0].total)>0 && body.status==='unpaid')return res.status(409).json({error:'KhÃ´ng thá»ƒ chuyá»ƒn hÃ³a Ä‘Æ¡n cÃ³ lá»‹ch sá»­ thanh toÃ¡n vá» tráº¡ng thÃ¡i chÆ°a thanh toÃ¡n.'});
    }
    const params=cfg.body(body); const sets=columns[resource].split(',').slice(1).map((c,i)=>`${c}=$${i+1}`);
    const {rows}=await pool.query(`UPDATE ${cfg.table} SET ${sets.join(',')},updated_at=now() WHERE id=$${params.length} RETURNING ${columns[resource]}`,[...params.slice(1),params[0]]);
    if (!rows[0]) return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u.'});
    res.status(204).end();
  }));
  app.delete(`/api/${resource}/:id`, administrator, asyncRoute(async (req,res) => {
    if (resource==='rooms') {
      const active=await pool.query("SELECT 1 FROM contracts WHERE room_id=$1 AND status='active' LIMIT 1",[req.params.id]);
      if (active.rowCount) return res.status(409).json({error:'KhÃ´ng thá»ƒ xÃ³a phÃ²ng Ä‘ang cÃ³ há»£p Ä‘á»“ng hiá»‡u lá»±c.'});
      const history=await pool.query('SELECT 1 FROM contracts WHERE room_id=$1 UNION ALL SELECT 1 FROM invoices WHERE room_id=$1 UNION ALL SELECT 1 FROM checkout_history WHERE room_id=$1 UNION ALL SELECT 1 FROM handover_records WHERE room_id=$1 LIMIT 1',[req.params.id]);
      if(history.rowCount)return res.status(409).json({error:'KhÃ´ng thá»ƒ xÃ³a phÃ²ng cÃ²n lá»‹ch sá»­ thuÃª, hÃ³a Ä‘Æ¡n, bÃ n giao hoáº·c tráº£ phÃ²ng.'});
    }
    if(resource==='invoices'){
      const hasPayments=await pool.query('SELECT 1 FROM payments WHERE invoice_id=$1 LIMIT 1',[req.params.id]);
      if(hasPayments.rowCount)return res.status(409).json({error:'KhÃ´ng thá»ƒ xÃ³a hÃ³a Ä‘Æ¡n Ä‘Ã£ cÃ³ giao dá»‹ch thanh toÃ¡n.'});
    }
    if(resource==='contracts'){
      const contract=await pool.query("SELECT 1 FROM contracts WHERE id=$1 AND status='active'",[req.params.id]);
      if(contract.rowCount)return res.status(409).json({error:'HÃ£y káº¿t thÃºc há»£p Ä‘á»“ng trÆ°á»›c khi xÃ³a.'});
      const handover=await pool.query('SELECT 1 FROM handover_records WHERE contract_id=$1 LIMIT 1',[req.params.id]);
      if(handover.rowCount)return res.status(409).json({error:'KhÃ´ng thá»ƒ xÃ³a há»£p Ä‘á»“ng cÃ³ lá»‹ch sá»­ bÃ n giao.'});
    }
    if(resource==='tenants'){
      const contract=await pool.query('SELECT 1 FROM contracts WHERE tenant_id=$1 LIMIT 1',[req.params.id]);
      if(contract.rowCount)return res.status(409).json({error:'KhÃ´ng thá»ƒ xÃ³a khÃ¡ch thuÃª cÃ³ lá»‹ch sá»­ há»£p Ä‘á»“ng.'});
    }
    const {rowCount}=await pool.query(`DELETE FROM ${cfg.table} WHERE id=$1`,[req.params.id]);
    if (!rowCount) return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u.'});
    res.status(204).end();
  }));
}

app.get('/api/payments', asyncRoute(async (req,res) => {
  const {rows}=await pool.query('SELECT p.* FROM payments p JOIN invoices i ON i.id=p.invoice_id WHERE ($1::text IS NULL OR p.invoice_id=$1) ORDER BY p.paid_at DESC',[req.query.invoiceId||null]);
  res.json(rows.map(camel));
}));
app.post('/api/payments', asyncRoute(async (req,res) => {
  const {invoiceId,amount,method='cash',reference='',note=''}=req.body||{};
  if (!invoiceId || !Number.isSafeInteger(Number(amount)) || Number(amount)<=0) return res.status(400).json({error:'MÃ£ hÃ³a Ä‘Æ¡n vÃ  sá»‘ tiá»n thanh toÃ¡n há»£p lá»‡ lÃ  báº¯t buá»™c.'});
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const inv=await client.query('SELECT total_amount FROM invoices WHERE id=$1 FOR UPDATE',[invoiceId]);
    if (!inv.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y hÃ³a Ä‘Æ¡n.'}); }
    const paid=await client.query('SELECT COALESCE(sum(amount),0)::bigint total FROM payments WHERE invoice_id=$1',[invoiceId]);
    if (Number(paid.rows[0].total)+Number(amount)>Number(inv.rows[0].total_amount)) { await client.query('ROLLBACK'); return res.status(400).json({error:'Sá»‘ tiá»n nháº­n vÆ°á»£t quÃ¡ sá»‘ dÆ° hÃ³a Ä‘Æ¡n.'}); }
    const {rows}=await client.query('INSERT INTO payments(invoice_id,amount,method,reference,recorded_by,note) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[invoiceId,amount,method,reference,req.user.sub,note]);
    const newPaid=Number(paid.rows[0].total)+Number(amount);
    await client.query('UPDATE invoices SET status=$2,paid_date=CASE WHEN $2=\'paid\' THEN CURRENT_DATE ELSE NULL END,updated_at=now() WHERE id=$1',[invoiceId,newPaid===Number(inv.rows[0].total_amount)?'paid':'partial']);
    await client.query('COMMIT'); res.status(201).json(camel(rows[0]));
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}));

const maxBytes=(Number(process.env.MAX_UPLOAD_MB)||10)*1024*1024;
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:maxBytes,files:10},fileFilter:(_req,file,cb)=>{
  const allowed=file.mimetype.startsWith('image/') || file.mimetype==='application/pdf';
  cb(allowed?null:Object.assign(new Error('Chá»‰ cháº¥p nháº­n áº£nh hoáº·c PDF.'),{status:400}),allowed);
}});
app.post('/api/files', upload.single('file'), asyncRoute(async (req,res) => {
  if (!req.file) return res.status(400).json({error:'Thiáº¿u tá»‡p táº£i lÃªn.'});
  const bytes=req.file.buffer;
  const isJpeg=bytes.length>3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  const isPng=bytes.length>8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const isWebp=bytes.length>12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  const isGif=bytes.length>6&&/^GIF8[79]a$/.test(bytes.toString('ascii',0,6));
  const isPdf=bytes.length>5&&bytes.toString('ascii',0,5)==='%PDF-';
  if(!(req.file.mimetype==='application/pdf'&&isPdf) && !(req.file.mimetype.startsWith('image/')&&(isJpeg||isPng||isWebp||isGif))) return res.status(400).json({error:'Ná»™i dung tá»‡p khÃ´ng khá»›p Ä‘á»‹nh dáº¡ng áº£nh/PDF Ä‘Æ°á»£c phÃ©p.'});
  const entityType=req.body.entityType, entityId=String(req.body.entityId||'');
  if (!['room','contract','tenant','checkin','checkout'].includes(entityType) || !entityId) return res.status(400).json({error:'Loáº¡i vÃ  mÃ£ Ä‘á»‘i tÆ°á»£ng khÃ´ng há»£p lá»‡.'});
  const ext=path.extname(req.file.originalname).toLowerCase().replace(/[^.a-z0-9]/g,'');
  const objectKey=`${entityType}/${entityId}/${crypto.randomUUID()}${ext}`;
  await minio.putObject(bucket,objectKey,req.file.buffer,req.file.size,{'Content-Type':req.file.mimetype});
  const {rows}=await pool.query('INSERT INTO file_metadata(original_name,object_key,mime_type,size_bytes,entity_type,entity_id,caption,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[req.file.originalname,objectKey,req.file.mimetype,req.file.size,entityType,entityId,req.body.caption||'',req.user.sub]);
  res.status(201).json({...camel(rows[0]),url:fileAccessUrl(rows[0].id)});
}));
app.get('/api/files/:id/content', asyncRoute(async (req,res) => {
  const {rows}=await pool.query('SELECT * FROM file_metadata WHERE id=$1',[req.params.id]);
  if (!rows[0]) return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y tá»‡p.'});
  const file=rows[0]; res.setHeader('Content-Type',file.mime_type); res.setHeader('Content-Disposition',`${req.fileAccess?.download?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(file.original_name)}`);
  minio.getObject(bucket,file.object_key,(err,stream)=>{ if(err) return res.status(500).json({error:'KhÃ´ng thá»ƒ Ä‘á»c tá»‡p.'}); stream.on('error',()=>res.destroy()); stream.pipe(res); });
}));
app.get('/api/files/:id/download', asyncRoute(async (req,res) => {
  const {rows}=await pool.query('SELECT * FROM file_metadata WHERE id=$1',[req.params.id]); if(!rows[0]) return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y tá»‡p.'});
  res.setHeader('Content-Type',rows[0].mime_type); res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(rows[0].original_name)}`);
  minio.getObject(bucket,rows[0].object_key,(err,stream)=>{ if(err) return res.status(500).json({error:'KhÃ´ng thá»ƒ Ä‘á»c tá»‡p.'}); stream.pipe(res); });
}));
app.get('/api/files', asyncRoute(async (req,res) => {
  if (!req.query.entityType || !req.query.entityId) return res.status(400).json({error:'Cáº§n entityType vÃ  entityId.'});
  const {rows}=await pool.query('SELECT * FROM file_metadata WHERE entity_type=$1 AND entity_id=$2 ORDER BY uploaded_at',[req.query.entityType,req.query.entityId]);
  res.json(rows.map(r=>({...camel(r),url:fileAccessUrl(r.id)})));
}));
app.delete('/api/files/:id', asyncRoute(async (req,res) => {
  const {rows}=await pool.query('DELETE FROM file_metadata WHERE id=$1 RETURNING object_key',[req.params.id]);
  if(!rows[0])return res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y tá»‡p.'});
  try{await minio.removeObject(bucket,rows[0].object_key);}catch(error){console.error('KhÃ´ng xÃ³a Ä‘Æ°á»£c object MinIO:',error.message);}
  res.status(204).end();
}));

async function streamBuffer(objectKey) {
  const stream=await minio.getObject(bucket,objectKey);
  const chunks=[];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
app.get('/api/backup', administrator, asyncRoute(async (_req,res)=>{
  const tables=['rooms','tenants','contracts','invoices','payments','file_metadata','checkout_history','handover_records'];
  const snapshot={schemaVersion:1,exportDate:new Date().toISOString(),settings:(await pool.query('SELECT data FROM app_settings WHERE id=1')).rows[0].data,files:[]};
  for(const table of tables){const {rows}=await pool.query(`SELECT * FROM ${table}`);snapshot[table]=rows.map(camel);}
  for(const file of snapshot.fileMetadata){
    try{snapshot.files.push({id:file.id,contentBase64:(await streamBuffer(file.objectKey)).toString('base64')});}
    catch(error){throw Object.assign(new Error(`KhÃ´ng thá»ƒ sao lÆ°u tá»‡p ${file.originalName}`),{status:500,cause:error});}
  }
  res.json(snapshot);
}));
app.post('/api/backup', administrator, asyncRoute(async (req,res)=>{
  const data=req.body||{};
  for(const key of ['rooms','tenants','contracts','invoices','payments','fileMetadata','checkoutHistory','handoverRecords','files']) if(data[key]!==undefined&&!Array.isArray(data[key])) return res.status(400).json({error:`TrÆ°á»ng ${key} pháº£i lÃ  danh sÃ¡ch.`});
  if(!data.settings||!Array.isArray(data.rooms)||!Array.isArray(data.tenants)||!Array.isArray(data.invoices)) return res.status(400).json({error:'Báº£n sao lÆ°u thiáº¿u cáº¥u trÃºc dá»¯ liá»‡u báº¯t buá»™c.'});
  if((data.files||[]).some(f=>!f.id||typeof f.contentBase64!=='string'||Buffer.from(f.contentBase64,'base64').length>maxBytes)) return res.status(400).json({error:'Tá»‡p Ä‘Ã­nh kÃ¨m trong báº£n sao lÆ°u khÃ´ng há»£p lá»‡ hoáº·c vÆ°á»£t dung lÆ°á»£ng.'});
  const metadataRows=data.fileMetadata||[];
  if(metadataRows.length!==(data.files||[]).length || new Set((data.files||[]).map(f=>f.id)).size!==(data.files||[]).length) return res.status(400).json({error:'Báº£n sao lÆ°u thiáº¿u ná»™i dung tá»‡p hoáº·c cÃ³ mÃ£ tá»‡p trÃ¹ng.'});
  const oldKeys=(await pool.query('SELECT object_key FROM file_metadata')).rows.map(r=>r.object_key);
  const uploaded=[];
  const fileMap=new Map();
  try{
    for(const f of data.files||[]){
      const metadata=(data.fileMetadata||[]).find(x=>x.id===f.id); if(!metadata) throw Object.assign(new Error('Metadata cá»§a tá»‡p Ä‘Ã­nh kÃ¨m khÃ´ng tá»“n táº¡i.'),{status:400});
      const objectKey=`restore/${crypto.randomUUID()}${path.extname(metadata.originalName||'')}`;
      const body=Buffer.from(f.contentBase64,'base64');
      await minio.putObject(bucket,objectKey,body,body.length,{'Content-Type':metadata.mimeType||'application/octet-stream'});
      uploaded.push(objectKey); fileMap.set(f.id,objectKey);
    }
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      await client.query('DELETE FROM payments'); await client.query('DELETE FROM checkout_history'); await client.query('DELETE FROM handover_records');
      await client.query('DELETE FROM contracts'); await client.query('DELETE FROM invoices'); await client.query('DELETE FROM tenants'); await client.query('DELETE FROM rooms'); await client.query('DELETE FROM file_metadata');
      for(const room of data.rooms) await client.query(`INSERT INTO rooms(${columns.rooms}) VALUES(${mappings.rooms.body(room).map((_,i)=>`$${i+1}`).join(',')})`,mappings.rooms.body(room));
      for(const tenant of data.tenants) await client.query(`INSERT INTO tenants(${columns.tenants}) VALUES(${mappings.tenants.body(tenant).map((_,i)=>`$${i+1}`).join(',')})`,mappings.tenants.body(tenant));
      for(const f of data.fileMetadata||[]) await client.query('INSERT INTO file_metadata(id,original_name,object_key,mime_type,size_bytes,entity_type,entity_id,caption,uploaded_by,uploaded_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[f.id,f.originalName,fileMap.get(f.id)||f.objectKey,f.mimeType,f.sizeBytes,f.entityType,f.entityId,f.caption||'',f.uploadedBy||null,f.uploadedAt||new Date()]);
      for(const c of data.contracts||[]) await client.query(`INSERT INTO contracts(${columns.contracts}) VALUES(${mappings.contracts.body(c).map((_,i)=>`$${i+1}`).join(',')})`,mappings.contracts.body(c));
      for(const inv of data.invoices){const args=mappings.invoices.body(inv);await client.query(`INSERT INTO invoices(${columns.invoices}) VALUES(${args.map((_,i)=>`$${i+1}`).join(',')})`,args);}
      for(const c of data.checkoutHistory||[]) await client.query('INSERT INTO checkout_history(id,room_id,tenant_ids,deposit_total,deduction,deduction_reason,refund_amount,note,checked_out_at,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[c.id,c.roomId,JSON.stringify(c.tenantIds||[]),c.depositTotal,c.deduction,c.deductionReason||'',c.refundAmount,c.note||'',c.checkedOutAt||new Date(),c.recordedBy||null]);
      for(const h of data.handoverRecords||[]) await client.query('INSERT INTO handover_records(id,room_id,contract_id,event_type,note,state,occurred_at,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[h.id,h.roomId,h.contractId||null,h.eventType,h.note||'',JSON.stringify(h.state||{}),h.occurredAt||new Date(),h.recordedBy||null]);
      for(const p of data.payments||[]) await client.query('INSERT INTO payments(id,invoice_id,amount,method,reference,paid_at,recorded_by,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[p.id,p.invoiceId,p.amount,p.method,p.reference||'',p.paidAt||new Date(),p.recordedBy||null,p.note||'']);
      await client.query('UPDATE app_settings SET data=$1,updated_at=now() WHERE id=1',[JSON.stringify(data.settings)]);
      await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
    for(const key of oldKeys){try{await minio.removeObject(bucket,key);}catch{}}
    res.json({ok:true,restoredAt:new Date().toISOString(),fileCount:uploaded.length});
  }catch(error){for(const key of uploaded){try{await minio.removeObject(bucket,key);}catch{}}throw error;}
}));

// Publish only the UI entry point, its first-party assets, and locally bundled libraries.
app.use((req,res,next)=>{
  const permitted = req.path === '/' || ['/index.html','/app.js','/style.css'].includes(req.path) || req.path.startsWith('/vendor/');
  if (!permitted) return next();
  express.static(path.resolve(__dirname,'..'),{index:'index.html',dotfiles:'deny',fallthrough:true})(req,res,next);
});
app.use((req,res)=>res.status(404).json({error:'KhÃ´ng tÃ¬m tháº¥y Ä‘Æ°á»ng dáº«n.'}));
app.use((err,_req,res,_next)=>{
  console.error(err);
  if (res.headersSent) return res.end();
  const status=err.status || (['LIMIT_FILE_SIZE','LIMIT_FILE_COUNT','LIMIT_UNEXPECTED_FILE'].includes(err.code)?400:err.code==='23505'?409:['23503','23502','23514','22P02','22007','22003'].includes(err.code)?400:500);
  res.status(status).json({error:status>=500?'Lá»—i há»‡ thá»‘ng.':err.message || 'YÃªu cáº§u khÃ´ng há»£p lá»‡.'});
});

async function waitForDatabase() {
  for(let i=0;i<40;i++){ try{await pool.query('SELECT 1');return;}catch{await new Promise(r=>setTimeout(r,1500));} }
  throw new Error('PostgreSQL khÃ´ng sáºµn sÃ ng');
}
async function waitForMinio() {
  for(let i=0;i<40;i++){
    try{
      if(!(await minio.bucketExists(bucket))) await minio.makeBucket(bucket);
      return;
    }catch{await new Promise(r=>setTimeout(r,1500));}
  }
  throw new Error('MinIO is not ready');
}
async function ensureUsers() {
  const count=await pool.query('SELECT count(*)::int n FROM users');
  if(count.rows[0].n) return;
  for(const [name,email,password,role] of [
    [process.env.ADMIN_NAME||'Quáº£n trá»‹ viÃªn',process.env.ADMIN_EMAIL,process.env.ADMIN_PASSWORD,'administrator'],
    [process.env.STAFF_NAME||'NhÃ¢n viÃªn demo',process.env.STAFF_EMAIL,process.env.STAFF_PASSWORD,'staff']
  ]) {
    if(!email || !password || password.length<10) throw new Error('Cáº¥u hÃ¬nh ADMIN_* vÃ  STAFF_* trong .env (máº­t kháº©u tá»‘i thiá»ƒu 10 kÃ½ tá»±) trÆ°á»›c khi khá»Ÿi Ä‘á»™ng.');
    await pool.query('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING',[name,email.toLowerCase(),await bcrypt.hash(password,12),role]);
  }
}
async function start(){
  await waitForDatabase();
  const migration=fs.readFileSync(path.join(__dirname,'migrations','001_initial.sql'),'utf8');
  await pool.query(migration);
  await ensureUsers();
  await waitForMinio();
  const port=Number(process.env.PORT||8080);
  app.listen(port,'0.0.0.0',()=>console.log(`Web/API láº¯ng nghe táº¡i cá»•ng ${port}`));
}
if(require.main===module) start().catch(err=>{console.error(err);process.exit(1);});
module.exports={app,pool,mappings};
