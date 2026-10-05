/**
 * Race Condition Test Script
 * ===========================
 * Tests that concurrent borrow requests for a book with 1 copy result in
 * EXACTLY one success and the rest returning 409.
 *
 * This proves the atomic $inc approach prevents double-booking.
 *
 * Usage: npm run race-test
 *
 * Prerequisites:
 * 1. Backend must be running (npm run dev)
 * 2. Database must be seeded (npm run seed)
 * 3. The book with title "Race Test Book" will be created fresh.
 */
import 'dotenv/config';

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;

// ─── Helper: HTTP request ────────────────────────────────────────────────────
async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   ShelfLife Race Condition Test           ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // 1. Login to get token
  console.log('[1] Authenticating...');
  const loginRes = await request('POST', '/auth/login', {
    email: 'librarian@shelflife.com',
    password: 'Admin@123',
  });

  if (loginRes.status !== 200) {
    console.error('❌ Login failed. Is the server running and seeded?');
    console.error(loginRes.data);
    process.exit(1);
  }
  const token = loginRes.data.token;
  console.log('✅ Authenticated\n');

  // 2. Create a fresh book with exactly 1 copy
  console.log('[2] Creating test book with 1 copy...');
  const bookRes = await request('POST', '/books', {
    title: 'Race Test Book - ' + Date.now(),
    author: 'Test Author',
    isbn: `978${Date.now().toString().slice(-10)}`,
    genre: 'Fiction',
    totalCopies: 1,
    availableCopies: 1,
  }, token);

  if (bookRes.status !== 201) {
    console.error('❌ Failed to create test book:', bookRes.data);
    process.exit(1);
  }
  const bookId = bookRes.data.data._id;
  console.log(`✅ Book created: ${bookRes.data.data.title} (id: ${bookId})\n`);

  // 3. Create 3 test members (for concurrent borrows)
  console.log('[3] Creating test members...');
  const memberIds = [];
  for (let i = 1; i <= 10; i++) {
    const ts = Date.now() + i;
    const res = await request('POST', '/members', {
      name: `Race Tester ${i}`,
      email: `racetester${ts}@test.com`,
      membershipId: `RACE${ts}`,
    }, token);
    if (res.status === 201) memberIds.push(res.data.data._id);
  }
  console.log(`✅ Created ${memberIds.length} test members\n`);

  // 4. Fire 10 concurrent borrow requests
  console.log('[4] Firing 10 concurrent borrow requests for 1-copy book...');
  console.log('    (Only 1 should succeed, 9 should receive 409)\n');

  const requests = memberIds.map((memberId) =>
    request('POST', '/borrow', { bookId, memberId }, token)
  );

  const start = Date.now();
  const results = await Promise.all(requests);
  const duration = Date.now() - start;

  // 5. Analyze results
  const successes = results.filter((r) => r.status === 201);
  const conflicts = results.filter((r) => r.status === 409);
  const others = results.filter((r) => r.status !== 201 && r.status !== 409);

  console.log('╔═══════════════════════════════════════════╗');
  console.log('║           RACE TEST RESULTS               ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║  Total requests  : 10                     ║`);
  console.log(`║  Successes (201) : ${successes.length}${' '.repeat(27)}║`);
  console.log(`║  Conflicts (409) : ${conflicts.length}${' '.repeat(27)}║`);
  console.log(`║  Other errors    : ${others.length}${' '.repeat(27)}║`);
  console.log(`║  Duration        : ${duration}ms${' '.repeat(Math.max(0, 24 - duration.toString().length))}║`);
  console.log('╚═══════════════════════════════════════════╝\n');

  if (successes.length === 1 && conflicts.length === 9) {
    console.log('✅ PASS: Exactly 1 borrow succeeded, 9 were correctly rejected.');
    console.log('   Atomic conditional update prevents race conditions!\n');
  } else {
    console.log('❌ FAIL: Race condition detected!');
    console.log(`   Expected: 1 success, 9 conflicts`);
    console.log(`   Got: ${successes.length} successes, ${conflicts.length} conflicts`);
  }

  // Verify book availableCopies is now 0
  const booksRes = await request('GET', `/books?search=Race+Test+Book`);
  // Direct DB verification message
  console.log('\n[5] Verify: GET /api/books and check book in DB has availableCopies=0');
  console.log('    Run: db.books.findOne({ title: /Race Test Book/ }) in mongosh\n');

  if (others.length > 0) {
    console.log('Other errors:');
    others.forEach((r) => console.log(`  ${r.status}:`, JSON.stringify(r.data)));
  }
}

main().catch((err) => {
  console.error('Race test failed:', err.message);
  process.exit(1);
});
