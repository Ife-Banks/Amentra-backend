import { Readable } from 'stream';
import csv from 'csv-parser';

export const parseCSVBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = Readable.from(buffer);
    stream
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (row) => {
        const trimmed = {};
        for (const [k, v] of Object.entries(row)) {
          trimmed[k.trim()] = typeof v === 'string' ? v.trim() : v;
        }
        rows.push(trimmed);
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
};
