import backgroundColor from './background';

describe('backgroundColor', () => {
  test('card uses the label colour', () => {
    expect(backgroundColor('card', '#F44336')).toEqual('#F44336');
  });

  test('card without colour', () => {
    expect(backgroundColor('card', undefined)).toEqual(undefined);
  });

  test('indicator has no background', () => {
    expect(backgroundColor('indicator', '#F44336')).toEqual(null);
  });

  test('undefined distribution has no background', () => {
    expect(backgroundColor(undefined, '#F44336')).toEqual(null);
  });
});
