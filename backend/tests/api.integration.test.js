const test = require("node:test");
const assert = require("node:assert/strict");

const API_BASE = process.env.API_BASE || "http://localhost:3000/api";

let msvSeq = 1;
const createValidMsv = () => {
  const year = new Date().getFullYear();
  const yy = String(year % 100).padStart(2, "0");
  const depCode = "01";
  const majorCode = "01";
  const serial = String((Date.now() + msvSeq) % 1000000).padStart(6, "0");
  msvSeq += 1;
  return `${yy}${depCode}${majorCode}${serial}`;
};

const request = async (path, options = {}) => {
  const { headers: customHeaders = {}, ...restOptions } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
    ...restOptions,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { status: response.status, data };
};

const loginAdmin = async () => {
  const adminPasswords = ["admin123456", "change-this-admin-password"];
  for (const password of adminPasswords) {
    const tryLoginRes = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "admin", password }),
    });
    if (tryLoginRes.status === 200 && tryLoginRes.data?.token) {
      return tryLoginRes.data.token;
    }
  }
  return null;
};

test("register + login + protected-route checks", async () => {
  const uniqueMsv = createValidMsv();

  const registerRes = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: uniqueMsv,
      password: "123456",
      full_name: "Integration User",
      khoa: "Khoa Cong nghe",
      nganh: "Cong nghe thong tin",
    }),
  });

  assert.equal(registerRes.status, 201);
  assert.equal(registerRes.data.user.username, uniqueMsv);

  const loginRes = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: uniqueMsv, password: "123456" }),
  });

  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.data.token);

  const userToken = loginRes.data.token;

  const futureDate = "2099-01-01";
  const createFutureItemRes = await request("/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      title: "Future test item",
      category: "Khác",
      description: "This should fail",
      location: "Test location",
      date_lost_found: futureDate,
    }),
  });

  assert.equal(createFutureItemRes.status, 400);

  const createItemRes = await request("/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      title: "Valid test item",
      category: "Khác",
      description: "Valid description for integration testing",
      location: "Test location",
      date_lost_found: new Date().toISOString().slice(0, 10),
    }),
  });

  assert.equal(createItemRes.status, 201);
  const itemId = createItemRes.data.item_id;
  assert.ok(itemId);

  const ownClaimRes = await request("/claims", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      item_id: itemId,
      description: "Toi la chu do nay, xin duoc nhan lai",
    }),
  });

  assert.equal(ownClaimRes.status, 400);

  const userAccessAdminRes = await request("/users", {
    method: "GET",
    headers: { Authorization: `Bearer ${userToken}` },
  });

  assert.equal(userAccessAdminRes.status, 403);
});

