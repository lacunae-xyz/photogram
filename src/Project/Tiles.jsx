import React from 'react';

import '../Templates/photogram-tile-large';
import '../Templates/photogram-tile-small';
import './Tiles.css';

const tileElements = {
  small: 'photogram-tile-small',
  large: 'photogram-tile-large',
};

export function tileProps(shot) {
  return {
    sequence: shot.sequence,
    action: shot.action,
    period: shot.periode,
    fx: shot.fx,
    url: shot.url,
    color: shot.color,
    colorDistribution: shot.colorDistribution,
  };
}

export default function Tiles(props) {
  const Tile = tileElements[props.type];
  if (props.value) {
    const images = props.value.map(image => {
      let i;
      if (image.label) {
        i = Object.assign(image, {
          color: props.colors[image.label],
          colorDistribution: props.colorDistribution,
        });
      } else {
        i = Object.assign(image, {
          color: props.defaultColor,
          colorDistribution: props.colorDistribution,
        });
      }
      return Tile ? (
        <Tile
          key={image.id}
          {...tileProps(i)}
          onClick={() => props.onTile(Object.assign({}, i))}
        />
      ) : null;
    });
    return (
      // key is set as fontFamily to update all tiles if font changes.
      <div
        key={props.fontFamily}
        className={
          props.printSpaceAround
            ? 'tiles-container print-space-around'
            : 'tiles-container print-no-space'
        }
        style={{ fontFamily: props.fontFamily }}
      >
        {images}
      </div>
    );
  } else {
    return null;
  }
}
