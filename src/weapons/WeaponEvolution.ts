export interface EvolutionRecipe {
  weaponId: string;
  requiresPassive: string;
  resultId: string;
  resultName: string;
}

export const EVOLUTION_RECIPES: EvolutionRecipe[] = [
  {
    weaponId: 'knife',
    requiresPassive: 'bracer',
    resultId: 'thousand_edge',
    resultName: 'Bin Kesik'
  },
  {
    weaponId: 'sword',
    requiresPassive: 'hollow_heart',
    resultId: 'bloody_tear',
    resultName: 'Kanlı Yırtık'
  },
  {
    weaponId: 'garlic',
    requiresPassive: 'pummarola',
    resultId: 'soul_eater',
    resultName: 'Ruh Yiyen'
  },
  {
    weaponId: 'holy_water',
    requiresPassive: 'spellbinder',
    resultId: 'divine_ground',
    resultName: 'İlahi Zemin'
  },
  {
    weaponId: 'cross_boomerang',
    requiresPassive: 'spinach',
    resultId: 'cross_storm',
    resultName: 'Çapraz Fırtına'
  }
];

export function getEvolution(weaponId: string, passiveIds: string[]): EvolutionRecipe | null {
  return EVOLUTION_RECIPES.find(
    r => r.weaponId === weaponId && passiveIds.includes(r.requiresPassive)
  ) ?? null;
}
