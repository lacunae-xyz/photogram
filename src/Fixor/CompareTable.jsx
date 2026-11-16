import React, { useState } from 'react';
import { formatDuration } from './parser';
import './CompareTable.css';

function EmptyTable() {
  return <p>No Data</p>;
}

function DataCompareTable(props) {
  return (
    <table className="edl-compare-table" id="fixor-table">
      <thead>
        <tr>
          <th>status</th>
          <th>id</th>
          <th>image</th>
          <th>description</th>
          <th>duration</th>
          <th>name</th>
          <th>source</th>
        </tr>
      </thead>
      <tbody>
        {props.data.map(diffLine => {
          let line;
          if (diffLine.lineB !== undefined) {
            line = diffLine.lineB;
          } else {
            line = diffLine.lineA;
          }
          if (diffLine.type === 'modify') {
            return (
              <HistoryLine
                key={diffLine.type + line.key}
                diffLine={diffLine}
                imagePerSeconde={props.imagePerSeconde}
                source={props.source}
              />
            );
          } else {
            return (
              <OneLine
                key={diffLine.type + line.key}
                diffLine={diffLine}
                imagePerSeconde={props.imagePerSeconde}
                source={props.source}
              />
            );
          }
        })}
      </tbody>
    </table>
  );
}

function CompareTable(props) {
  if (props.data.length > 0) {
    return DataCompareTable(props);
  } else {
    return EmptyTable();
  }
}

function OneLine(props) {
  let line;
  if (props.diffLine.lineB !== undefined) {
    line = props.diffLine.lineB;
  } else {
    line = props.diffLine.lineA;
  }

  return (
    <tr>
      <td title={props.diffLine.changes}>{props.diffLine.type}</td>
      <td>{line.id}</td>
      <td>
        <img alt="vfx" src={line.image} />
      </td>
      <td>{line.description}</td>
      <td>{formatDuration(line.sourceDuration(props.imagePerSeconde))}</td>
      <td>{line.vfxName}</td>
      <td>{line[props.source]}</td>
    </tr>
  );
}

function HistoryLine(props) {
  const [history, setHistory] = useState(false);

  function onHistory() {
    setHistory(!history);
  }

  let lineA = props.diffLine.lineA;
  let lineB = props.diffLine.lineB;

  return (
    <tr className={history ? 'with-history' : 'without-history'}>
      <td title={props.diffLine.changes}>
        <button onClick={onHistory}>{props.diffLine.type}</button>
      </td>
      <td>
        <del>{lineA.id}</del>
        {lineB.id}
      </td>
      <td>
        <img alt="vfx" src={lineB.image} />
      </td>
      <td>
        <del>{lineA.description}</del>
        {lineB.description}
      </td>
      <td>
        <del>{formatDuration(lineA.sourceDuration(props.imagePerSeconde))}</del>
        {formatDuration(lineB.sourceDuration(props.imagePerSeconde))}
      </td>
      <td>
        <del>{lineA.vfxName}</del>
        {lineB.vfxName}
      </td>
      <td>
        <del>{lineA[props.source]}</del>
        {lineB[props.source]}
      </td>
    </tr>
  );
}

export default CompareTable;
