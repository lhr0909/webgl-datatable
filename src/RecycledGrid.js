import { Container } from 'pixi.js';
import { combineLatest } from 'rxjs';
import * as Ops from 'rxjs/operators';

import CircularArray from './CircularArray';
import { cellWidth, cellHeight, throttleTimeout } from './consts';
import RecycledRow from './RecycledRow';

export default class RecycledGrid extends Container {
  constructor({ xCoordsCalc, yCoordsCalc, cellData, initialX, initialY }) {
    super();
    console.log("initializing recycled grid");

    this.x = initialX;
    this.initialX = initialX;
    this.y = initialY;
    this.initialY = initialY;

    this.xCoordsCalc = xCoordsCalc;
    this.yCoordsCalc = yCoordsCalc;
    this.rows = new CircularArray([]);
    this.cellData = cellData;

    this._setUpIntialCells();
    this._subscribeUpdates();
  }

  _setUpIntialCells() {
    this.resizeSubject.pipe(
      Ops.take(1),
    ).subscribe(({ width: viewportWidth, height: viewportHeight }) => {
      console.log('determining initial recycled grid cell count');
      const rowCellCount = Math.ceil(viewportHeight * 1.5 / cellHeight);
      const columnCellCount = Math.ceil(viewportWidth * 1.5 / cellWidth);
      console.log('row cell count:', rowCellCount, 'column cell count:', columnCellCount, 'total:', rowCellCount * columnCellCount);

      for (let row = 0; row < Math.min(rowCellCount, this.cellData.length); row++) {
        const recycledRow = new RecycledRow({
          isOdd: row % 2 === 0,
          isHeader: false,
          resizeSubject: this.resizeSubject,
          scrollSubject: this.scrollSubject,
          initialX: 0,
          cellData: this.cellData[row].slice(), // shallow clone
        });

        recycledRow.position.set(0, cellHeight * row);

        this.addChild(recycledRow);
        this.rows.array.push(recycledRow);
      }

      this.rows.updateIndices(0, this.rows.size - 1);
    });
  }

  _subscribeUpdates() {
    combineLatest([
      this.scrollSubject,
      // resizeSubject,
      this.resizeSubject,
    ]).pipe(
      Ops.tap(([{ scrollLeft, scrollTop }]) => {
        // update container position
        this.y = this.initialY - scrollTop;
      }),
      Ops.throttleTime(throttleTimeout),
      Ops.map(([{ scrollLeft, scrollTop }, { width: viewportWidth, height: viewportHeight }]) => {
        const xIndexStart = Math.floor(scrollLeft / cellWidth);
        const xIndexEnd = xIndexStart + Math.floor(viewportWidth / cellWidth) - 1;
        const yIndexStart = Math.floor(scrollTop / cellHeight);
        const yIndexEnd = yIndexStart + Math.floor(viewportHeight / cellHeight) - 1;
        return {
          viewportWidth,
          viewportHeight,
          scrollLeft,
          scrollTop,
          xIndexStart,
          xIndexEnd,
          yIndexStart,
          yIndexEnd,
          checksum: xIndexEnd + yIndexEnd,
        };
      }),
      Ops.distinctUntilKeyChanged('checksum'),
      Ops.skip(1),
      Ops.tap(({
        viewportWidth,
        viewportHeight,
        scrollLeft,
        scrollTop,
      }) => {
        // const xMargin = Math.ceil(viewportWidth * 0.3 / cellWidth);
        // const yMargin = Math.ceil(viewportHeight * 0.3 / cellHeight);

        // let currentHeadRow = this.rows.head;
        // let currentTailRow = this.rows.tail;

        // while (scrollLeft - currentHead.position.x > margin * cellWidth) {
        //   // peek previous head cell
        //   const prevHead = this.cells.peekHeadPrev();
        //   // move head cell
        //   const newX = prevHead.position.x + cellWidth;
        //   this.cells.head.position.set(newX, 0);
        //   // use x coords to figure out the cell data
        //   this.cells.head.setText(this.cellData[Math.floor(newX / cellWidth)]);
        //   // move head and tail pointer to next cell
        //   currentHead = this.cells.headNext;
        //   currentTail = this.cells.tailNext;
        // }

        // while (currentTail.position.x - viewportWidth - scrollLeft > margin * cellWidth) {
        //   // peek next tail cell
        //   const nextTail = this.cells.peekTailNext();
        //   // move tail cell
        //   const newX = nextTail.position.x - cellWidth;
        //   this.cells.tail.position.set(newX, 0);
        //   // use x coords to figure out the cell data
        //   this.cells.tail.setText(this.cellData[Math.floor(newX / cellWidth)]);
        //   // move head and tail pointer to prev cell
        //   currentHead = this.cells.headPrev;
        //   currentTail = this.cells.tailPrev;
        // }
      }),
    ).subscribe();
  }
}