import isTusSourceUrl from './isTusSourceUrl';

describe('isTusSourceUrl', () => {
  it('should return true for uploads CDN host (prod-style)', () => {
    expect(
      isTusSourceUrl(
        'https://uploads-abc123.sardius.media/file/account/asset/x.mp4',
      ),
    ).toBe(true);
  });

  it('should return true for uploads CDN host (alpha)', () => {
    expect(
      isTusSourceUrl(
        'https://uploads-abc123.alpha.sardius.media/path/to/source.mp4',
      ),
    ).toBe(true);
  });

  it('should return false for legacy files.api TUS hosts', () => {
    expect(
      isTusSourceUrl(
        'https://files.api.sardius.media/file/account/asset/x.mp4',
      ),
    ).toBe(false);
    expect(
      isTusSourceUrl(
        'https://files-alpha.api.sardius.media/file/account/asset/x.mp4',
      ),
    ).toBe(false);
  });

  it('should return false when host does not match uploads pattern', () => {
    expect(isTusSourceUrl('https://other.api.sardius.media/file/x.mp4')).toBe(
      false,
    );
    expect(isTusSourceUrl('https://storage.alpha.sardius.media/a/b.mp4')).toBe(
      false,
    );
    expect(isTusSourceUrl('https://example.com/file.mp4')).toBe(false);
  });

  it('should return false for invalid URL', () => {
    expect(isTusSourceUrl('not-a-url')).toBe(false);
  });
});
