import axios from 'axios';

interface TranscodeRow {
  assetId: string;
  accountId: string;
  errorMessage: string;
  assetLink?: string;
  profile?: string;
  accountName: string;
  stage: string;
  publishId?: string;
  time: string;
  logLink?: string;
  provider?: string;
  defaultStatus?:
    | 'Created'
    | 'Elevated'
    | 'fixed'
    | 'not fixed'
    | 'Flag'
    | 'In Progress Support'
    | 'In Progress Dev';
}

async function coda(data: TranscodeRow): Promise<void> {
  await axios({
    url: 'https://coda.io/apis/v1/docs/kz6CSLf2xX/tables/grid-saLDZ9ySKU/rows',
    method: 'POST',
    headers: { Authorization: 'Bearer 9bfa3b73-ca68-4437-b9db-1201ad60dedd' },
    data: {
      rows: [
        {
          cells: [
            {
              // Required
              column: 'c-pYn6nDiLEy',
              value: data.assetId,
            },
            {
              // Required
              column: 'c-SA29xeRkzO',
              value: data.accountId,
            },
            {
              // Required
              column: 'c-lwBmzZTygQ',
              value: data.errorMessage,
            },
            {
              column: 'c-VDC0p1PqPD',
              value: data.assetLink,
            },
            {
              // Required
              column: 'c-H9Htj3gltU',
              value: data.profile || '',
            },
            {
              column: 'c-FDZZ28pXyV',
              value: data.accountName,
            },
            {
              column: 'c-C0jXQ9rcOi',
              value: data.stage,
            },
            {
              column: 'c-59vCedlGnU',
              value: data.publishId || '',
            },
            {
              column: 'c-5wz6rGbRKw',
              value: data.time,
            },
            {
              column: 'c-8I1lFmtbtC',
              value: data.logLink,
            },
            {
              column: 'c-cx8uV6IHza',
              value: data.provider || 'Qencode',
            },
            {
              column: 'c-TImS84vw6c',
              value: 'Created',
            },
          ],
        },
      ],
      // Create unique rows if assetId, accountId, profile, or error message are different
      // Date for these rows is required
      keyColumns: [
        'c-pYn6nDiLEy',
        'c-SA29xeRkzO',
        'c-H9Htj3gltU',
        'c-lwBmzZTygQ',
      ],
    },
  });
}

export default coda;
