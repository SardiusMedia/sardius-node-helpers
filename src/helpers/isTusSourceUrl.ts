import getStage from './getStage';
import getTusHostForStage from './getTusHostForStage';

/**
 * Returns true if the given URL's host is the TUS (Cloudflare Files) host for the current stage.
 */
export default function isTusSourceUrl(url: string): boolean {
  try {
    const stage = getStage();
    const tusHost = getTusHostForStage(stage);
    return new URL(url).host === tusHost;
  } catch {
    return false;
  }
}
