# DJT EV — Admin Web (djt-web) ↔ djt-app Backend Integration & Database Guide

> **Scope of this document**
> - Live database was accessed **READ-ONLY** (only `SHOW` / `DESCRIBE` / `SELECT` were executed — no writes).
> - All `ALTER` / `INSERT` / `UPDATE` statements below are **provided as queries for you to run**. They were **not** executed against the database.
> - Covers: live DB facts, admin (email + password) login design and SQL, the frontend↔backend API gap, and the dashboard data mapping.

Generated: 2026-06-23

---

## 1. Systems involved

| System | Location | Role |
|---|---|---|
| **djt-web** (this repo) | `D:\personal\djt-web\frontend` | React (CRA) **admin** web console. Uses **email + password** login. Talks to `REACT_APP_API_URL` (default now `http://localhost:5000/api`). |
| **djt-app** | `D:\personal\djt-app` | Node/Express API ("phone-auth-server") on port **5000**, routes under `/api`. Currently **phone + OTP** auth only. |
| **Live MySQL DB** | `3.110.84.196:3306` / `DJT_POWERTECH_DEV` | Source of truth for users, stations, sessions, wallet, payments. |
| **Deployed platform** | https://djt-ev.web.app | Firebase-hosted build (separate deploy). The login `yerrasekhar3@gmail.com / Pass@7890` is for **that** platform. |

### Database connection (from `djt-app/.env`)
```
HOST = 3.110.84.196
PORT = 3306
USER = root
DB   = DJT_POWERTECH_DEV
```

---

## 2. ⚠️ Critical findings (read these first)

1. **The live DB schema does NOT match `djt-app/database/schema.sql`.**
   `schema.sql` (and all `djt-app/api` model code) uses names like `users_t`, `charging_sessions_t`, `wallet_t`.
   The **live** database uses a different convention: `usr_lst_t`, `sssn_lst_t`, `wllt_lst_t`, `trxn_lst_t`, etc.
   → Running the current `djt-app` code against this DB fails with `Table '...users_t' doesn't exist`.
   → **Use the `*_lst_t` table names below.** They are the real ones.

2. **There is no password in the system today.** Auth is phone + OTP (`otp_lst_t`). No `pswd`/`hash` column exists on `usr_lst_t`. To support **admin email + password login (no OTP)** as requested, you must (a) add a password column and (b) add a backend login endpoint. SQL + endpoint design are in §4–§5.

3. **No admin user exists yet.** `usr_typ_cd` values currently in the DB: `customer` (2), `owner` (1). No `admin`.

4. **`yerrasekhar3@gmail.com` is not in this database.** Those credentials belong to the deployed Firebase platform, not `DJT_POWERTECH_DEV`. We will create a matching admin (same email/password) in the DB so the admin console can authenticate against djt-app.

5. **Live data volume (as of access):** users = 3, charging sessions = 0, stations = 4, wallet txns = 5, payment orders = 18.

---

## 3. Live database — real schema reference

Verified via `DESCRIBE` (read-only). Only the tables relevant to admin login + dashboard are shown.

### `usr_lst_t` — Users (login target)
| Column | Type | Notes |
|---|---|---|
| `usr_id` | int PK AI | |
| `phn_nmbr_tx` | varchar(15) **UNIQUE NOT NULL** | required even for admin |
| `eml_tx` | varchar(100) UNIQUE | admin login id |
| `nm_tx` | varchar(100) | |
| `prfl_img_tx` | varchar(255) | |
| `usr_typ_cd` | varchar(20) default `customer` | `customer` / `owner` / **`admin`** |
| `a_in` | tinyint default 1 | active flag |
| `i_ts` / `u_ts` / `d_ts` | timestamp | insert / update / delete |
| `insrt_usr_id` / `updte_usr_id` | int | audit |
| *(no password column — see §4)* | | |

### `sttn_lst_t` — Charging stations
`sttn_id` PK, `ownr_usr_id`, `aprvl_sttus_cd` (`active`…), `sttn_nm_tx`, `sttn_cd` UNIQUE, `addr_tx`, `cty_tx`, `stte_tx`, `ltde_nbr`, `lngtde_nbr`, `prce_per_kwh_amt`, `ttl_chrgrs_nbr`, `avlbl_chrgrs_nbr`, `rtng_nbr`, `is_fst_chrgng_in`, `pwr_tx`, `oprtr_nm_tx`, `a_in`, `i_ts`, `u_ts`.

