export const COLORS = {
  bg: '#050508',
  cyan: '#00ffff',
  pink: '#ff3366',
  orange: '#ffaa00',
  purple: '#aa44ff',
  green: '#00ff88',
  gold: '#ffd700',
  redBoss: '#ff2200',
};

export const GRID_SIZE = 40;
export const WIDTH = 50;
export const HEIGHT = 50;

export interface Entity {
  id: number;
  x: number;
  y: number;
  type: 'player' | 'mob' | 'projectile' | 'item';
  hp: number;
}