test("admin can access admin endpoints", async () => {
  const adminToken = await loginAdmin();
  assert.ok(
    adminToken,
    "Cannot login admin. Check ADMIN_PASSWORD in backend .env",
  );

  const adminUsersRes = await request("/users", {
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert.equal(adminUsersRes.status, 200);
  assert.ok(Array.isArray(adminUsersRes.data));

  const paginatedUsersRes = await request("/users?page=1&limit=5", {
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert.equal(paginatedUsersRes.status, 200);
  assert.ok(Array.isArray(paginatedUsersRes.data.data));
  assert.ok(typeof paginatedUsersRes.data.pagination?.totalPages === "number");
});

test("claim approval is idempotent and second processing is rejected", async () => {
  const ownerMsv = createValidMsv();
  const claimerMsv = createValidMsv();

  const registerOwnerRes = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: ownerMsv,
      password: "123456",
      full_name: "Owner Integration",
      khoa: "Khoa Cong nghe",
      nganh: "Cong nghe thong tin",
    }),
  });
  assert.equal(registerOwnerRes.status, 201);

  const registerClaimerRes = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: claimerMsv,
      password: "123456",
      full_name: "Claimer Integration",
      khoa: "Khoa Cong nghe",
      nganh: "Cong nghe thong tin",
    }),
  });
  assert.equal(registerClaimerRes.status, 201);

  const ownerLoginRes = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: ownerMsv, password: "123456" }),
  });
  assert.equal(ownerLoginRes.status, 200);

  const claimerLoginRes = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: claimerMsv, password: "123456" }),
  });
  assert.equal(claimerLoginRes.status, 200);

  const createItemRes = await request("/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${ownerLoginRes.data.token}` },
    body: JSON.stringify({
      title: "Claim idempotent item",
      category: "Khác",
      description: "Item for testing claim state transitions",
      location: "Integration location",
      date_lost_found: new Date().toISOString().slice(0, 10),
    }),
  });
  assert.equal(createItemRes.status, 201);

  const createClaimRes = await request("/claims", {
    method: "POST",
    headers: { Authorization: `Bearer ${claimerLoginRes.data.token}` },
    body: JSON.stringify({
      item_id: createItemRes.data.item_id,
      description: "Toi co the mo ta chi tiet de xac minh quyen so huu",
    }),
  });
  assert.equal(createClaimRes.status, 201);

  const adminToken = await loginAdmin();
  assert.ok(
    adminToken,
    "Cannot login admin. Check ADMIN_PASSWORD in backend .env",
  );

  const firstApproveRes = await request(
    `/claims/${createClaimRes.data.claim_id}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "APPROVED" }),
    },
  );
  assert.equal(firstApproveRes.status, 200);

  const secondApproveRes = await request(
    `/claims/${createClaimRes.data.claim_id}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "APPROVED" }),
    },
  );
  assert.equal(secondApproveRes.status, 409);
});

test("deleting user cascades owned items and related claims", async () => {
  const ownerMsv = createValidMsv();
  const claimerMsv = createValidMsv();

  const registerOwnerRes = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: ownerMsv,
      password: "123456",
      full_name: "Cascade Owner",
      khoa: "Khoa Cong nghe",
      nganh: "Cong nghe thong tin",
    }),
  });
  assert.equal(registerOwnerRes.status, 201);

  const registerClaimerRes = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: claimerMsv,
      password: "123456",
      full_name: "Cascade Claimer",
      khoa: "Khoa Cong nghe",
      nganh: "Cong nghe thong tin",
    }),
  });
  assert.equal(registerClaimerRes.status, 201);

  const ownerLoginRes = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: ownerMsv, password: "123456" }),
  });
  assert.equal(ownerLoginRes.status, 200);

  const claimerLoginRes = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: claimerMsv, password: "123456" }),
  });
  assert.equal(claimerLoginRes.status, 200);

  const itemRes = await request("/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${ownerLoginRes.data.token}` },
    body: JSON.stringify({
      title: "Cascade test item",
      category: "Khác",
      description: "Item should be deleted when owner account is removed",
      location: "Cascade location",
      date_lost_found: new Date().toISOString().slice(0, 10),
    }),
  });
  assert.equal(itemRes.status, 201);

  const claimRes = await request("/claims", {
    method: "POST",
    headers: { Authorization: `Bearer ${claimerLoginRes.data.token}` },
    body: JSON.stringify({
      item_id: itemRes.data.item_id,
      description: "Claim used to validate cascade cleanup behavior",
    }),
  });
  assert.equal(claimRes.status, 201);

  const adminToken = await loginAdmin();
  assert.ok(
    adminToken,
    "Cannot login admin. Check ADMIN_PASSWORD in backend .env",
  );

  const deleteOwnerRes = await request(`/users/${ownerLoginRes.data.user.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(deleteOwnerRes.status, 200);

  const itemAfterDeleteRes = await request(`/items/${itemRes.data.item_id}`, {
    method: "GET",
  });
  assert.equal(itemAfterDeleteRes.status, 404);

  const claimsAfterDeleteRes = await request("/claims", {
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(claimsAfterDeleteRes.status, 200);
  assert.equal(
    claimsAfterDeleteRes.data.some((c) => c.id === claimRes.data.claim_id),
    false,
  );
});
