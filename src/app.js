import { Application, Loader } from 'pixi.js';
import { ReplaySubject } from 'rxjs';

import { columns, rows, cellWidth, cellHeight } from './consts';
import { Grid } from "./Grid";

/**
 * Profiling
 */
const handleSetupEnd = () => {
  const endTime = new Date();
  console.log("Loaded in " + (endTime - window.startTime) / 1000 + " seconds");
  document.querySelector('.loader').innerHTML = "";
};

/**
 * Initialize PIXI application
 */
const app = new Application({
  autoResize: true,
  resolution: devicePixelRatio
});
app.renderer.backgroundColor = 0xffffff;
document.querySelector(".canvas-container").appendChild(app.view);

const resizeSubject = new ReplaySubject(1);

const resize = () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  resizeSubject.next({ width: window.innerWidth, height: window.innerHeight });
};

window.addEventListener('resize', resize);
resize();

const onAssetsLoaded = () => {
  /**
   * Initialize grid
   */
  const grid = new Grid({ resizeSubject, handleSetupEnd });
  app.stage.addChild(grid);

  /**
   * Handle scroll
   */
  const scrollContainer = document.querySelector(".scroll-container");
  const scrollWrapper = document.querySelector(".scroll-wrapper");
  // scrollWrapper.style.left = cellWidth + "px";
  scrollWrapper.style.top = cellHeight + "px";
  scrollContainer.style.width = columns * cellWidth + "px";
  scrollContainer.style.height = rows * cellHeight + "px";

  scrollWrapper.addEventListener('scroll', (e) => {
    grid.update(e.target.scrollLeft, e.target.scrollTop);
  });


  /**
   * Handle double click
   */
  const cellInput = document.querySelector(".cell-input");
  cellInput.style.height = cellHeight + "px";
  cellInput.style.width = cellWidth + "px";
  let clickedCell = null;

  scrollContainer.addEventListener('dblclick', (e) => {
    const rect = e.target.getBoundingClientRect(),
        offsetX = e.clientX - rect.left,
        offsetY = e.clientY - rect.top;

    const cell = grid.getCell(offsetX, offsetY);

    if (!cell || !cell.editable) {
      return;
    }

    clickedCell = cell;

    cellInput.value = clickedCell.getValue();
    cellInput.style.left = clickedCell.x + "px";
    cellInput.style.top = clickedCell.y + "px";
    cellInput.style.display = "block";


    cellInput.focus();
    cellInput.select();
  });

  cellInput.addEventListener("keypress", (e) => {
    if (!clickedCell) {
      return;
    }

    clickedCell.setText(e.target.value);

    if (e.keyCode === 13) { // on Enter
      e.target.style.display = "none";
      clickedCell = null;
    }
  });

  cellInput.addEventListener("blur", (e) => {
    if (!clickedCell) {
      return;
    }

    e.target.style.display = "none";
    clickedCell = null;
  });
};

Loader.shared
    .add('arial', 'assets/arial/arial.fnt')
    .load(onAssetsLoaded);
