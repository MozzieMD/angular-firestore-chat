import { isImage } from './functions';

describe('Functions', () => {
  it('should create an instance', async () => {
    expect(await isImage('')).toBeFalse();
  });
});
