import getStage from './getStage';
import getTusHostForStage from './getTusHostForStage';
import isTusSourceUrl from './isTusSourceUrl';

jest.mock('./getStage');
jest.mock('./getTusHostForStage');

const mockGetStage = getStage as jest.Mock;
const mockGetTusHostForStage = getTusHostForStage as jest.Mock;

describe('isTusSourceUrl', () => {
  beforeEach(() => {
    mockGetStage.mockReturnValue('prod');
    mockGetTusHostForStage.mockImplementation((stage: string) =>
      stage === 'alpha' || stage === 'stage'
        ? `files-${stage}.api.sardius.media`
        : 'files.api.sardius.media',
    );
  });

  it('should return true when URL host matches TUS host for current stage', () => {
    expect(
      isTusSourceUrl(
        'https://files.api.sardius.media/file/account/asset/x.mp4',
      ),
    ).toBe(true);
  });

  it('should return false when URL host does not match TUS host', () => {
    expect(isTusSourceUrl('https://other.api.sardius.media/file/x.mp4')).toBe(
      false,
    );
    expect(isTusSourceUrl('https://example.com/file.mp4')).toBe(false);
  });

  it('should return true for alpha stage TUS URL when stage is alpha', () => {
    mockGetStage.mockReturnValue('alpha');
    mockGetTusHostForStage.mockReturnValue('files-alpha.api.sardius.media');
    expect(
      isTusSourceUrl(
        'https://files-alpha.api.sardius.media/file/account/asset/x.mp4',
      ),
    ).toBe(true);
  });

  it('should return false when getStage throws', () => {
    mockGetStage.mockImplementation(() => {
      throw new Error('Missing cfstack');
    });
    expect(isTusSourceUrl('https://files.api.sardius.media/file/x.mp4')).toBe(
      false,
    );
  });

  it('should return false for invalid URL', () => {
    expect(isTusSourceUrl('not-a-url')).toBe(false);
  });
});