### `sssn_lst_t` — Charging sessions
`sssn_id` PK, `sssn_cd` UNIQUE, `usr_id`, `sttn_id`, `cnntr_id`, `strt_ts`, `end_ts`, `durn_mnts_nbr`, `enrgy_cnsmd_kwh(10,3)`, `prce_per_kwh_amt`, `ttl_cst_amt(10,2)`, `prgrss_pct`, `sttus_cd`, `a_in`, `i_ts`.

### `trxn_lst_t` — Wallet transactions
`trxn_id` PK, `wllt_id`, `usr_id`, `trxn_typ_cd` (credit/debit/refund), `trxn_ctgry_cd` (charging/topup/transfer…), `amt`, `blnce_bfr_amt`, `blnce_aftr_amt`, `dscrptn_tx`, `ref_id`, `ref_typ_cd`, `pymnt_mthd_cd`, `sttus_cd` default `completed`, `a_in`, `i_ts`.

### `wllt_lst_t` — Wallets
`wllt_id` PK, `usr_id` UNIQUE, `blnce_amt(10,2)` default 0, `lst_updtd_ts`, `a_in`, `i_ts`, `u_ts`.

### `pay_ordr_lst_t` — Payment orders (Razorpay / QR top-ups)
`pay_ordr_id` PK, `usr_id`, `rzrpy_ordr_id_tx`, `rzrpy_pymnt_id_tx`, `rzrpy_sgntr_tx`, `amt`, `crncy_cd` default `INR`, `purpose_cd` default `wallet_topup`, `pymnt_mthd_cd`, `sttus_cd` default `created`, `is_mock_in`, `trxn_id`, `jrnl_id`, `a_in`, `i_ts`, `u_ts`.

### `mchn_lst_t` — Machines / chargers
`mchn_id` PK, `sttn_id`, `mchn_nm_tx`, `mchn_srl_no_tx`, `ocpp_id_tx`, `mchn_typ_cd` default `DC`, `mchn_pwr_id`, `max_pwr_tx`, `ttl_cnntrs_nbr`, `sttus_cd` default `available`, `lst_hb_ts` (last heartbeat), `a_in`, `i_ts`, `u_ts`.

### `otp_lst_t` — OTP (mobile auth; not used by admin email/password)
`otp_id` PK, `phn_nmbr_tx`, `otp_tx`, `expry_ts`, `attmpts_nbr`, `is_vrfd_in`, `vrfd_ts`, `a_in`, `i_ts`.

> Other live tables present: `acct_lst_t`, `audt_lst_t`, `bkng_lst_t`, `cmsn_rule_lst_t`, `cnntr_lst_t`, `fvrt_lst_t`, `jrnl_lst_t`, `jrnl_leg_lst_t`, `mchn_pwr_lst_t`, `ntfctn_lst_t`, `offr_lst_t`, `pay_mode_lst_t`, `pay_sttus_lst_t`, `pay_wbhk_lst_t`, `prf_lst_t`, `rvw_lst_t`, `setlmnt_lst_t`, `sms_cnfg_t`, `sms_msg_log_t`, `sms_tmplt_lst_t`, `sssn_log_lst_t`, `stt_lst_t`, `sttng_lst_t`, `tkn_lst_t`, `usg_lst_t`, `vhcl_lst_t`.

---

## 4. Admin login = **email + password (no OTP)** — required SQL

The schema has no password column, so add one, then create the admin row.

### 4.0 READ-ONLY verification queries (these are the ones actually run)
```sql
-- Confirm no admin yet and inspect current users
SELECT usr_typ_cd, COUNT(*) cnt FROM usr_lst_t GROUP BY usr_typ_cd;
SELECT usr_id, phn_nmbr_tx, eml_tx, nm_tx, usr_typ_cd, a_in
FROM usr_lst_t WHERE usr_typ_cd IN ('admin','operator','superadmin');
SELECT * FROM usr_lst_t WHERE eml_tx = 'yerrasekhar3@gmail.com';   -- returns empty
```

### 4.1 Add a password column (run once)
```sql
ALTER TABLE usr_lst_t
  ADD COLUMN pswd_hash_tx VARCHAR(255) NULL COMMENT 'SHA1 hash (hex) for email/password login' AFTER eml_tx;

-- helpful index for admin lookups
ALTER TABLE usr_lst_t ADD INDEX idx_usr_typ (usr_typ_cd);
```

