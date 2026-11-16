interface RandomValues {
  getRandomValues(array: Uint8Array<ArrayBuffer>): ArrayLike<number>;
}

export default class Uuidv4 {
  _crypto: RandomValues;

  constructor(crypto: RandomValues) {
    this._crypto = crypto;
  }

  static create() {
    return new Uuidv4(crypto);
  }

  static createNull() {
    return new Uuidv4(new SubbedCrypto());
  }

  generate(): string {
    return (String([1e7]) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (
        ((Number(c) ^ this._crypto.getRandomValues(new Uint8Array(1))[0]) &
          15) >>
        (Number(c) / 4)
      ).toString(16),
    );
  }
}

class SubbedCrypto implements RandomValues {
  getRandomValues() {
    return [0];
  }
}
