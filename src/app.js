import { Auditorium } from './components/Auditorium/Auditorium.js';
import {
  centralAuditorium,
  midBalcony,
  sideBalconyLeft,
  sideBalconyRight,
  boxLeft1,
  boxLeft2,
  boxLeft3,
  boxRight1,
  boxRight2,
  boxRight3,
} from './model/sectorConfigs/sectorConfigs.js';

const auditorium = new Auditorium([
  centralAuditorium,
  midBalcony,
  sideBalconyLeft,
  sideBalconyRight,
  boxLeft1,
  boxLeft2,
  boxLeft3,
  boxRight1,
  boxRight2,
  boxRight3,
]);

auditorium.render("app");
auditorium.randomReservation(0.2);
auditorium.reserve(4);
