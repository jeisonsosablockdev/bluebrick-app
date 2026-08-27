/**
 * ============================================================================
 * Layer 4: Infrastructure - Streaming Spreadsheet Adapter Test Suite
 * ============================================================================
 * Tests formula injection neutralization, serial date conversion,
 * spreadsheet parsing, and canonical client mapping.
 */

import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { StreamingSpreadsheetAdapter } from './streaming-spreadsheet-adapter';
import {
  excelSerialToIsoDate,
  sanitizeSpreadsheetCell,
} from '../domain/utils/excel-date-converter';

describe('Spreadsheet Parser & Formula Sanitizer', () => {
  describe('excelSerialToIsoDate()', () => {
    it('converts serial date numbers to ISO strings', () => {
      expect(excelSerialToIsoDate(44562)).toBe('2022-01-01');
      expect(excelSerialToIsoDate(0)).toBeNull();
      expect(excelSerialToIsoDate(-10)).toBeNull();
      expect(excelSerialToIsoDate(NaN)).toBeNull();
    });
  });

  describe('sanitizeSpreadsheetCell()', () => {
    it('neutralizes executable CSV / DDE formula injection prefixes with single quote', () => {
      expect(sanitizeSpreadsheetCell('=1+1')).toBe("'=1+1");
      expect(sanitizeSpreadsheetCell('+cmd|/c calc')).toBe("'+cmd|/c calc");
      expect(sanitizeSpreadsheetCell('-5+10')).toBe("'-5+10");
      expect(sanitizeSpreadsheetCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
      expect(sanitizeSpreadsheetCell('\tmaliciousTab')).toBe("'\tmaliciousTab");
    });

    it('coerces spreadsheet formula error tokens to null', () => {
      expect(sanitizeSpreadsheetCell('#REF!')).toBeNull();
      expect(sanitizeSpreadsheetCell('#DIV/0!')).toBeNull();
      expect(sanitizeSpreadsheetCell('#N/A')).toBeNull();
      expect(sanitizeSpreadsheetCell('#VALUE!')).toBeNull();
    });

    it('leaves standard strings and numbers untouched', () => {
      expect(sanitizeSpreadsheetCell('Inversiones SAS')).toBe('Inversiones SAS');
      expect(sanitizeSpreadsheetCell(150000)).toBe(150000);
      expect(sanitizeSpreadsheetCell(null)).toBeNull();
    });
  });

  describe('StreamingSpreadsheetAdapter', () => {
    const adapter = new StreamingSpreadsheetAdapter();

    it('parses XLSX buffer and maps rows to CanonicalClient entities', async () => {
      // Step 1: Create a synthetic XLSX workbook in memory
      const wb = XLSX.utils.book_new();
      const wsData = [
        ['Nombre Cliente', 'NIT / Cedula', 'Correo', 'Telefono', 'Valor Inversion', 'Notas'],
        ['Constructora Andina', '900.111.222-3', 'contacto@andina.co', '+57 300 000 1111', 500000000, 'Abono inicial'],
        ['Fiduciaria Central', '800.333.444-5', 'fiducia@central.co', '+57 311 222 3333', '750000000.00', 'Fideicomiso'],
        ['=Inyeccion Maliciosa', '123456', 'bad@test.com', '12345', 1000, 'Payload test'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes 2026');

      const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Step 2: Parse buffer through adapter
      const result = await adapter.parseSpreadsheet(xlsxBuffer, 'clientes.xlsx');

      expect(result.sheets.length).toBe(1);
      expect(result.sheets[0].sheetName).toBe('Clientes 2026');
      expect(result.sheets[0].clients.length).toBe(3);

      const client1 = result.sheets[0].clients[0];
      expect(client1.name).toBe('Constructora Andina');
      expect(client1.taxId).toBe('900.111.222-3');
      expect(client1.contractAmount).toBe('500000000.00');

      // Verify formula injection in client 3 was neutralized with quote
      const client3 = result.sheets[0].clients[2];
      expect(client3.name).toBe("'=Inyeccion Maliciosa");
    });

    it('throws EMPTY_SPREADSHEET on empty buffer', async () => {
      await expect(
        adapter.parseSpreadsheet(new Uint8Array(0), 'empty.xlsx')
      ).rejects.toMatchObject({
        code: 'EMPTY_SPREADSHEET',
      });
    });
  });
});
