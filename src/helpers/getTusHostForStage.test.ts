import getTusHostForStage from './getTusHostForStage';

describe('getTusHostForStage', () => {
  it('should return files.api.sardius.media for prod', () => {
    expect(getTusHostForStage('prod')).toBe('files.api.sardius.media');
  });

  it('should return files-alpha.api.sardius.media for alpha', () => {
    expect(getTusHostForStage('alpha')).toBe('files-alpha.api.sardius.media');
  });

  it('should return files-stage.api.sardius.media for stage', () => {
    expect(getTusHostForStage('stage')).toBe('files-stage.api.sardius.media');
  });

  it('should return files.api.sardius.media for unknown stage', () => {
    expect(getTusHostForStage('other')).toBe('files.api.sardius.media');
  });
});
