import { Container } from 'pixi.js';
import { ReplaySubject, combineLatest } from 'rxjs';
import * as Ops from 'rxjs/operators';

import CircularArray from './CircularArray';
import Cell from './Cell';
import { cellWidth, cellHeight } from './consts';

export default class RecycledColumn extends Container {
  constructor({ resizeSubject, cellData, isHeader, initialY }) {
    super();
    console.log("initializing recycled column");
    this.y = initialY;
    this.initialY = initialY;

    const scrollSubject = new ReplaySubject(1);
    scrollSubject.next(0);

    this.resizeSubject = resizeSubject;
    this.scrollSubject = scrollSubject;
    this.cells = new CircularArray([]);
    this.cellData = cellData;

    this._setUpIntialCells(isHeader);
    this._subscribeUpdates(scrollSubject, resizeSubject);
  }

  pushScrollTop(scrollTop) {
    this.scrollSubject.next(scrollTop);
  }

  _setUpIntialCells(isHeader) {
    this.resizeSubject.pipe(
      Ops.take(1),
    ).subscribe(({ height: viewportHeight }) => {
      console.log('determining initial recycled column cell count');
      const columnCellCount = Math.ceil(viewportHeight * 1.5 / cellHeight);
      console.log('column cell count:', columnCellCount);

      for(let i = 0; i < Math.min(columnCellCount, this.cellData.length); i++) {
        const cell = new Cell({
          isHeader,
          width: cellWidth,
          height: cellHeight,
          textAlign: 'center',
          isOdd: i % 2 === 0,
        });
        cell.position.set(0, cellHeight * i);
        this.addChild(cell);
        cell.setText(this.cellData[i]);
        this.cells.array.push(cell);
      }

      // set the mapping to be the same
      this.cells.updateIndices(0, this.cells.size - 1);
    });
  }

  _subscribeUpdates(scrollSubject, resizeSubject) {
    combineLatest([
      scrollSubject,
      // resizeSubject,
      resizeSubject.pipe(
        Ops.debounceTime(100),
      ),
    ]).pipe(
      Ops.tap(([scrollTop]) => {
        // update container position
        this.y = this.initialY - scrollTop;
      }),
      Ops.throttleTime(10),
      Ops.map(([scrollTop, { height: viewportHeight }]) => {
        const currentIndexStart = Math.floor(scrollTop / cellHeight);
        const currentIndexEnd = currentIndexStart + Math.floor(viewportHeight / cellHeight) - 1;
        return {
          viewportHeight,
          scrollTop,
          currentIndexStart,
          currentIndexEnd,
        };
      }),
      Ops.distinctUntilKeyChanged('currentIndexEnd'),
      Ops.skip(1),
      Ops.tap(({ viewportHeight, scrollTop, currentIndexStart, currentIndexEnd }) => {
        const margin = Math.ceil(viewportHeight * 0.3 / cellHeight);
        let currentHead = this.cells.head;
        let currentTail = this.cells.tail;

        while (scrollTop - currentHead.position.y > margin * cellHeight) {
          // peek previous head cell
          const prevHead = this.cells.peekHeadPrev();
          // move head cell
          const newY = prevHead.position.y + cellHeight;
          this.cells.head.position.set(0, newY);
          // use x coords to figure out the cell data
          this.cells.head.setText(this.cellData[Math.floor(newY / cellHeight)]);
          this.cells.head.setOdd(!prevHead.isOdd);
          // move head and tail pointer to next cell
          currentHead = this.cells.headNext;
          currentTail = this.cells.tailNext;
        }

        while (currentTail.position.y - viewportHeight - scrollTop > margin * cellHeight) {
          // peek next tail cell
          const nextTail = this.cells.peekTailNext();
          // move tail cell
          const newY = nextTail.position.y - cellHeight;
          this.cells.tail.position.set(0, newY);
          // use x coords to figure out the cell data
          this.cells.tail.setText(this.cellData[Math.floor(newY / cellHeight)]);
          this.cells.tail.setOdd(!nextTail.isOdd);
          // move head and tail pointer to prev cell
          currentHead = this.cells.headPrev;
          currentTail = this.cells.tailPrev;
        }
      }),
    ).subscribe();
  }
}