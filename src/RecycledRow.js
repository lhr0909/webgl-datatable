import { Container } from 'pixi.js';
import { ReplaySubject, combineLatest } from 'rxjs';
import * as Ops from 'rxjs/operators';

import CircularArray from './CircularArray';
import Cell from './Cell';
import { cellWidth, cellHeight } from './consts';

export default class RecycledRow extends Container {
  constructor({ resizeSubject, cellData, isHeader, initialX }) {
    super();
    console.log("initializing recycled row");
    this.x = initialX;
    this.initialX = initialX;

    const scrollSubject = new ReplaySubject(1);
    scrollSubject.next(0);

    this.resizeSubject = resizeSubject;
    this.scrollSubject = scrollSubject;
    this.cells = new CircularArray([]);
    this.cellData = cellData;

    this._setUpIntialCells(isHeader);
    this._subscribeUpdates(scrollSubject, resizeSubject);
  }

  pushScrollLeft(scrollLeft) {
    this.scrollSubject.next(scrollLeft);
  }

  _setUpIntialCells(isHeader) {
    this.resizeSubject.pipe(
      Ops.take(1),
    ).subscribe(({ width: viewportWidth }) => {
      console.log('determining initial recycled row cell count');
      const rowCellCount = Math.ceil(viewportWidth * 1.5 / cellWidth);
      console.log('row cell count:', rowCellCount);

      for(let i = 0; i < Math.min(rowCellCount, this.cellData.length); i++) {
        const cell = new Cell({
          isHeader,
          width: cellWidth,
          height: cellHeight,
          textAlign: 'center',
        });
        cell.position.set(cellWidth * i, 0);
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
      Ops.tap(([scrollLeft]) => {
        // update container position
        this.x = this.initialX - scrollLeft;
      }),
      Ops.throttleTime(10),
      Ops.map(([scrollLeft, { width: viewportWidth }]) => {
        const currentIndexStart = Math.floor(scrollLeft / cellWidth);
        const currentIndexEnd = currentIndexStart + Math.floor(viewportWidth / cellWidth) - 1;
        return {
          viewportWidth,
          scrollLeft,
          currentIndexStart,
          currentIndexEnd,
        };
      }),
      Ops.distinctUntilKeyChanged('currentIndexEnd'),
      Ops.skip(1),
      Ops.tap(({ viewportWidth, scrollLeft, currentIndexStart, currentIndexEnd }) => {
        // console.log('changed', viewportWidth, scrollLeft, currentIndexStart, currentIndexEnd);

        const margin = Math.ceil(viewportWidth * 0.3 / cellWidth);
        let currentHead = this.cells.head;
        let currentTail = this.cells.tail;

        while (scrollLeft - currentHead.position.x > margin * cellWidth) {
          // peek previous head cell
          const prevHead = this.cells.peekHeadPrev();
          // move head cell
          const newX = prevHead.position.x + cellWidth;
          this.cells.head.position.set(newX, 0);
          // use x coords to figure out the cell data
          this.cells.head.setText(this.cellData[Math.floor(newX / cellWidth)]);
          // move head and tail pointer to next cell
          currentHead = this.cells.headNext;
          currentTail = this.cells.tailNext;
        }

        while (currentTail.position.x - viewportWidth - scrollLeft > margin * cellWidth) {
          // peek next tail cell
          const nextTail = this.cells.peekTailNext();
          // move tail cell
          const newX = nextTail.position.x - cellWidth;
          this.cells.tail.position.set(newX, 0);
          // use x coords to figure out the cell data
          this.cells.tail.setText(this.cellData[Math.floor(newX / cellWidth)]);
          // move head and tail pointer to prev cell
          currentHead = this.cells.headPrev;
          currentTail = this.cells.tailPrev;
        }
      }),
    ).subscribe();
  }
}