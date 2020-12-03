import { Container, Sprite, BitmapText, Texture } from "pixi.js";

export default class Cell extends Container {
  constructor({isHeader, isOdd, value, width, height, textAlign}) {
    super();

    this.editable = !isHeader;
    this.cellWidth = width;
    this.cellHeight = height;
    this.textAlign = textAlign;

    const border = new Sprite(Texture.WHITE);
    border.width = width;
    border.height = height;
    this.addChild(border);

    const bg = new Sprite(Texture.WHITE);
    bg.width = width - 2;
    bg.height = height - 2;
    bg.position.set(1, 1);
    bg.y = 1;

    if(isOdd) {
      bg.tint = 0xf1f1f1;
    } else {
      bg.tint = 0xfafafa;
    }

    this.addChild(bg);
    this.isOdd = isOdd;
    this.bg = bg;

    if(value) {
      this.setText(value);
    }
  }

  getValue() {
    return this.value;
  }

  setText(value) {
    this.value = value;

    if(!this.textField) {
      this.textField = new BitmapText(value, { font: '13px Arial', align: 'center' });
      this.addChild(this.textField);
    } else {
      this.textField.text = value;
    }

    if(this.textAlign === "center") {
      this.textField.position.x = this.cellWidth / 2 - this.textField.width / 2;
    }

    // FIXME fix line-height in Bitmap Text generator
    this.textField.position.y = this.cellHeight / 2 - this.textField.height / 2 - 2;
  }

  setOdd(isOdd) {
    if(isOdd) {
      this.bg.tint = 0xf1f1f1;
    } else {
      this.bg.tint = 0xfafafa;
    }
    this.isOdd = isOdd;
  }
}
