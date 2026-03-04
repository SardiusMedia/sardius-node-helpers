/**
 * Returns the Cloudflare Files (TUS) host for the given stage.
 * prod -> files.api.sardius.media; alpha/stage -> files-{stage}.api.sardius.media
 */
export default function getTusHostForStage(stage: string): string {
  return stage === 'alpha' || stage === 'stage'
    ? `files-${stage}.api.sardius.media`
    : 'files.api.sardius.media';
}
