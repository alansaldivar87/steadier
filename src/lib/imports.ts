import { parse } from 'csv-parse/sync';
import { dollarsToCents, dateSchema } from './domain';
type ImportedDraft = { kind: 'transaction'; data: Record<string, unknown>; reason: string };
export function csvDrafts(
  text: string,
  accountId: string | null,
  documentId: string,
): ImportedDraft[] {
  const records: Record<string, string>[] = parse(text, {
    columns: (headers: string[]) => headers.map((h) => h.trim().toLowerCase()),
    bom: true,
    skip_empty_lines: true,
    trim: true,
    max_record_size: 20000,
  });
  if (records.length > 500)
    throw new Error('This CSV has more than 500 rows. Split it into smaller files.');
  if (!records.length) throw new Error('No transaction rows were found.');
  return records.map((r, index) => {
    let date = r.date || r['transaction date'] || r['posting date'] || '';
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
      const [m, d, y] = date.split('/');
      date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (!dateSchema.safeParse(date).success)
      throw new Error(`Row ${index + 2}: use YYYY-MM-DD or U.S. MM/DD/YYYY dates.`);
    const description = r.description || r.memo || r.name || r.payee || '';
    if (!description) throw new Error(`Row ${index + 2}: a Description column is required.`);
    let signed: number;
    if (r.amount !== undefined && r.amount !== '') signed = dollarsToCents(r.amount);
    else if (r.debit || r.credit) {
      if (r.debit && r.credit && dollarsToCents(r.debit) !== 0 && dollarsToCents(r.credit) !== 0)
        throw new Error(`Row ${index + 2}: both Debit and Credit contain money.`);
      signed =
        r.debit && dollarsToCents(r.debit) !== 0
          ? -Math.abs(dollarsToCents(r.debit))
          : Math.abs(dollarsToCents(r.credit || '0'));
    } else
      throw new Error('Use Amount (negative for money out), or separate Debit and Credit columns.');
    if (signed === 0) throw new Error(`Row ${index + 2}: zero-amount rows cannot be imported.`);
    return {
      kind: 'transaction',
      data: {
        date,
        description,
        amountCents: Math.abs(signed),
        type: signed < 0 ? 'expense' : 'income',
        accountId: accountId || '',
        toAccountId: null,
        category: r.category || 'Unsorted',
        sourceId: `${documentId}:row:${index + 2}`,
        note: '',
      },
      reason: `CSV row ${index + 2}. Confirm direction and type: transfers, refunds, card payments and cash advances must be classified correctly. Dates with slashes use U.S. month/day/year.`,
    };
  });
}
