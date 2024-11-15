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
declare function coda(
  data: TranscodeRow,
  token: string,
  codaTable?: string,
): Promise<void>;
export default coda;
