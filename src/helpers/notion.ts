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
    | 'Fixed'
    | 'Not Fixed'
    | 'Flag'
    | 'In Progress Support'
    | 'In Progress Dev';
}

/**
 * Writes a transcode error row to a Notion database
 * @param data - The transcode error data to write
 * @param token - Your Notion integration token (starts with "secret_")
 * @param databaseId - The Notion database ID (32 character string, can be found in the database URL)
 *
 * To set up:
 * 1. Create a Notion integration at https://www.notion.so/my-integrations
 * 2. Share your database with the integration
 * 3. Get the database ID from the URL: https://www.notion.so/{workspace}/{database_id}?v=...
 * 4. Ensure your database has the following properties (names must match exactly):
 *    - Asset ID (title)
 *    - Account ID (rich_text)
 *    - Error Message (rich_text)
 *    - Asset Link (url)
 *    - Profile (rich_text)
 *    - Account Name (rich_text)
 *    - Stage (rich_text)
 *    - Publish ID (rich_text)
 *    - Time (rich_text)
 *    - Log Link (url)
 *    - Provider (rich_text)
 *    - Status (select with options: Created, Elevated, fixed, not fixed, Flag, In Progress Support, In Progress Dev)
 */
async function notion(
  data: TranscodeRow,
  token: string,
  databaseId: string,
): Promise<void> {
  await axios({
    url: 'https://api.notion.com/v1/pages',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2025-09-03',
    },
    data: {
      parent: {
        database_id: databaseId,
      },
      // Make sure we have defaults for all properties so the log doesn't fail to send when missing properties
      properties: {
        // Title property (required for most databases)
        'Asset ID': {
          title: [
            {
              text: {
                content: data.assetId || 'unknown',
              },
            },
          ],
        },
        'Account ID': {
          rich_text: [
            {
              text: {
                content: data.accountId || 'unknown',
              },
            },
          ],
        },
        'Error Message': {
          rich_text: [
            {
              text: {
                content: data.errorMessage || 'unknown',
              },
            },
          ],
        },
        ...(data.assetLink && {
          'Asset Link': {
            url: data.assetLink || 'none',
          },
        }),
        Profile: {
          rich_text: [
            {
              text: {
                content: data.profile || 'unknown',
              },
            },
          ],
        },
        'Account Name': {
          rich_text: [
            {
              text: {
                content: data.accountName || 'unknown',
              },
            },
          ],
        },
        Stage: {
          rich_text: [
            {
              text: {
                content: data.stage || 'unknown',
              },
            },
          ],
        },
        'Publish ID': {
          rich_text: [
            {
              text: {
                content: data.publishId || '',
              },
            },
          ],
        },
        Time: {
          rich_text: [
            {
              text: {
                content: data.time || Date.now().toString(),
              },
            },
          ],
        },
        ...(data.logLink && {
          'Log Link': {
            url: data.logLink || 'none',
          },
        }),
        Provider: {
          rich_text: [
            {
              text: {
                content: data.provider || 'Qencode',
              },
            },
          ],
        },
        Status: {
          select: {
            name: data.defaultStatus || 'Created',
          },
        },
      },
    },
  });
}

export default notion;
