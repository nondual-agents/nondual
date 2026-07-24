/**
 * Nondual CSV import example — LinkedIn connections export
 *
 * Takes a LinkedIn connections export CSV (or any CSV with email + linkedin_url columns)
 * and imports every row as a contact. Uses `also` to merge email + LinkedIn into one
 * contact even when enrichment data can't bridge the gap.
 *
 * Usage:
 *   NONDUAL_API_KEY=nd_... npx tsx csv-import.ts connections.csv
 *
 * CSV format expected (LinkedIn export):
 *   First Name, Last Name, Email Address, Company, Position, Connected On, URL
 */
import { Nondual } from 'nondual';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const nd = new Nondual();

interface Row {
  email: string;
  linkedin_url?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  company?: string;
  role?: string;
}

async function parseCsv(path: string): Promise<Row[]> {
  const rows: Row[] = [];
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  let headers: string[] = [];

  for await (const line of rl) {
    const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (headers.length === 0) {
      headers = cells.map(h => h.toLowerCase().replace(/\s+/g, '_'));
      continue;
    }
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cells[i] ?? ''; });

    const email = obj['email_address'] || obj['email'] || '';
    if (!email) continue; // skip rows without email

    rows.push({
      email,
      linkedin_url: obj['url'] || obj['linkedin_url'] || undefined,
      first_name: obj['first_name'],
      last_name: obj['last_name'],
      name: obj['name'] || (obj['first_name'] && obj['last_name']
        ? `${obj['first_name']} ${obj['last_name']}` : undefined),
      company: obj['company'],
      role: obj['position'] || obj['role'],
    });
  }

  return rows;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: NONDUAL_API_KEY=nd_... npx tsx csv-import.ts <connections.csv>');
    process.exit(1);
  }

  const rows = await parseCsv(csvPath);
  console.log(`Parsed ${rows.length} rows from ${csvPath}\n`);

  // Option A: use /imports for bulk upsert (fastest — up to 5000 rows per call)
  console.log('Importing via bulk /imports endpoint...');
  const result = await (nd as any).imports({
    rows: rows.map(r => ({
      email: r.email,
      linkedin_url: r.linkedin_url,
      name: r.name,
      company: r.company,
      role: r.role,
    })),
  });

  const imp = result.imported;
  console.log(`\nImport complete:`);
  console.log(`  contacts created: ${imp.contacts_created}`);
  console.log(`  contacts updated: ${imp.contacts_updated}`);

  if (result.errors?.length) {
    console.log(`\nErrors (${result.errors.length}):`);
    for (const e of result.errors.slice(0, 10)) {
      console.log(`  row ${e.row}: ${e.message}`);
    }
  }

  // Option B: for contacts where you want guaranteed email+LinkedIn merge,
  // call get-contact-info with `also` per row (slower but ensures identity merge)
  console.log('\n--- Per-contact merge for rows with both email and LinkedIn ---');
  const mergeable = rows.filter(r => r.email && r.linkedin_url);
  console.log(`${mergeable.length} rows have both email and LinkedIn URL`);
  console.log('Example call for first row:');

  if (mergeable[0]) {
    const r = mergeable[0];
    console.log(JSON.stringify({
      contact: r.email,
      also: r.linkedin_url ? [r.linkedin_url] : [],
      enrich: true,
    }, null, 2));
    // Uncomment to actually run:
    // const info = await nd.getContactInfo({ contact: r.email, also: r.linkedin_url ? [r.linkedin_url] : [] });
    // console.log('Merged contact:', info.contact.id, info.contact.name);
  }
}

main().catch(console.error);
