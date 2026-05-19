
'use server';

import type { User } from '@/lib/types';
import * as xlsx from 'node-xlsx';

export async function exportUsersToExcel(users: User[]): Promise<{ fileContents: string, fileName: string }> {
  const headers = [
    'ID', 'Name', 'Maiden Surname', 'Current Surname', 'Family',
    'Gender', 'Marital Status', 'Birth Month', 'Birth Year',
    'Father Name', 'Mother Name', 'Spouse Name', 'Father ID',
    'Mother ID', 'Spouse ID', 'Description', 'Is Deceased', 'Death Date'
  ];

  const dataToExport = users.map(user => [
    user.id, user.name, user.maidenName, user.surname, user.family,
    user.gender, user.maritalStatus, user.birthMonth, user.birthYear,
    user.fatherName, user.motherName, user.spouseName, user.fatherId,
    user.motherId, user.spouseId, user.description, user.isDeceased,
    user.deathDate,
  ]);

  const sheetData = [headers, ...dataToExport];
  const buffer = xlsx.build([{ name: 'Users', data: sheetData, options: {} }]);
  
  const fileContents = buffer.toString('base64');
  const fileName = `vasudha_connect_export_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return { fileContents, fileName };
}
