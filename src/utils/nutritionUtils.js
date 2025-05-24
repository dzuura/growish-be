const calculateMaterialNutrients = (material, quantity) => {
  const factor = quantity / 100;
  return {
    calories: (material.calories || 0) * factor,
    protein: (material.protein || 0) * factor,
    total_fat: (material.total_fat || 0) * factor,
    saturated_fat: (material.saturated_fat || 0) * factor,
    trans_fat: (material.trans_fat || 0) * factor,
    cholesterol: (material.cholesterol || 0) * factor,
    carbohydrates: (material.carbohydrates || 0) * factor,
    sugar: (material.sugar || 0) * factor,
    fiber: (material.fiber || 0) * factor,
    natrium: (material.natrium || 0) * factor,
    amino_acid: (material.amino_acid || 0) * factor,
    vitamin_d: (material.vitamin_d || 0) * factor,
    magnesium: (material.magnesium || 0) * factor,
    iron: (material.iron || 0) * factor,
  };
};

const calculateRecipeNutrients = (materialsWithQuantity) => {
  return materialsWithQuantity.reduce((totals, { material, quantity }) => {
    const nutrients = calculateMaterialNutrients(material, quantity);
    return {
      calories: (totals.calories || 0) + nutrients.calories,
      protein: (totals.protein || 0) + nutrients.protein,
      total_fat: (totals.total_fat || 0) + nutrients.total_fat,
      saturated_fat: (totals.saturated_fat || 0) + nutrients.saturated_fat,
      trans_fat: (totals.trans_fat || 0) + nutrients.trans_fat,
      cholesterol: (totals.cholesterol || 0) + nutrients.cholesterol,
      carbohydrates: (totals.carbohydrates || 0) + nutrients.carbohydrates,
      sugar: (totals.sugar || 0) + nutrients.sugar,
      fiber: (totals.fiber || 0) + nutrients.fiber,
      natrium: (totals.natrium || 0) + nutrients.natrium,
      amino_acid: (totals.amino_acid || 0) + nutrients.amino_acid,
      vitamin_d: (totals.vitamin_d || 0) + nutrients.vitamin_d,
      magnesium: (totals.magnesium || 0) + nutrients.magnesium,
      iron: (totals.iron || 0) + nutrients.iron,
    };
  }, {});
};

module.exports = { calculateMaterialNutrients, calculateRecipeNutrients };