import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { Plus, Edit2, Boxes, CheckCircle2, CircleOff, Upload, X, Search, Filter } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Category, Product } from "@/data/mockData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCategories, createCategory, updateCategory, getProducts } from "@/lib/api";

function isCategoryActive(category: any): boolean {
  const raw = category?.is_active ?? category?.isActive ?? category?.active ?? category?.status;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw === 1;
  if (typeof raw === "string") {
    const value = raw.trim().toLowerCase();
    if (value === "true" || value === "1" || value === "active") return true;
    if (value === "false" || value === "0" || value === "inactive") return false;
  }
  return true;
}

const Categories = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isStatusSyncing, setIsStatusSyncing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    category: Category;
    nextStatus: boolean;
  } | null>(null);

  const normalizeCategory = (c: any): Category => ({
    id: c.id,
    name: c.name,
    description: c.description || "",
    image: c.image || c.imageUrl || c.image_url || c.categoryImage || "",
    is_active: isCategoryActive(c),
    created_at: c.created_at ?? c.createdAt ?? "",
  });

  const resetCategoryForm = () => {
    setSelectedCategory(null);
    setFormName("");
    setFormDescription("");
    setFormIsActive(true);
    setFormImageFile(null);
    setFormImagePreview("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleCategoryImageChange = (file: File | null) => {
    setFormImageFile(file);
    if (!file) {
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormImagePreview(String(event.target?.result ?? ""));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCategoryImage = () => {
    setFormImageFile(null);
    setFormImagePreview("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();
  const doesProductBelongToCategory = (product: Product, category: Category) => {
    if (product.category_id != null && category.id != null) {
      return Number(product.category_id) === Number(category.id);
    }
    return normalizeText(product.category) === normalizeText(category.name);
  };

  const fetchCategoriesList = async () => {
    const res: any = await getCategories();
    const categories =
      Array.isArray(res) ? res :
      Array.isArray(res?.data) ? res.data :
      Array.isArray(res?.categories) ? res.categories :
      Array.isArray(res?.content) ? res.content :
      Array.isArray(res?.data?.categories) ? res.data.categories :
      Array.isArray(res?.data?.content) ? res.data.content :
      [];
    setCategoriesList(categories.map(normalizeCategory));
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingList(true);
      try {
        const [catsResult, productsResult] = await Promise.allSettled([fetchCategoriesList(), getProducts()]);

        if (catsResult.status === "rejected") {
          setCategoriesList([]);
          console.error("Failed to fetch categories:", catsResult.reason);
          toast({
            title: "Error",
            description: "Failed to load categories.",
            variant: "destructive",
          });
        }

        if (productsResult.status === "fulfilled") {
          const res: any = productsResult.value;
          const products =
            Array.isArray(res) ? res :
            Array.isArray(res?.data) ? res.data :
            Array.isArray(res?.products) ? res.products :
            Array.isArray(res?.content) ? res.content :
            Array.isArray(res?.data?.products) ? res.data.products :
            Array.isArray(res?.data?.content) ? res.data.content :
            [];
          setProductsList(products);
        } else {
          setProductsList([]);
          console.error("Failed to fetch products:", productsResult.reason);
        }
      } catch (err) {
        console.error("Failed to fetch categories/products:", err);
      } finally {
        setIsLoadingList(false);
      }
    };
    fetchData();
  }, []);

  const handleEditCategory = (e: React.MouseEvent, category: Category) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || "");
    setFormIsActive(category.is_active ?? true);
    setFormImageFile(null);
    setFormImagePreview(category.image || "");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setShowModal(true);
  };

  const handleAddCategory = () => {
    resetCategoryForm();
    setShowModal(true);
  };

  const handleToggleStatus = (category: Category) => {
    const nextStatus = !(category.is_active ?? true);
    setPendingStatusChange({ category, nextStatus });
  };

  const handleConfirmCategoryStatusChange = async () => {
    if (!pendingStatusChange) return;

    const { category, nextStatus } = pendingStatusChange;

    setIsStatusSyncing(true);
    try {
      await updateCategory(category.id, {
        name: category.name,
        description: category.description || "",
        isActive: nextStatus,
      });

      setCategoriesList((prev) =>
        prev.map((cat) =>
          Number(cat.id) === Number(category.id)
            ? { ...cat, is_active: nextStatus }
            : cat
        )
      );

      setProductsList((prev) =>
        prev.map((product) =>
          doesProductBelongToCategory(product, category)
            ? { ...product, is_active: nextStatus }
            : product
        )
      );

      setSelectedCategory((prev) =>
        prev && Number(prev.id) === Number(category.id)
          ? { ...prev, is_active: nextStatus }
          : prev
      );
      setFormIsActive(nextStatus);

      toast({
        title: "Success",
        description: "Category and all products updated successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to update category and product statuses.",
        variant: "destructive",
      });
      setFormIsActive(selectedCategory?.is_active ?? true);
    } finally {
      setPendingStatusChange(null);
      setIsStatusSyncing(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!formName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required!",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (selectedCategory) {
        const payload = {
          name: formName,
          description: formDescription,
          isActive: formIsActive,
        };
        await updateCategory(selectedCategory.id, payload, formImageFile);
        await fetchCategoriesList();
        toast({
          title: "Success",
          description: `Category "${formName}" updated successfully!`,
        });
        setShowModal(false);
        setSelectedCategory(null);
      } else {
        // Add new category
        const payload = {
          name: formName,
          description: formDescription,
          isActive: formIsActive,
        };
        const res: any = await createCategory(payload, formImageFile);
        
        if (res.success || res.id) {
          await fetchCategoriesList();
          toast({
            title: "Success",
            description: `Category "${formName}" has been created successfully!`,
          });
          setShowModal(false);
          setSelectedCategory(null);
        } else {
          toast({ title: "Error", description: res.message || "Failed to create category", variant: "destructive" });
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Network error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Filtering and sorting
  const filtered = categoriesList.filter(c => {
    const searchTokens = searchTerm.toLowerCase().split(' ').filter(token => token.length > 0);
    
    const catMatches = searchTokens.length === 0 || searchTokens.every(token => 
      c.name.toLowerCase().includes(token) || (c.description?.toLowerCase().includes(token))
    );

    const categoryProducts = productsList.filter(p => doesProductBelongToCategory(p, c));
    const hasMatchingProduct = categoryProducts.some(p => {
      if (searchTokens.length === 0) return true;
      const productText = p.name.toLowerCase();
      if (searchTokens.every(token => productText.includes(token))) return true;
      return (p.variants || []).some(v => {
        const fullText = `${p.name} ${p.description} ${v.variant_name} ${v.sku}`.toLowerCase();
        return searchTokens.every(token => fullText.includes(token));
      });
    });

    const matchesSearch = catMatches || hasMatchingProduct;

    if (filterStatus === "Active") return matchesSearch && c.is_active;
    if (filterStatus === "Inactive") return matchesSearch && !c.is_active;
    return matchesSearch;
  }).sort((a, b) => Number(b.id) - Number(a.id)); // Newest first

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedCategories = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const productCountByCategory = categoriesList.reduce<Record<number, number>>((acc, category) => {
    acc[Number(category.id)] = productsList.filter(product => doesProductBelongToCategory(product, category)).length;
    return acc;
  }, {});

  const totalCategories = categoriesList.length;
  const activeCategoriesCount = categoriesList.filter((cat) => cat.is_active).length;
  const inactiveCategoriesCount = totalCategories - activeCategoriesCount;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-6">
        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div
              onClick={() => setFilterStatus("All")}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border cursor-pointer flex items-center justify-between transition-all duration-200 ${
                filterStatus === "All"
                  ? "border-green-500 shadow-md"
                  : "border-slate-200 dark:border-slate-800 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Boxes className="text-green-600 dark:text-green-400 w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">All Categories</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{totalCategories}</h2>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddCategory();
                }}
                className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 hover:scale-105 transition flex-shrink-0"
                aria-label="Add category"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div
              onClick={() => setFilterStatus("Active")}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border cursor-pointer flex items-center justify-between transition-all duration-200 ${
                filterStatus === "Active"
                  ? "border-green-500 shadow-md"
                  : "border-slate-200 dark:border-slate-800 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-green-600 dark:text-green-400 w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">Active Categories</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{activeCategoriesCount}</h2>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div
              onClick={() => setFilterStatus("Inactive")}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border cursor-pointer flex items-center justify-between transition-all duration-200 ${
                filterStatus === "Inactive"
                  ? "border-orange-400 shadow-md"
                  : "border-slate-200 dark:border-slate-800 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <CircleOff className="text-orange-500 dark:text-orange-400 w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">Inactive Categories</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{inactiveCategoriesCount}</h2>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 🔍 Search Bar - Full Width, Modern */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative"
        >
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/30 transition-all duration-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories…"
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
            />
            <Filter className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
          </div>
        </motion.div>

        {isLoadingList ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* 📋 Table - Minimal & Clean */}
            {filtered.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Products</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Active</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {paginatedCategories.map((cat) => (
                        <motion.tr
                          key={cat.id}
                          whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.02)" }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => {
                            window.location.href = `/svasthya/admin-side/category/${cat.name}`;
                          }}
                        >
                          {/* Image */}
                          <td className="px-6 py-4">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex-shrink-0 flex items-center justify-center">
                              {cat.image ? (
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                              ) : (
                                <Boxes className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </td>

                          {/* Name */}
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{cat.name}</span>
                          </td>

                          {/* Description */}
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px] inline-block">
                              {cat.description || "—"}
                            </span>
                          </td>

                          {/* Products Badge */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {productCountByCategory[Number(cat.id)] || 0} items
                            </span>
                          </td>

                          {/* Status Pill */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                              cat.is_active
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                : 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                cat.is_active ? 'bg-green-600 dark:bg-green-400' : 'bg-orange-600 dark:bg-orange-400'
                              }`} />
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Toggle Switch */}
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleStatus(cat)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                cat.is_active
                                  ? 'bg-primary'
                                  : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                  cat.is_active ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Edit Button */}
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => handleEditCategory(e, cat)}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Showing {paginatedCategories.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} categories
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Previous
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                <p className="text-sm">No categories found matching your search criteria.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal - Modern Design */}
      {showModal && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => !isSaving && setShowModal(false)} 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-50 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 mx-4"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
              {selectedCategory ? "Edit Category" : "Add Category"}
            </h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block uppercase tracking-wider">Category Image</label>
                {formImagePreview ? (
                  <div className="relative mb-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <img src={formImagePreview} alt="Category preview" className="h-40 w-full object-cover" />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      type="button"
                      onClick={handleRemoveCategoryImage}
                      className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="mb-2 h-6 w-6 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload image</span>
                    <span className="mt-1 text-xs text-slate-500">JPG, PNG or WebP</span>
                  </motion.button>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleCategoryImageChange(e.target.files?.[0] ?? null)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block uppercase tracking-wider">Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block uppercase tracking-wider">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20 transition-all"
                  placeholder="Category description"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      disabled={isStatusSyncing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:opacity-50" />
                  </div>
                  <span>{isStatusSyncing ? "Updating..." : "Active"}</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowModal(false);
                  resetCategoryForm();
                }} 
                disabled={isSaving || isStatusSyncing}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveCategory} 
                disabled={isSaving || isStatusSyncing}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : selectedCategory ? "Update" : "Create"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Status Change Confirmation */}
      <AlertDialog open={!!pendingStatusChange} onOpenChange={(isOpen) => { if (!isOpen && !isStatusSyncing) setPendingStatusChange(null); }}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white">
              {pendingStatusChange?.nextStatus ? "Activate Category" : "Deactivate Category"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              {pendingStatusChange?.nextStatus
                ? "Are you sure? This will activate this category and all its products."
                : "Are you sure? This will deactivate this category and all its products."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-700 dark:text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCategoryStatusChange}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isStatusSyncing ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Categories;
