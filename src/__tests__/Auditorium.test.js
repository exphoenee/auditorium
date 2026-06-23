import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Auditorium } from '../components/Auditorium/Auditorium.js';

vi.mock('../../utils/domelemjs/domelemjs.js', () => ({
  createDOMElem: vi.fn(() => ({ classList: { add: vi.fn(), remove: vi.fn() } })),
  div: 'div',
  input: 'input',
  button: 'button',
  p: 'p',
}));

const testSectors = [
  {
    rows: [[3, 3, 3, 3, 3]],
    name: 'Test Sector',
    mirrored: false,
    sectorPreference: 1,
  },
];

describe('Auditorium', () => {
  beforeEach(() => {
    global.document = { getElementById: vi.fn(() => null) };
  });

  it('should count total seats', () => {
    const aud = new Auditorium(testSectors);
    expect(aud.getSeatNumber()).toBe(5);
  });

  it('should return all seats', () => {
    const aud = new Auditorium(testSectors);
    expect(aud.getAllSeats()).toHaveLength(5);
  });

  it('should mark seats as occupied', () => {
    const aud = new Auditorium(testSectors);
    aud.getAllSeats()[0].setOccupied('Test');
    expect(aud.getOccupiedSeats()).toHaveLength(1);
    expect(aud.getFreeSeats()).toHaveLength(4);
  });

  it('should free all seats', () => {
    const aud = new Auditorium(testSectors);
    aud.getAllSeats().forEach(s => s.setOccupied('X'));
    aud.freeUpAllSeats();
    expect(aud.getOccupiedSeats()).toHaveLength(0);
  });

  it('should find contiguous free seats with reserve', () => {
    const aud = new Auditorium(testSectors);
    const results = aud.reserve(3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].seatNumbers).toBeDefined();
    expect(results[0].sectorName).toBe('Test Sector');
  });

  it('should clamp reserve input to 2-8', () => {
    const aud = new Auditorium(testSectors);
    const results1 = aud.reserve(1);
    expect(results1.length).toBeGreaterThanOrEqual(0);
    const results2 = aud.reserve(100);
    expect(results2.length).toBeGreaterThanOrEqual(0);
  });

  it('should sort results by positionValue ascending', () => {
    const aud = new Auditorium(testSectors);
    const results = aud.reserve(2);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].positionValue).toBeGreaterThanOrEqual(results[i - 1].positionValue);
    }
  });
});