### 4.2 Create the admin user (email + password, no OTP)
Password `Pass@7890` is pre-hashed with **SHA1 (hex)**. `phn_nmbr_tx` is `NOT NULL UNIQUE`, so a placeholder number is supplied.
```sql
INSERT INTO usr_lst_t
  (phn_nmbr_tx, eml_tx, pswd_hash_tx, nm_tx, usr_typ_cd, a_in, insrt_usr_id)
VALUES
  ('9999900001',
   'yerrasekhar3@gmail.com',
   'afcc66fea531ce9fed567aa7c7f53c68be6f724f',  -- SHA1('Pass@7890')
   'DJT Admin',
   'admin',
   1,
   1);
```

> Equivalent using MySQL's built-in function (no app-side hashing needed):
> ```sql
> INSERT INTO usr_lst_t (phn_nmbr_tx, eml_tx, pswd_hash_tx, nm_tx, usr_typ_cd, a_in, insrt_usr_id)
> VALUES ('9999900001', 'yerrasekhar3@gmail.com', SHA1('Pass@7890'), 'DJT Admin', 'admin', 1, 1);
> ```

If the email/phone already exists and you only want to upgrade it to admin + set a password:
```sql
UPDATE usr_lst_t
SET usr_typ_cd   = 'admin',
    pswd_hash_tx = SHA1('Pass@7890'),   -- = afcc66fea531ce9fed567aa7c7f53c68be6f724f
    a_in         = 1
WHERE eml_tx = 'yerrasekhar3@gmail.com';
```

### 4.3 (Optional) give the admin a wallet row
```sql
INSERT INTO wllt_lst_t (usr_id, blnce_amt, a_in)
SELECT usr_id, 0.00, 1 FROM usr_lst_t WHERE eml_tx = 'yerrasekhar3@gmail.com'
ON DUPLICATE KEY UPDATE a_in = 1;
```

### 4.4 Verify (read-only)
```sql
SELECT usr_id, eml_tx, nm_tx, usr_typ_cd, a_in,
       CASE WHEN pswd_hash_tx IS NULL THEN 'NO PWD' ELSE 'HAS PWD' END AS pwd
FROM usr_lst_t WHERE eml_tx = 'yerrasekhar3@gmail.com';
```

### Regenerate the hash for a different password (SHA1)
```bash
node -e "console.log(require('crypto').createHash('sha1').update('YOUR_PASSWORD').digest('hex'))"
```
Or directly in SQL: `SELECT SHA1('YOUR_PASSWORD');`

> **Security note:** SHA1 is a fast, unsalted digest and is not recommended for password storage (vulnerable to rainbow-table / brute-force attacks). It is used here per request. If hardening later, prefer bcrypt/argon2 with a per-user salt.

---

## 5. Backend change needed for admin login (djt-app)

djt-app today has **no** email/password endpoint. The frontend (`authApi.login`) calls `POST /api/auth/login`. Add this route + controller (server-side validates bcrypt and returns a JWT):

```
POST /api/auth/login        body { email, password }
   → SELECT usr_id, eml_tx, pswd_hash_tx, usr_typ_cd, nm_tx FROM usr_lst_t
       WHERE eml_tx = ? AND a_in = 1
   → verify: sha1(password) === pswd_hash_tx   // crypto.createHash('sha1').update(password).digest('hex')
                                                // or in SQL: WHERE pswd_hash_tx = SHA1(?)
   → enforce usr_typ_cd = 'admin'
   → jwt.sign({ userId, email, userType:'admin' }, JWT_SECRET, { expiresIn:'30d' })
   → respond { user, accessToken, refreshToken }
GET  /api/auth/me           (verifyToken)  → current admin profile
POST /api/auth/logout       → 200
```
Token transport already supported by `accessCtrl.verifyToken`: `Authorization: Bearer <token>` or `x-access-token`.

> The frontend expects the response shape `{ data: { user, accessToken, refreshToken } }` (see `authSlice.login`). Match it, or adjust the slice.

---

## 6. Frontend ↔ Backend API gap

The admin console expects **global/admin-scoped** endpoints; djt-app currently exposes **per-user** ones. None match yet.

