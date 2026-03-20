export const CANVAS = {
    WIDTH: 960,
    HEIGHT: 600,
};

export const WORLD = {
    WIDTH: 7000,
    SEA_LEVEL: 500,
    CARRIER_X: 800,
    CARRIER_WIDTH: 400,
    CARRIER_DECK_Y: 470,
    CARRIER_HULL_HEIGHT: 55,
    ISLAND_X: 4000,
    ISLAND_WIDTH: 2000,
    ISLAND_GROUND_Y: 460,
};

export const PLAYER = {
    WIDTH: 64,
    HEIGHT: 24,
    MAX_SPEED: 350,
    STALL_SPEED: 85,
    ACCELERATION: 120,
    BRAKE_DECELERATION: 130,
    PITCH_RATE: 1.9,
    MAX_PITCH: Math.PI / 4,
    GRAVITY: 300,
    GRAVITY_TORQUE: 0.55,
    FUEL_BURN_RATE: 2,
    MAX_FUEL: 100,
    MAX_HEALTH: 100,
    MAX_AMMO: 200,
    MAX_BOMBS: 2,
    SAFE_LANDING_SPEED: 100,
    SAFE_LANDING_ANGLE: 0.15,
    TAKEOFF_SPEED: 140,
    TAKEOFF_ACCELERATION: 135,
    TAKEOFF_LIFT: 220,
    DAMAGE_COOLDOWN: 0.7,
};

export const WEAPON = {
    GUN_COOLDOWN: 0.08,
    BULLET_SPEED: 600,
    BULLET_RANGE: 520,
    BULLET_W: 6,
    BULLET_H: 2,
    BULLET_DAMAGE: 1,
    BOMB_GRAVITY: 400,
    BOMB_SPLASH_RADIUS: 80,
    BOMB_DAMAGE: 10,
    BOMB_W: 8,
    BOMB_H: 12,
    BOMB_COOLDOWN: 0.25,
};

export const ENEMY = {
    PLANE_SPEED: 200,
    PLANE_HEALTH: 2,
    DETECT_RANGE: 500,
    PLANE_SHOOT_COOLDOWN: 0.5,
    TANK_RANGE: 300,
    TANK_BULLET_SPEED: 210,
    TANK_SHOOT_COOLDOWN: 1.5,
    MAX_ENEMIES: 3,
    SPAWN_SCORE_STEP: 150,
    SCORE_TROOP: 10,
    SCORE_TRUCK: 25,
    SCORE_TANK: 50,
    SCORE_PLANE: 100,
};

export const REARM = {
    DURATION: 2.5,
    FUEL_RATE: 50,
    AMMO_RATE: 100,
    HEALTH_RESTORE: 30,
};

export const SHAKE = {
    DURATION_FRAMES: 10,
    INTENSITY: 5,
};

export const STATES = {
    TITLE: 'title',
    TAKEOFF: 'takeoff',
    FLYING: 'flying',
    LANDING: 'landing',
    REARMING: 'rearming',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
};

export const COLORS = {
    SKY_TOP: '#1a1a4e',
    SKY_BOTTOM: '#87CEEB',
    SEA: '#0d3b6e',
    SEA_HIGHLIGHT: '#1a5f9e',
    CLOUD: 'rgba(255,255,255,0.75)',
    PLAYER: '#3d4c2e',
    PLAYER_COCKPIT: '#7ec8e3',
    ENEMY: '#8b1a1a',
    ENEMY_DARK: '#5a0f0f',
    CARRIER_DECK: '#68717b',
    CARRIER_HULL: '#3f4954',
    ISLAND: '#4c6d3f',
    BEACH: '#d8c28a',
    HUD_BG: 'rgba(0, 0, 0, 0.45)',
    HUD_TEXT: '#f8f8f8',
};
