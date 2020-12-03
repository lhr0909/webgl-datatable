export default class CircularArray {
  constructor(array) {
    this.array = array;
    this.headIndex = 0;
    this.tailIndex = array.length - 1;
  }

  updateIndices(headIndex, tailIndex) {
    this.headIndex = headIndex;
    this.tailIndex = tailIndex;
  }

  get(idx) {
    return this.array[idx];
  }

  get size() {
    return this.array.length;
  }

  get head() {
    return this.get(this.headIndex);
  }

  get headNext() {
    this.headIndex = (this.headIndex + 1) % this.array.length;
    return this.head;
  }

  get headPrev() {
    this.headIndex = ((this.headIndex === 0) ? (this.array.length - 1) : this.headIndex - 1) % this.array.length;
    return this.head;
  }

  peekHeadNext() {
    const idx = (this.headIndex + 1) % this.array.length;
    return this.get(idx);
  }

  peekHeadPrev() {
    const idx = ((this.headIndex === 0) ? (this.array.length - 1) : this.headIndex - 1) % this.array.length;
    return this.get(idx);
  }

  get tail() {
    return this.get(this.tailIndex);
  }

  get tailNext() {
    this.tailIndex = (this.tailIndex + 1) % this.array.length;
    return this.tail;
  }

  get tailPrev() {
    this.tailIndex = ((this.tailIndex === 0) ? (this.array.length - 1) : this.tailIndex - 1) % this.array.length;
    return this.tail;
  }

  peekTailNext() {
    const idx = (this.tailIndex + 1) % this.array.length;
    return this.get(idx);
  }

  peekTailPrev() {
    const idx = ((this.tailIndex === 0) ? (this.array.length - 1) : this.tailIndex - 1) % this.array.length;
    return this.get(idx);
  }
}