| Frontend call (`services/api.ts`) | djt-app today | Action |
|---|---|---|
| `POST /auth/login` (email/pwd) | ❌ none (OTP only) | add per §5 |
| `GET /auth/me`, `POST /auth/logout` | ❌ | add |
| `GET /dashboard/overview` | ❌ (`/dashboard/home` is per-user) | add admin overview (§7) |
| `GET /dashboard/session-trends` | ~ `/dashboard/analytics/weekly` (per-user) | add admin/global trend |
| `GET /dashboard/top-stations` | ❌ | add (§7) |
| `GET /dashboard/live-sessions` | ❌ | add (§7) |
| `GET /dashboard/station-status` | ❌ | add (§7) |
| `GET /dashboard/recent-activity` | ❌ | add |

All new admin endpoints should sit behind `verifyToken` + an `isAdmin` check (`req.user.userType === 'admin'`).

---

## 7. Dashboard data mapping — admin queries (live `*_lst_t` tables)

These power the redesigned admin dashboard. All read-only; run as the backing queries for the new admin endpoints.

**Overview cards** (total/online stations, active sessions, today energy, today revenue):
```sql
SELECT
  (SELECT COUNT(*) FROM sttn_lst_t WHERE a_in=1)                          AS total_stations,
  (SELECT COUNT(*) FROM mchn_lst_t WHERE a_in=1 AND sttus_cd='available') AS online_chargers,
  (SELECT COUNT(*) FROM sssn_lst_t WHERE sttus_cd='active')               AS active_sessions,
  (SELECT COALESCE(SUM(enrgy_cnsmd_kwh),0) FROM sssn_lst_t
     WHERE sttus_cd='completed' AND DATE(strt_ts)=CURDATE())              AS today_energy_kwh,
  (SELECT COALESCE(SUM(ttl_cst_amt),0) FROM sssn_lst_t
     WHERE sttus_cd='completed' AND DATE(strt_ts)=CURDATE())              AS today_revenue;
```

**Session trends (last 7 days):**
```sql
SELECT DATE(strt_ts) AS period,
       COUNT(*) AS sessions,
       COALESCE(SUM(enrgy_cnsmd_kwh),0) AS energy,
       COALESCE(SUM(ttl_cst_amt),0)     AS revenue
FROM sssn_lst_t
WHERE sttus_cd='completed' AND strt_ts >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(strt_ts) ORDER BY period;
```

**Top performing stations:**
```sql
SELECT s.sttn_id, st.sttn_nm_tx AS name,
       COUNT(*) AS session_count,
       COALESCE(SUM(s.ttl_cst_amt),0) AS total_revenue
FROM sssn_lst_t s
JOIN sttn_lst_t st ON st.sttn_id = s.sttn_id
WHERE s.sttus_cd='completed'
GROUP BY s.sttn_id, st.sttn_nm_tx
ORDER BY total_revenue DESC LIMIT 5;
```

**Live sessions:**
```sql
SELECT s.sssn_id AS id, st.sttn_nm_tx AS station_name, u.nm_tx AS driver_name,
       s.enrgy_cnsmd_kwh AS energy, s.prgrss_pct, s.sttus_cd AS status, s.strt_ts
FROM sssn_lst_t s
JOIN sttn_lst_t st ON st.sttn_id = s.sttn_id
JOIN usr_lst_t  u  ON u.usr_id  = s.usr_id
WHERE s.sttus_cd='active' ORDER BY s.strt_ts DESC;
```

**Station status (online/offline by heartbeat):**
```sql
SELECT
  SUM(CASE WHEN sttus_cd='available' THEN 1 ELSE 0 END) AS online,
  SUM(CASE WHEN sttus_cd!='available' THEN 1 ELSE 0 END) AS offline,
  (SELECT COUNT(*) FROM cnntr_lst_t WHERE a_in=1)        AS total_connectors
FROM mchn_lst_t WHERE a_in=1;
```

**Payments / QR top-ups (revenue widgets, transfers):**
```sql
SELECT sttus_cd, COUNT(*) orders, COALESCE(SUM(amt),0) amount
FROM pay_ordr_lst_t
WHERE i_ts >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY sttus_cd;
```

---

## 8. Read-only compliance note
Against the live DB only `SHOW TABLES`, `DESCRIBE`, and `SELECT … LIMIT` were executed. Every `ALTER`/`INSERT`/`UPDATE` in this document is supplied for you to review and run — none were applied automatically.
```
```
