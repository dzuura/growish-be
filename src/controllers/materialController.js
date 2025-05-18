const supabaseResearcher = require("../config/supabase-researcher");
const supabaseNutritionist = require("../config/supabase-nutritionist");
const materialService = require("../services/materialService");

exports.getMaterials = async (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  const offset = (page - 1) * limit;

  const { data: availableCategories, error: catError } =
    await supabaseResearcher.from("categories").select("name");

  if (catError) {
    return res.status(500).json({
      error: "Failed to fetch available categories",
      details: catError.message,
    });
  }

  const availableCategoryNames = availableCategories.map((cat) => cat.name);

  if (category && category !== "all") {
    if (
      !availableCategoryNames
        .map((name) => name.toLowerCase())
        .includes(category.toLowerCase())
    ) {
      return res.status(400).json({
        error: `Category ${category} does not exist`,
        availableCategories: availableCategoryNames,
      });
    }
  }

  let query = supabaseResearcher.from("materials").select(
    `
      *,
      material_categories (
        category_id,
        categories (
          name
        )
      )
    `,
    { count: "exact" }
  );

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch materials", details: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "No materials found" });
  }

  let filteredData = data;
  if (category && category !== "all") {
    filteredData = data.filter((item) =>
      item.material_categories?.some(
        (mc) => mc.categories?.name?.toLowerCase() === category.toLowerCase()
      )
    );
  }

  if (filteredData.length === 0) {
    return res.status(404).json({
      error: `No materials found for category ${category}`,
      availableCategories: availableCategoryNames,
    });
  }

  const total = filteredData.length;
  const paginatedData = filteredData.slice(offset, offset + Number(limit));

  const mappedData = paginatedData.map((item) => {
    const categoryNames =
      item.material_categories
        ?.map((mc) => mc.categories?.name)
        .filter(Boolean) || [];

    const { material_categories, ...rest } = item;
    return {
      ...rest,
      categories: categoryNames,
    };
  });

  res.status(200).json({
    message: "List of materials",
    data: mappedData,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      totalPages: Math.ceil(total / limit),
    },
  });
};

exports.getMaterialStats = async (req, res) => {
  const { data: totalMaterials, error: totalError } = await supabaseResearcher
    .from("materials")
    .select("*", { count: "exact" });

  if (totalError)
    return res.status(500).json({ error: "Failed to fetch total materials" });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: newMaterials, error: newError } = await supabaseResearcher
    .from("materials")
    .select("*", { count: "exact" })
    .gte("created_at", sevenDaysAgo.toISOString());

  if (newError)
    return res.status(500).json({ error: "Failed to fetch new materials" });

  const { data: categories, error: catError } = await supabaseResearcher
    .from("categories")
    .select("name, material_categories!inner(material_id)");

  if (catError)
    return res.status(500).json({ error: "Failed to fetch categories" });

  const categoryStats = categories.map((cat) => ({
    name: cat.name,
    count: cat.material_categories.length,
  }));

  const { data: MaterialCategory, error: matCatError } =
    await supabaseResearcher
      .from("materials")
      .select("material_category")
      .not("material_category", "is", null);

  if (matCatError)
    return res.status(500).json({ error: "Failed to fetch material category" });

  const allCategories = MaterialCategory.flatMap(
    (mc) => mc.material_category || []
  );
  const totalMaterialCategory = new Set(allCategories).size;

  res.status(200).json({
    message: "Material statistics",
    data: {
      totalMaterials: totalMaterials.length,
      newMaterials: newMaterials.length,
      categoryStats,
      totalMaterialCategory: totalMaterialCategory,
    },
  });
};

