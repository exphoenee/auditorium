/* these little object literals containting the properties of a sector  */

import { boxMap, sideBalconyMap, midBalconyMap, centralAuditoriumMap } from '../sectorMap/sectorMaps.js';

const boxLeft1 = {
  rows: boxMap, // the rows, are the map of the sector, every row is an array what contains the price category of the seat
  name: "Box left 1.", //name of the sector
  mirrored: false, //it is mirrored or not
  vert: 25, //the vertical position of the sector on the screen given in percentage
  hor: 15, //the horizontal position of the sector on the screen given in percentage
  angle: 90, //the angle of the sector on the screen given in degree
  sectorPreference: 4, //the preference value of a sector to calculate to position value in a seat neibourghood
};
const boxLeft2 = {
  rows: boxMap,
  name: "Box left 2.",
  mirrored: false,
  vert: 40,
  hor: 15,
  angle: 90,
  sectorPreference: 4,
};
const boxLeft3 = {
  rows: boxMap,
  name: "Box left 3.",
  mirrored: false,
  vert: 55,
  hor: 15,
  angle: 90,
  sectorPreference: 4,
};
const sideBalconyLeft = {
  rows: sideBalconyMap,
  name: "Balcony left",
  mirrored: true,
  vert: 75,
  hor: 20,
  angle: 45,
  offset: 1,
  sectorPreference: 3,
};
const boxRight1 = {
  rows: boxMap,
  name: "Box right 1.",
  mirrored: true,
  vert: 25,
  hor: 85,
  angle: -90,
  sectorPreference: 4,
};
const boxRight2 = {
  rows: boxMap,
  name: "Box right 2.",
  mirrored: true,
  vert: 40,
  hor: 85,
  angle: -90,
  sectorPreference: 4,
};
const boxRight3 = {
  rows: boxMap,
  name: "Box right 3.",
  mirrored: true,
  vert: 55,
  hor: 85,
  angle: -90,
  sectorPreference: 4,
};
const sideBalconyRight = {
  rows: sideBalconyMap,
  name: "Balcony right",
  mirrored: false,
  vert: 75,
  hor: 80,
  angle: -45,
  offset: 1,
  sectorPreference: 3,
};
const midBalcony = {
  rows: midBalconyMap,
  name: "Balcony mid.",
  mirrored: false,
  vert: 80,
  hor: 50,
  sectorPreference: 2,
};
const centralAuditorium = {
  rows: centralAuditoriumMap,
  name: "Auditorium",
  mirrored: false,
  vert: 45,
  hor: 50,
  sectorPreference: 1,
};

export {
  boxLeft1, boxLeft2, boxLeft3,
  boxRight1, boxRight2, boxRight3,
  sideBalconyLeft, sideBalconyRight,
  midBalcony, centralAuditorium,
};
