import { UniqueNameFilterPipe } from './unique-name-filter.pipe';

describe('PointsFilterPipe', () => {
  it('create an instance', () => {
    const pipe = new UniqueNameFilterPipe();
    expect(pipe).toBeTruthy();
  });
});
