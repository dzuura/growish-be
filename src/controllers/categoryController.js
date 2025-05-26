const supabaseResearcher = require("../config/supabase-researcher");
const { toCamelCase } = require("../utils/camelCaseUtils");

exports.createCategory = async (req, res) => {
  const {
    name,
    caloriesMin,
    caloriesMax,
    proteinMin,
    proteinMax,
    totalFatMin,
    totalFatMax,
    saturatedFatMin,
    saturatedFatMax,
    transFatMin,
    transFatMax,
    cholesterolMin,
    cholesterolMax,
    carbohydratesMin,
    carbohydratesMax,
    sugarMin,
    sugarMax,
    fiberMin,
    fiberMax,
    natriumMin,
    natriumMax,
    aminoAcidMin,
    aminoAcidMax,
    vitaminDMin,
    vitaminDMax,
    magnesiumMin,
    magnesiumMax,
    ironMin,
    ironMax,
  } = req.body;

  const categoryData = {
    name,
    calories_min: caloriesMin,
    calories_max: caloriesMax,
    protein_min: proteinMin,
    protein_max: proteinMax,
    total_fat_min: totalFatMin,
    total_fat_max: totalFatMax,
    saturated_fat_min: saturatedFatMin,
    saturated_fat_max: saturatedFatMax,
    trans_fat_min: transFatMin,
    trans_fat_max: transFatMax,
    cholesterol_min: cholesterolMin,
    cholesterol_max: cholesterolMax,
    carbohydrates_min: carbohydratesMin,
    carbohydrates_max: carbohydratesMax,
    sugar_min: sugarMin,
    sugar_max: sugarMax,
    fiber_min: fiberMin,
    fiber_max: fiberMax,
    natrium_min: natriumMin,
    natrium_max: natriumMax,
    amino_acid_min: aminoAcidMin,
    amino_acid_max: aminoAcidMax,
    vitamin_d_min: vitaminDMin,
    vitamin_d_max: vitaminDMax,
    magnesium_min: magnesiumMin,
    magnesium_max: magnesiumMax,
    iron_min: ironMin,
    iron_max: ironMax,
  };

  const { data, error } = await supabaseResearcher
    .from("categories")
    .insert(categoryData)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Category name already exists" });
    }
    return res.status(500).json({
      error: "Failed to add category",
      details: error.message,
    });
  }

  res.status(201).json({ 
    message: "Category added successfully", 
    data: toCamelCase(data) });
};

exports.getCategories = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseResearcher
    .from("categories")
    .select("*", { count: "exact" })
    .range(offset, offset + limit - 1);

  if (error)
    return res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message,
    });

  const mappedData = data.map((item) => toCamelCase(item));

  res.status(200).json({
    message: "List of categories",
    data: mappedData,
    pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(count / limit) },
  });
};

exports.getCategoryById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseResearcher
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return res.status(404).json({ error: "Category not found" });
    }
    return res.status(500).json({ 
      error: "Failed to fetch category", 
      details: error.message });
  }

  res.status(200).json({ 
    message: "Category retrieved successfully", 
    data: toCamelCase(data) });
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    caloriesMin,
    caloriesMax,
    proteinMin,
    proteinMax,
    totalFatMin,
    totalFatMax,
    saturatedFatMin,
    saturatedFatMax,
    transFatMin,
    transFatMax,
    cholesterolMin,
    cholesterolMax,
    carbohydratesMin,
    carbohydratesMax,
    sugarMin,
    sugarMax,
    fiberMin,
    fiberMax,
    natriumMin,
    natriumMax,
    aminoAcidMin,
    aminoAcidMax,
    vitaminDMin,
    vitaminDMax,
    magnesiumMin,
    magnesiumMax,
    ironMin,
    ironMax,
  } = req.body;

  const categoryData = {
    name,
    calories_min: caloriesMin,
    calories_max: caloriesMax,
    protein_min: proteinMin,
    protein_max: proteinMax,
    total_fat_min: totalFatMin,
    total_fat_max: totalFatMax,
    saturated_fat_min: saturatedFatMin,
    saturated_fat_max: saturatedFatMax,
    trans_fat_min: transFatMin,
    trans_fat_max: transFatMax,
    cholesterol_min: cholesterolMin,
    cholesterol_max: cholesterolMax,
    carbohydrates_min: carbohydratesMin,
    carbohydrates_max: carbohydratesMax,
    sugar_min: sugarMin,
    sugar_max: sugarMax,
    fiber_min: fiberMin,
    fiber_max: fiberMax,
    natrium_min: natriumMin,
    natrium_max: natriumMax,
    amino_acid_min: aminoAcidMin,
    amino_acid_max: aminoAcidMax,
    vitamin_d_min: vitaminDMin,
    vitamin_d_max: vitaminDMax,
    magnesium_min: magnesiumMin,
    magnesium_max: magnesiumMax,
    iron_min: ironMin,
    iron_max: ironMax,
  };

  const { data, error } = await supabaseResearcher
    .from("categories")
    .update(categoryData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Category name already exists" });
    }
    return res.status(500).json({ 
      error: "Failed to update category", 
      details: error.message });
  }

  res.status(200).json({ 
    message: "Category updated successfully", 
    data: toCamelCase(data) });
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseResearcher.from("categories").delete().eq("id", id);

  if (error)
    return res.status(500).json({
      error: "Failed to delete category",
      details: error.message,
    });

  res.status(200).json({ message: "Category deleted successfully" });
};