exports.getMaterialById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseResearcher
    .from("materials")
    .select(
      `
      *,
      material_categories (
        category_id,
        categories (
          name
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch material", details: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "Material not found" });
  }

  const categoryNames =
    data.material_categories
      ?.map((mc) => mc.categories?.name)
      .filter(Boolean) || [];

  const { material_categories, ...rest } = data;
  const formattedData = {
    ...rest,
    categories: categoryNames,
  };

  res.status(200).json({
    message: "Material details",
    data: formattedData,
  });
};

exports.createMaterial = async (req, res) => {
  const {
    name,
    calories,
    protein,
    total_fat,
    saturated_fat,
    trans_fat,
    cholesterol,
    carbohydrates,
    sugar,
    fiber,
    natrium,
    amino_acid,
    vitamin_d,
    magnesium,
    iron,
    test_date,
    material_category,
    notes,
    source,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Material name is required" });
  }

  const material = {
    name,
    calories,
    protein,
    total_fat,
    saturated_fat,
    trans_fat,
    cholesterol,
    carbohydrates,
    sugar,
    fiber,
    natrium,
    amino_acid,
    vitamin_d,
    magnesium,
    iron,
    test_date,
    material_category,
    notes,
    source,
  };

  const { data, error } = await supabaseResearcher
    .from("materials")
    .insert(material)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Material name already exists" });
    }
    return res
      .status(500)
      .json({ error: "Failed to add material", details: error.message });
  }

  const categoryIds = await materialService.categorizeMaterial(material);
  if (!categoryIds || categoryIds.length === 0) {
    await supabaseResearcher.from("materials").delete().eq("id", data.id);
    return res.status(500).json({
      error: "Failed to categorize material, material creation rolled back",
    });
  }

  const materialCategories = categoryIds.map((category_id) => ({
    material_id: data.id,
    category_id,
  }));
  const { error: catError } = await supabaseResearcher
    .from("material_categories")
    .insert(materialCategories);

  if (catError) {
    await supabaseResearcher.from("materials").delete().eq("id", data.id);
    return res.status(500).json({
      error: "Failed to add material categories, material creation rolled back",
      details: catError.message,
    });
  }

  res.status(201).json({ message: "Material added successfully", data });
};

exports.updateMaterial = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    calories,
    protein,
    total_fat,
    saturated_fat,
    trans_fat,
    cholesterol,
    carbohydrates,
    sugar,
    fiber,
    natrium,
    amino_acid,
    vitamin_d,
    magnesium,
    iron,
    test_date,
    material_category,
    notes,
    source,
  } = req.body;

  if (name && typeof name !== "string") {
    return res.status(400).json({ error: "Material name must be a string" });
  }

  const material = {
    name,
    calories,
    protein,
    total_fat,
    saturated_fat,
    trans_fat,
    cholesterol,
    carbohydrates,
    sugar,
    fiber,
    natrium,
    amino_acid,
    vitamin_d,
    magnesium,
    iron,
    test_date,
    material_category,
    notes,
    source,
  };

  const { data, error } = await supabaseResearcher
    .from("materials")
    .update(material)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return res.status(400).json({ error: "Material name already exists" });
    }
    return res.status(404).json({ error: `Material with ID ${id} not found` });
  }

  await supabaseResearcher
    .from("material_categories")
    .delete()
    .eq("material_id", id);
  const categoryIds = await materialService.categorizeMaterial(material);
  if (!categoryIds || categoryIds.length === 0) {
    return res
      .status(500)
      .json({ error: "Failed to categorize material after update" });
  }

  const materialCategories = categoryIds.map((category_id) => ({
    material_id: id,
    category_id,
  }));
  const { error: catError } = await supabaseResearcher
    .from("material_categories")
    .insert(materialCategories);

  if (catError) {
    return res.status(500).json({
      error: "Failed to update material categories",
      details: catError.message,
    });
  }

  res.status(200).json({ message: "Material updated successfully", data });
};

exports.deleteMaterial = async (req, res) => {
  const { id } = req.params;

  const { data: material, error: checkError } = await supabaseResearcher
    .from("materials")
    .select("id")
    .eq("id", id)
    .single();

  if (checkError || !material) {
    return res.status(404).json({ error: `Material with ID ${id} not found` });
  }

  const { error } = await supabaseResearcher
    .from("materials")
    .delete()
    .eq("id", id);

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to delete material", details: error.message });
  }

  const { error: syncError } = await supabaseNutritionist
    .from("recipe_materials")
    .delete()
    .eq("material_id", id);

  if (syncError) {
    return res.status(500).json({
      error: "Failed to sync deletion with nutritionist system",
      details: syncError.message,
    });
  }

  res.status(200).json({ message: "Material deleted successfully" });
};