import compare from "./compare"
import parser from "./parser"

let baseline = line("id", "number", "description", "vfxName", "fileName", "sourceIn", "sourceOut", "recordIn", "recordOut")

function line(id, number, description, vfxName, fileName, sourceIn, sourceOut, recordIn, recordOut){
  return {
  id: "id",
  number: "number",
  key: function(){
    return `${this.number}_${this.id}`;
  },
  description: "description",
  vfxName: "vfxName",
  fileName: "fileName",
  sourceIn: 1,
  sourceOut: 2,
  recordIn: 3,
  recordOut: 4,
  sourceDuration: function(imagePerSeconde) {
    return dateDuration(this.sourceIn, this.sourceOut, imagePerSeconde);
  },
  recordDuration: function(imagePerSeconde) {
    return dateDuration(this.recordIn, this.recordOut, imagePerSeconde);
  }
}
}

it('compare same edl', () => {
  let result = compare([baseline], [baseline]);
  expect(result[0]).toStrictEqual({
    id:"id",
    type:"identity",
    changes: [],
    lineA: baseline,
    lineB: baseline
  }) 
});

it('compare same edl with modification', () => {
  let lineB = Object.assign({}, baseline, {
    description: "another description",
    vfxName: "another vfxName"
  })
  let result = compare([baseline], [lineB]);
  expect(result[0]).toStrictEqual({
    id:"id",
    type:"modify",
    changes: ["description", "vfxName"],
    lineA: baseline,
    lineB: lineB
  }) 
});

it('compare empty edl with one line edl should find one addition', () => {
  let result = compare([], [baseline]);
  expect(result[0]).toStrictEqual({
    id:"id",
    type:"add",
    changes: [],
    lineA: undefined,
    lineB: baseline
  }) 
});

it('compare one line edl with empty edl should find one removed', () => {
  let result = compare([baseline], []);
  expect(result[0]).toStrictEqual({
    id:"id",
    type:"remove",
    changes: [],
    lineA: baseline,
    lineB: undefined
  }) 
});


it('compare both empty edl', () => {
  expect(compare([], [])).toStrictEqual([]);
});

it('compare reordered events finds no change', () => {
  let a = Object.assign({}, baseline, { id: "a" })
  let b = Object.assign({}, baseline, { id: "b", number: "002" })
  let result = compare([a, b], [b, a]);
  expect(result.map(diff => [diff.id, diff.type])).toStrictEqual([["a", "identity"], ["b", "identity"]]);
});

it('compare with several changes', () => {
  let a = Object.assign({}, baseline, { id: "a" })
  let b = Object.assign({}, baseline, { id: "b" })
  let c = Object.assign({}, baseline, { id: "c" })
  let d = Object.assign({}, baseline, { id: "d" })
  let a2 = Object.assign({}, a, { number: "other", sourceOut: 5 })
  let result = compare([a, b, c], [d, a2, b]);
  expect(result.map(diff => [diff.id, diff.type, diff.changes])).toStrictEqual([
    ["a", "modify", ["number", "sourceOut"]],
    ["b", "identity", []],
    ["c", "remove", []],
    ["d", "add", []],
  ]);
});

// Timecodes are objects, so toString() gives "[object Object]" on both sides and a changed timecode is missed.
it('compare misses a changed timecode', () => {
  const edl = (sourceOut) => parser(`000001  A003C003_190318BQ                V     C        16:51:25:10 ${sourceOut} 01:00:00:00 01:00:02:15
* FROM CLIP NAME:  210/01-03* CAMA
* LOC: 01:00:01:00 CYAN    208_050 // SPLIT SCREEN
* SOURCE FILE: A003C003_190318BQ`)
  let result = compare(edl("16:51:28:00"), edl("16:51:29:00"));
  expect(result.map(diff => [diff.type, diff.changes])).toStrictEqual([["identity", []]]);
});
