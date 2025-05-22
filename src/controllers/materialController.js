const supabaseResearcher = require("../config/supabase-researcher");
const supabaseNutritionist = require("../config/supabase-nutritionist");
const materialService = require("../services/materialService");
const { sanitizeFilePath } = require("../utils/fileUtils");

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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

exports.getMyMaterials = async (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;

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

  let query = supabaseResearcher
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
    `,
      { count: "exact" }
    )
    .eq("user_id", userId);

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
    message: "List of my materials",
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
  const userId = req.user.id;

  const { data: totalMaterials, error: totalError } = await supabaseResearcher
    .from("materials")
    .select("*", { count: "exact" });

  if (totalError)
    return res.status(500).json({ error: "Failed to fetch total materials" });

  const { data: myMaterials, error: myError } = await supabaseResearcher
    .from("materials")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (myError)
    return res.status(500).json({ error: "Failed to fetch my materials" });

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
      myMaterials: myMaterials.length,
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
  const userId = req.user.id;
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

  let imageUrl = null;
  let uploadedFilePath = null;
  if (req.file) {
    const file = req.file;
    if (file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: `Image size exceeds 5MB limit` });
    }

    const sanitizedName = sanitizeFilePath(name);
    const timestamp = Date.now();
    uploadedFilePath = `${sanitizedName}/${timestamp}_${file.originalname}`;

    const { data, error: uploadError } = await supabaseResearcher.storage
      .from('materials-images')
      .upload(uploadedFilePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ error: "Failed to upload image", details: uploadError.message });
    }

    imageUrl = supabaseResearcher.storage
      .from('materials-images')
      .getPublicUrl(uploadedFilePath).data.publicUrl;
  }

  const material = {
    user_id: userId,
    name,
    image_url: imageUrl,
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
    if (uploadedFilePath) {
      await supabaseResearcher.storage
        .from('materials-images')
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error("Failed to clean up uploaded file:", removeError.message);
        });
    }
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
    if (uploadedFilePath) {
      await supabaseResearcher.storage
        .from('materials-images')
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error("Failed to clean up uploaded file:", removeError.message);
        });
    }
    return res.status(400).json({
      error: "No matching categories found for the material",
      details: "Please ensure categories with appropriate nutrient ranges exist",
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
    if (uploadedFilePath) {
      await supabaseResearcher.storage
        .from('materials-images')
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error("Failed to clean up uploaded file:", removeError.message);
        });
    }
    return res.status(500).json({
      error: "Failed to add material categories, material creation rolled back",
      details: catError.message,
    });
  }

  res.status(201).json({ message: "Material added successfully", data });
};

exports.updateMaterial = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
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

  const { data: material, error: checkError } = await supabaseResearcher
    .from("materials")
    .select("*")
    .eq("id", id)
    .single();

  if (checkError || !material) {
    return res.status(404).json({ error: `Material with ID ${id} not found` });
  }

  if (material.user_id !== userId) {
    return res.status(403).json({ error: "You can only edit materials you created" });
  }

  let imageUrl = material.image_url;
  let uploadedFilePath = null;
  if (req.file) {
    const file = req.file;
    if (file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: `Image size exceeds 5MB limit` });
    }

    if (imageUrl) {
      const pathStartIndex = imageUrl.indexOf('materials-images/') + 'materials-images/'.length;
      const oldPath = imageUrl.substring(pathStartIndex);
      const { error: removeError } = await supabaseResearcher.storage
        .from('materials-images')
        .remove([oldPath]);

      if (removeError) {
        return res.status(500).json({
          error: "Failed to remove old image",
          details: removeError.message,
        });
      }
    }

    const sanitizedName = sanitizeFilePath(name || material.name);
    const timestamp = Date.now();
    uploadedFilePath = `${sanitizedName}/${timestamp}_${file.originalname}`;

    const { data, error: uploadError } = await supabaseResearcher.storage
      .from('materials-images')
      .upload(uploadedFilePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ error: "Failed to upload image", details: uploadError.message });
    }

    imageUrl = supabaseResearcher.storage
      .from('materials-images')
      .getPublicUrl(uploadedFilePath).data.publicUrl;
  }

  const updatedMaterial = {
    name: name !== undefined ? name : material.name,
    image_url: imageUrl,
    calories: calories !== undefined ? calories : material.calories,
    protein: protein !== undefined ? protein : material.protein,
    total_fat: total_fat !== undefined ? total_fat : material.total_fat,
    saturated_fat: saturated_fat !== undefined ? saturated_fat : material.saturated_fat,
    trans_fat: trans_fat !== undefined ? trans_fat : material.trans_fat,
    cholesterol: cholesterol !== undefined ? cholesterol : material.cholesterol,
    carbohydrates: carbohydrates !== undefined ? carbohydrates : material.carbohydrates,
    sugar: sugar !== undefined ? sugar : material.sugar,
    fiber: fiber !== undefined ? fiber : material.fiber,
    natrium: natrium !== undefined ? natrium : material.natrium,
    amino_acid: amino_acid !== undefined ? amino_acid : material.amino_acid,
    vitamin_d: vitamin_d !== undefined ? vitamin_d : material.vitamin_d,
    magnesium: magnesium !== undefined ? magnesium : material.magnesium,
    iron: iron !== undefined ? iron : material.iron,
    test_date: test_date !== undefined ? test_date : material.test_date,
    material_category: material_category !== undefined ? material_category : material.material_category,
    notes: notes !== undefined ? notes : material.notes,
    source: source !== undefined ? source : material.source,
  };

  const { data, error } = await supabaseResearcher
    .from("materials")
    .update(updatedMaterial)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    if (uploadedFilePath) {
      await supabaseResearcher.storage
        .from('materials-images')
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error("Failed to clean up uploaded file:", removeError.message);
        });
    }
    if (error?.code === "23505") {
      return res.status(400).json({ error: "Material name already exists" });
    }
    return res.status(404).json({ error: `Material with ID ${id} not found` });
  }

  await supabaseResearcher
    .from("material_categories")
    .delete()
    .eq("material_id", id);
  const categoryIds = await materialService.categorizeMaterial(updatedMaterial);
  if (!categoryIds || categoryIds.length === 0) {
    if (uploadedFilePath) {
      await supabaseResearcher.storage
        .from('materials-images')
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error("Failed to clean up uploaded file:", removeError.message);
        });
    }
    return res.status(400).json({
      error: "No matching categories found for the material after update",
      details: "Please ensure categories with appropriate nutrient ranges exist",
    });
  }

  const materialCategories = categoryIds.map((category_id) => ({
    material_id: id,
    category_id,
  }));
  const { error: catError } = await supabaseResearcher
    .from("material_categories")
    .insert(materialCategories);

  if (catError) {
    if (uploadedFilePath) {
      await supabaseResearcher.storage
        .from('materials-images')
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error("Failed to clean up uploaded file:", removeError.message);
        });
    }
    return res.status(500).json({
      error: "Failed to update material categories",
      details: catError.message,
    });
  }

  res.status(200).json({ message: "Material updated successfully", data });
};

exports.deleteMaterial = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: material, error: checkError } = await supabaseResearcher
    .from("materials")
    .select("user_id, image_url")
    .eq("id", id)
    .single();

  if (checkError || !material) {
    return res.status(404).json({ error: `Material with ID ${id} not found` });
  }

  if (material.user_id !== userId) {
    return res.status(403).json({ error: "You can only delete materials you created" });
  }

  if (material.image_url) {
    const pathStartIndex = material.image_url.indexOf('materials-images/') + 'materials-images/'.length;
    const oldPath = material.image_url.substring(pathStartIndex);
    const { error: removeError } = await supabaseResearcher.storage
      .from('materials-images')
      .remove([oldPath]);

    if (removeError) {
      return res.status(500).json({
        error: "Failed to remove image from storage",
        details: removeError.message,
      });
    }
  }

  const { error: deleteError } = await supabaseResearcher
    .from("materials")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return res
      .status(500)
      .json({ error: "Failed to delete material", details: deleteError.message });
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