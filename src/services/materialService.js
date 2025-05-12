const supabaseResearcher = require('../config/supabase-researcher');

exports.categorizeMaterial = async (material) => {
  const { data: categories, error } = await supabaseResearcher.from('categories').select('*');
  if (error) throw new Error('Failed to fetch categories');

  const assignedCategories = [];
  for (const category of categories) {
    const fitsCategory =
      (!category.calories_min || material.calories >= category.calories_min) &&
      (!category.calories_max || material.calories <= category.calories_max) &&
      (!category.protein_min || material.protein >= category.protein_min) &&
      (!category.protein_max || material.protein <= category.protein_max) &&
      (!category.total_fat_min || material.total_fat >= category.total_fat_min) &&
      (!category.total_fat_max || material.total_fat <= category.total_fat_max) &&
      (!category.saturated_fat_min || material.saturated_fat >= category.saturated_fat_min) &&
      (!category.saturated_fat_max || material.saturated_fat <= category.saturated_fat_max) &&
      (!category.trans_fat_min || material.trans_fat >= category.trans_fat_min) &&
      (!category.trans_fat_max || material.trans_fat <= category.trans_fat_max) &&
      (!category.cholesterol_min || material.cholesterol >= category.cholesterol_min) &&
      (!category.cholesterol_max || material.cholesterol <= category.cholesterol_max) &&
      (!category.carbohydrates_min || material.carbohydrates >= category.carbohydrates_min) &&
      (!category.carbohydrates_max || material.carbohydrates <= category.carbohydrates_max) &&
      (!category.sugar_min || material.sugar >= category.sugar_min) &&
      (!category.sugar_max || material.sugar <= category.sugar_max) &&
      (!category.fiber_min || material.fiber >= category.fiber_min) &&
      (!category.fiber_max || material.fiber <= category.fiber_max) &&
      (!category.natrium_min || material.natrium >= category.natrium_min) &&
      (!category.natrium_max || material.natrium <= category.natrium_max) &&
      (!category.amino_acid_min || material.amino_acid >= category.amino_acid_min) &&
      (!category.amino_acid_max || material.amino_acid <= category.amino_acid_max) &&
      (!category.vitamin_d_min || material.vitamin_d >= category.vitamin_d_min) &&
      (!category.vitamin_d_max || material.vitamin_d <= category.vitamin_d_max) &&
      (!category.magnesium_min || material.magnesium >= category.magnesium_min) &&
      (!category.magnesium_max || material.magnesium <= category.magnesium_max) &&
      (!category.iron_min || material.iron >= category.iron_min) &&
      (!category.iron_max || material.iron <= category.iron_max);

    if (fitsCategory) {
      assignedCategories.push(category.id);
    }
  }

  return assignedCategories;
};