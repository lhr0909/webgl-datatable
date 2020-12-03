import { Container } from "pixi.js";

import Cell from "./Cell";
import RecycledRow from './RecycledRow';
import RecycledColumn from "./RecycledColumn";
import { rows, columns, cellWidth, cellHeight } from './consts';

export class Grid extends Container {
  constructor({ resizeSubject, handleSetupEnd }) {
    super();

    const headers = [];
    const cellData = [];

    for (let i = 0; i < columns; i++) {
      headers.push(`Header ${i + 1}`);
    }

    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < columns; j++) {
        row.push(`${(j + 1) * 100 + (i + 1)}`);
      }
      cellData.push(row);
    }

    // use local variables in loop for performance
    const cellContainer = new Container();
    const topHeaderContainer = new RecycledRow({
      resizeSubject,
      cellData: headers.slice(1),
      isHeader: true,
      initialX: cellWidth,
    });
    const leftHeaderContainer = new RecycledColumn({
      resizeSubject,
      cellData: cellData.map(row => row[0]),
      isHeader: false,
      initialY: cellHeight,
    });
    const topLeftHeaderContainer = new Container();
    const cells = [];

    cellContainer.interactiveChildren = false;
    topHeaderContainer.interactiveChildren = false;
    leftHeaderContainer.interactiveChildren = false;
    topLeftHeaderContainer.interactiveChildren = false;

    // create top left header component as pinned
    const topLeftCell = new Cell({
      isHeader: true,
      width: cellWidth,
      height: cellHeight,
      textAlign: 'center',
      isOdd: false,
    });
    topLeftCell.setText(headers[0]);
    topLeftHeaderContainer.addChild(topLeftCell);

    // Cells
    cellContainer.position.set(cellWidth, cellHeight);
    for(let i = 0; i < rows; i++) {
      const cellRow = [];
      for(let j = 0; j < columns; j++) {
        const cell = new Cell({
          width: cellWidth,
          height: cellHeight,
          isOdd: i % 2 === 0,
          textAlign: 'center',
        });
        cell.position.set(cellWidth * j, cellHeight * i);
        cellContainer.addChild(cell);
        cell.setText("" + Math.round(Math.random() * 1000));

        cellRow.push(cell);
      }
      cells.push(cellRow);
    }

    this.cellContainer = cellContainer;
    this.topHeaderContainer = topHeaderContainer;
    this.leftHeaderContainer = leftHeaderContainer;
    this.cells = cells;

    // layering at the right order
    this.addChild(cellContainer);
    this.addChild(topHeaderContainer);
    this.addChild(leftHeaderContainer);
    this.addChild(topLeftHeaderContainer);

    handleSetupEnd();
  }

  update(scrollLeft, scrollTop) {
    this.cellContainer.position.set(cellWidth - scrollLeft, cellHeight - scrollTop);
    this.topHeaderContainer.pushScrollLeft(scrollLeft);
    this.leftHeaderContainer.pushScrollTop(scrollTop);
  }

  getCell(posX, posY) {
    const clickedColumn = Math.floor(posX / cellWidth);
    const clickedRow = Math.floor(posY / cellHeight);

    // console.log(posX, posY);

    // We found a cell
    if(this.cells[clickedRow] && this.cells[clickedRow][clickedColumn]) {
      return this.cells[clickedRow][clickedColumn];
    }
  }
}
